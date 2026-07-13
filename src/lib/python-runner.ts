"use client";

import type { WriteCodeExercise } from "@/types/course";

export type ExecutionResult = {
  ok: boolean;
  output: string;
  variables?: Record<string, string | number | boolean | null>;
  inputsConsumed?: number;
  errorType?: "syntax" | "runtime";
  error?: string;
};

export type CheckResult = {
  status: "syntax-error" | "runtime-error" | "incorrect" | "partial" | "correct";
  message: string;
  output: string;
  passed: number;
  total: number;
  executionError?: string;
};

type PendingRun = {
  resolve: (result: ExecutionResult) => void;
  timer: ReturnType<typeof setTimeout>;
};

const pendingRuns = new Map<number, PendingRun>();
const EXECUTION_TIMEOUT_MS = 12_000;
let worker: Worker | null = null;
let runId = 0;

function runtimeFailure(error: string): ExecutionResult {
  return { ok: false, output: "", errorType: "runtime", error };
}

function stopWorker(error: string) {
  worker?.terminate();
  worker = null;
  for (const pending of pendingRuns.values()) {
    clearTimeout(pending.timer);
    pending.resolve(runtimeFailure(error));
  }
  pendingRuns.clear();
}

function getWorker() {
  if (!worker) {
    worker = new Worker("/python-worker.mjs", { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; result: ExecutionResult }>) => {
      const pending = pendingRuns.get(event.data.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingRuns.delete(event.data.id);
      pending.resolve(event.data.result);
    };
    worker.onerror = (event) => stopWorker(event.message || "Python could not start in this browser.");
  }
  return worker;
}

export async function runPython(code: string, inputs: string[] = [], captureVariables: string[] = []): Promise<ExecutionResult> {
  if (typeof Worker === "undefined") return runtimeFailure("This browser cannot run Python workers.");
  const id = ++runId;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!pendingRuns.has(id)) return;
      stopWorker("Execution timed out. Check whether every loop can eventually end.");
    }, EXECUTION_TIMEOUT_MS);
    pendingRuns.set(id, { resolve, timer });
    getWorker().postMessage({ id, code, inputs, captureVariables });
  });
}

function normaliseOutput(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n$/, "");
}

function codeOnly(value: string) {
  return value
    .replace(/(?:[rubf]{0,2})(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gi, '""')
    .replace(/#.*$/gm, "");
}

function hasNestedStatement(code: string, statement: RegExp) {
  const activeIndents: number[] = [];
  for (const sourceLine of code.split("\n")) {
    if (!sourceLine.trim()) continue;
    const indentation = sourceLine.match(/^\s*/)?.[0].replaceAll("\t", "    ").length ?? 0;
    const line = sourceLine.trim();
    const continuesSelection = /^(?:elif\b|else\s*:)/.test(line);
    while (activeIndents.length && (continuesSelection ? activeIndents.at(-1)! > indentation : activeIndents.at(-1)! >= indentation)) {
      activeIndents.pop();
    }
    if (statement.test(line)) {
      if (activeIndents.some((outerIndent) => outerIndent < indentation)) return true;
      activeIndents.push(indentation);
    }
  }
  return false;
}

function hasStatementInsideBlock(code: string, block: RegExp, statement: RegExp) {
  const lines = code.split("\n");
  return lines.some((line, index) => {
    if (!block.test(line.trim())) return false;
    const blockIndent = line.match(/^\s*/)?.[0].replaceAll("\t", "    ").length ?? 0;
    for (const bodyLine of lines.slice(index + 1)) {
      if (!bodyLine.trim()) continue;
      const indentation = bodyLine.match(/^\s*/)?.[0].replaceAll("\t", "    ").length ?? 0;
      if (indentation <= blockIndent) break;
      if (statement.test(bodyLine.trim())) return true;
    }
    return false;
  });
}

function hasStatementInsideNestedLoop(code: string, statement: RegExp) {
  const activeLoopIndents: number[] = [];
  for (const sourceLine of code.split("\n")) {
    if (!sourceLine.trim()) continue;
    const indentation = sourceLine.match(/^\s*/)?.[0].replaceAll("\t", "    ").length ?? 0;
    const line = sourceLine.trim();
    while (activeLoopIndents.length && activeLoopIndents.at(-1)! >= indentation) activeLoopIndents.pop();
    if (/^(?:for\s+\w+\s+in|while\s+).+:/.test(line)) {
      activeLoopIndents.push(indentation);
      continue;
    }
    if (activeLoopIndents.length >= 2 && statement.test(line)) return true;
  }
  return false;
}

function definedFunctionNames(code: string) {
  return [...code.matchAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm)].map((match) => match[1]);
}

function hasDefinedCall(code: string) {
  return definedFunctionNames(code).some((name) => (code.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0) >= 2);
}

function hasAssignedDefinedCall(code: string) {
  return definedFunctionNames(code).some((name) =>
    new RegExp(`^\\s*[A-Za-z_]\\w*\\s*=.*\\b${name}\\s*\\(`, "m").test(code),
  );
}

function hasCalledFunctionBodyStatement(code: string, statement: RegExp) {
  const lines = code.split("\n");
  return lines.some((line, index) => {
    const definition = line.match(/^(\s*)def\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*:/);
    if (!definition) return false;
    const [, rawIndent, name] = definition;
    if ((code.match(new RegExp(`\\b${name}\\s*\\(`, "g"))?.length ?? 0) < 2) return false;
    const definitionIndent = rawIndent.replaceAll("\t", "    ").length;
    for (const bodyLine of lines.slice(index + 1)) {
      if (!bodyLine.trim()) continue;
      const indentation = bodyLine.match(/^\s*/)?.[0].replaceAll("\t", "    ").length ?? 0;
      if (indentation <= definitionIndent) break;
      if (statement.test(bodyLine.trim())) return true;
    }
    return false;
  });
}

function hasUsedParameters(code: string) {
  const lines = code.split("\n");
  return lines.some((line, index) => {
    const definition = line.match(/^(\s*)def\s+[A-Za-z_]\w*\s*\(([^)]*)\)\s*:/);
    if (!definition) return false;
    const definitionIndent = definition[1].replaceAll("\t", "    ").length;
    const parameters = definition[2].split(",").map((parameter) => parameter.trim().split(/[=:]/)[0].trim()).filter(Boolean);
    if (parameters.length === 0) return false;
    const body: string[] = [];
    for (const bodyLine of lines.slice(index + 1)) {
      if (!bodyLine.trim()) continue;
      const indentation = bodyLine.match(/^\s*/)?.[0].replaceAll("\t", "    ").length ?? 0;
      if (indentation <= definitionIndent) break;
      body.push(bodyLine);
    }
    const bodyCode = body.join("\n");
    return parameters.every((parameter) => {
      const used = new RegExp(`\\b${parameter}\\b`).test(bodyCode);
      const overwrittenByInput = new RegExp(`^\\s*${parameter}\\s*=.*\\binput\\s*\\(`, "m").test(bodyCode);
      return used && !overwrittenByInput;
    });
  });
}

function hasGlobalUpdate(code: string) {
  const lines = code.split("\n");
  return lines.some((line, index) => {
    const definition = line.match(/^(\s*)def\s+[A-Za-z_]\w*\s*\([^)]*\)\s*:/);
    if (!definition) return false;
    const definitionIndent = definition[1].replaceAll("\t", "    ").length;
    const body: string[] = [];
    for (const bodyLine of lines.slice(index + 1)) {
      if (!bodyLine.trim()) continue;
      const indentation = bodyLine.match(/^\s*/)?.[0].replaceAll("\t", "    ").length ?? 0;
      if (indentation <= definitionIndent) break;
      body.push(bodyLine.trim());
    }
    const bodyCode = body.join("\n");
    const names = [...bodyCode.matchAll(/^global\s+([A-Za-z_]\w*)/gm)].map((match) => match[1]);
    return names.some((name) => new RegExp(`^${name}\\s*(?:[+\\-*/]?=)`, "m").test(bodyCode));
  });
}

const constructChecks: Record<string, (code: string) => boolean> = {
  print: (code) => /\bprint\s*\(/.test(code),
  input: (code) => /\binput\s*\(/.test(code),
  int: (code) => /\bint\s*\(/.test(code),
  float: (code) => /\bfloat\s*\(/.test(code),
  variable: (code) => /^[ \t]*[A-Za-z_]\w*[ \t]*=(?!=)/m.test(code),
  update: (code) => /\b([A-Za-z_]\w*)\s*\+=/.test(code) || /\b([A-Za-z_]\w*)\s*=\s*\1\s*\+/.test(code),
  concatenation: (code) => /(?:print\([^\n]*\+|=\s*[^\n]*\+)/m.test(code),
  arithmetic: (code) => /[+\-*/%]|\/\//.test(code),
  mod: (code) => /%/.test(code),
  div: (code) => /\/\//.test(code),
  power: (code) => /\*\*/.test(code),
  if: (code) => /^\s*if\s+.+:/m.test(code),
  "nested-if": (code) => hasNestedStatement(code, /^if\s+.+:/),
  elif: (code) => /^\s*elif\s+.+:/m.test(code),
  else: (code) => /^\s*else\s*:/m.test(code),
  boolean: (code) => /\b(?:and|or|not)\b/.test(code),
  comparison: (code) => /(?:==|!=|<=|>=|<|>)/.test(code),
  for: (code) => /^\s*for\s+\w+\s+in\s+range\s*\(/m.test(code),
  while: (code) => /^\s*while\s+.+:/m.test(code),
  loop: (code) => /^\s*(?:for\s+\w+\s+in|while\s+).+:/m.test(code),
  "nested-loop": (code) => hasNestedStatement(code, /^(?:for\s+\w+\s+in|while\s+).+:/),
  "print-in-for": (code) => hasStatementInsideBlock(code, /^for\s+\w+\s+in\s+range\s*\(.+:/, /^print\s*\(/),
  "print-in-while": (code) => hasStatementInsideBlock(code, /^while\s+.+:/, /^print\s*\(/),
  "input-in-loop": (code) => hasStatementInsideBlock(code, /^(?:for\s+\w+\s+in|while\s+).+:/, /\binput\s*\(/),
  "update-in-loop": (code) => hasStatementInsideBlock(code, /^(?:for\s+\w+\s+in|while\s+).+:/, /\b([A-Za-z_]\w*)\s*(?:\+=|=\s*\1\s*\+)/),
  "index-in-loop": (code) => hasStatementInsideBlock(code, /^(?:for\s+\w+\s+in|while\s+).+:/, /\b\w+\s*\[[^\]]+\]/),
  "append-in-loop": (code) => hasStatementInsideBlock(code, /^(?:for\s+\w+\s+in|while\s+).+:/, /\.append\s*\(/),
  "print-in-nested-loop": (code) => hasStatementInsideNestedLoop(code, /^print\s*\(/),
  break: (code) => /^\s+break\b/m.test(code),
  list: (code) => /\[[^\]]*\]/.test(code),
  index: (code) => /\b\w+\s*\[[^\]]+\]/.test(code),
  len: (code) => /\blen\s*\(/.test(code),
  slice: (code) => /\b\w+\s*\[[^\]]*:[^\]]*\]/.test(code),
  "string-method": (code) => /\.(?:upper|lower)\s*\(/.test(code),
  ascii: (code) => /\b(?:ord|chr)\s*\(/.test(code),
  ord: (code) => /\bord\s*\(/.test(code),
  chr: (code) => /\bchr\s*\(/.test(code),
  append: (code) => /\.append\s*\(/.test(code),
  function: hasDefinedCall,
  call: hasDefinedCall,
  "procedure-output": (code) => hasCalledFunctionBodyStatement(code, /^print\s*\(/),
  parameter: hasUsedParameters,
  return: (code) => /^\s+return\b/m.test(code),
  "return-used": hasAssignedDefinedCall,
  global: hasGlobalUpdate,
  open: (code) => /\bopen\s*\(/.test(code),
  "file-read": (code) => /\.(?:read|readline|readlines)\s*\(/.test(code) || /for\s+\w+\s+in\s+\w+\s*:/.test(code),
  "file-write": (code) => /\.write\s*\(/.test(code),
  random: (code) => /\brandom\.(?:randint|randrange)\s*\(/.test(code),
};

function constructLabel(construct: string) {
  return ({
    print: "a print() instruction",
    input: "input()",
    int: "int() to cast the input",
    float: "float() to cast the input",
    variable: "a variable assignment",
    update: "an update that uses the variable's previous value",
    concatenation: "the + operator to concatenate strings",
    arithmetic: "an arithmetic operator",
    mod: "the % (MOD) operator",
    div: "the // (DIV) operator",
    power: "the ** power operator",
    if: "an if statement",
    "nested-if": "an if statement inside another if statement",
    elif: "an elif branch",
    else: "an else branch",
    boolean: "and, or or not in a Boolean expression",
    comparison: "a comparison operator",
    for: "a for loop with range()",
    while: "a while loop",
    loop: "a loop",
    "nested-loop": "one loop inside another",
    "print-in-for": "print() inside the for-loop body",
    "print-in-while": "print() inside the while-loop body",
    "input-in-loop": "input() inside the loop body",
    "update-in-loop": "the counter or accumulator update inside the loop body",
    "index-in-loop": "indexed access inside the loop body",
    "append-in-loop": ".append() inside the loop body",
    "print-in-nested-loop": "print() inside the nested-loop body",
    break: "break to finish the post-test loop",
    list: "a Python list",
    index: "an indexed value",
    len: "len()",
    slice: "a string or list slice",
    "string-method": ".upper() or .lower()",
    ascii: "ord() or chr()",
    ord: "ord() to convert the character into its numeric code",
    chr: "chr() to convert the numeric code back into a character",
    append: ".append()",
    function: "a def statement and a call to that subroutine",
    call: "a call to the subroutine you defined",
    "procedure-output": "the required print() instruction inside the procedure body",
    parameter: "a parameter in the subroutine definition and use it in the solution",
    return: "a return statement—printing a value does not return it",
    "return-used": "an assignment that stores the result of the function you defined",
    global: "a global declaration and update inside the subroutine",
    open: "open() for file handling",
    "file-read": "a file read operation",
    "file-write": "a file write operation",
    random: "random.randint() or random.randrange()",
  } as Record<string, string>)[construct] ?? construct;
}

function misconceptionMessage(code: string, exercise: WriteCodeExercise) {
  if (exercise.requiredConstructs.includes("int") && !/\bint\s*\(/.test(code)) {
    return "Check whether the value entered by the user needs to be converted to an integer.";
  }
  if (exercise.requiredConstructs.includes("concatenation") && /print\([^)]*,/.test(code)) {
    return "A comma separates printed items in Python, but this task is checking concatenation. Join the strings with +.";
  }
  if (/=\s*\+\s*1/.test(code)) {
    return "The pattern =+ 1 replaces the value with positive 1. Use the variable's old value on the right-hand side.";
  }
  if (exercise.requiredConstructs.includes("boolean") && /\b(?:or|and)\s+["'][^"']+["']/.test(code)) {
    return "Repeat the variable in every comparison. Write room == \"basic\" or room == \"premium\", not room == \"basic\" or \"premium\".";
  }
  if (exercise.requiredConstructs.includes("loop") || exercise.requiredConstructs.includes("for") || exercise.requiredConstructs.includes("while")) {
    const lines = code.split("\n");
    const resetInsideLoop = lines.some((line, index) => {
      const loopMatch = line.match(/^(\s*)(?:for\s+\w+\s+in|while\s+).+:/);
      if (!loopMatch) return false;
      const loopIndent = loopMatch[1].length;
      return lines.slice(index + 1).some((bodyLine) => {
        if (!bodyLine.trim()) return false;
        const indentation = bodyLine.match(/^\s*/)?.[0].length ?? 0;
        if (indentation <= loopIndent) return false;
        return /^(?:total|count|counter|sum|passes)\s*=\s*0\s*$/.test(bodyLine.trim());
      });
    });
    if (resetInsideLoop) {
      return "Check where the counter or accumulator is initialised. Putting = 0 inside the loop resets the progress on every iteration.";
    }
  }
  if (exercise.requiredConstructs.includes("parameter")) {
    const parameter = code.match(/^\s*def\s+\w+\s*\(\s*([A-Za-z_]\w*)/m)?.[1];
    if (parameter && new RegExp(`^\\s+${parameter}\\s*=\\s*input\\s*\\(`, "m").test(code)) {
      return `Use the ${parameter} parameter passed into the subroutine. Do not overwrite it with input().`;
    }
  }
  return "Your program runs, but it produces a different output. Check every space, capital letter and line break.";
}

export function validateRequiredConstructs(code: string, requiredConstructs: string[]) {
  const checkedCode = codeOnly(code);
  for (const construct of requiredConstructs) {
    const check = constructChecks[construct];
    if (check && !check(checkedCode)) return `Your program needs to use ${constructLabel(construct)}.`;
  }
  return undefined;
}

export async function checkPython(code: string, exercise: WriteCodeExercise): Promise<CheckResult> {
  if (exercise.restrictedPatterns.includes("no-hardcoded-answer")) {
    const tests = [exercise.visibleExample, ...exercise.hiddenTests];
    const checkedCode = codeOnly(code);
    const receivesTestInput = tests.some((test) => test.input.length > 0);
    const inputCalls = checkedCode.match(/\binput\s*\(/g)?.length ?? 0;
    const onlyDiscardedInputs = inputCalls > 0 && checkedCode.split("\n")
      .filter((line) => /\binput\s*\(/.test(line))
      .every((line) => /^\s*input\s*\([^)]*\)\s*$/.test(line));
    if (receivesTestInput && (inputCalls === 0 || onlyDiscardedInputs)) {
      return {
        status: "incorrect",
        message: "Use the supplied input in your solution instead of discarding it or hardcoding an answer.",
        output: "",
        passed: 0,
        total: tests.length,
      };
    }
  }

  const constructMessage = validateRequiredConstructs(code, exercise.requiredConstructs);
  if (constructMessage) {
    return {
      status: "incorrect",
      message: constructMessage,
      output: "",
      passed: 0,
      total: exercise.hiddenTests.length + 1,
    };
  }

  const tests = [exercise.visibleExample, ...exercise.hiddenTests];
  let passed = 0;
  let visibleOutput = "";
  let leftInputUnused = false;

  for (let index = 0; index < tests.length; index += 1) {
    const test = tests[index];
    const expectedVariables = test.expectedVariables ?? {};
    const result = await runPython(code, test.input, Object.keys(expectedVariables));
    if (index === 0) visibleOutput = result.output;
    if (!result.ok) {
      const timedOut = result.error?.startsWith("Execution timed out");
      return {
        status: result.errorType === "syntax" ? "syntax-error" : "runtime-error",
        message: result.errorType === "syntax" ? "Python found a syntax error. Check the highlighted line and punctuation." : timedOut ? "Your program took too long to finish. Check whether every loop can eventually end." : "The program started but stopped with a runtime error.",
        output: result.output,
        passed,
        total: tests.length,
        executionError: result.error,
      };
    }
    const outputMatches = normaliseOutput(result.output) === normaliseOutput(test.expectedOutput);
    const variablesMatch = Object.entries(expectedVariables).every(
      ([name, expected]) => result.variables?.[name] === expected,
    );
    const inputsMatch = !exercise.restrictedPatterns.includes("no-hardcoded-answer") || result.inputsConsumed === test.input.length;
    if (outputMatches && variablesMatch && !inputsMatch) leftInputUnused = true;
    if (outputMatches && variablesMatch && inputsMatch) passed += 1;
  }

  if (passed === tests.length) {
    return {
      status: "correct",
      message: exercise.successMessage,
      output: visibleOutput,
      passed,
      total: tests.length,
    };
  }

  if (passed > 0) {
    return {
      status: "partial",
      message: leftInputUnused ? "Your output is right for some tests, but the program stops before using every supplied input. Check the loop condition." : "Your solution works for the example, but not for every test case. Check that you use the input instead of a fixed answer.",
      output: visibleOutput,
      passed,
      total: tests.length,
    };
  }

  return {
    status: "incorrect",
    message: leftInputUnused ? "The displayed output matches, but the program did not use every supplied input. Check that the input remains inside the loop." : misconceptionMessage(code, exercise),
    output: visibleOutput,
    passed,
    total: tests.length,
  };
}
