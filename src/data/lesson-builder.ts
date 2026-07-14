import type { CodeLanguage, Exercise, Lesson, RequiredConstruct } from "@/types/course";

type HintTriple = [string, string, string];

type ExampleSeed = {
  title: string;
  context: string;
  erl: string;
  python: string;
  notes: { line: string; explanation: string }[];
};

type CodeTaskSeed = {
  title: string;
  instructions: string;
  starterCode: string;
  exampleInput?: string[];
  exampleOutput: string;
  hiddenTests: { input?: string[]; expectedOutput: string; expectedVariables?: Record<string, string | number | boolean> }[];
  requiredConstructs?: RequiredConstruct[];
  restrictedPatterns?: string[];
  successMessage: string;
  /** Optional full hint override. Otherwise hint 3 is generated from the target output / constructs. */
  hints?: HintTriple;
};

export type LessonSeed = Omit<Lesson, "examples" | "exercises"> & {
  examples: ExampleSeed[];
  predict: {
    language: CodeLanguage;
    code: string;
    expectedOutput: string;
    instructions?: string;
    misconceptionFeedback?: Record<string, string>;
    hints?: HintTriple;
  };
  debug: {
    language: CodeLanguage;
    code: string;
    errorKind: "syntax" | "runtime" | "logic";
    expectedFix: string;
    acceptedFixes?: string[];
    feedback: string;
    hints?: HintTriple;
  };
  complete: {
    language: CodeLanguage;
    instructions: string;
    codeParts: string[];
    answers: string[][];
    /** Short teaching explanation shown after a correct fill. */
    feedback: string;
    hints?: HintTriple;
  };
  guided: CodeTaskSeed;
  independent: CodeTaskSeed;
  review: {
    question: string;
    options: string[];
    answer: number;
    correctFeedback: string;
    incorrectFeedback?: Record<string, string>;
    hints?: HintTriple;
  };
  extraExercises?: Exercise[];
};

const defaultHints = {
  trace: [
    "Read one line at a time and keep an exact note of what is displayed.",
    "Only include output created by a print instruction — spelling and line breaks matter.",
    "Work through the values on paper, then copy the final output exactly.",
  ],
  fix: [
    "Decide whether the program cannot run or runs with the wrong result.",
    "Compare the faulty line with the matching pattern in the worked examples.",
    "Replace only the faulty line; keep the program's intended result the same.",
  ],
  complete: [
    "Say the missing piece aloud in plain English first.",
    "Look for the matching keyword or operator in the examples above.",
    "Use the shape of the surrounding code to complete the missing part.",
  ],
  write: [
    "Break the problem into input, process and output steps.",
    "Use the starter comments as a checklist for each line.",
    "Borrow the structure of the worked example and change its values or names.",
  ],
  review: [
    "Recall the definition before looking back at the code.",
    "Remove answers that describe a different programming concept.",
    "Use the exact OCR wording from the lesson's vocabulary section.",
  ],
} satisfies Record<string, HintTriple>;

function compactOutput(output: string) {
  return output.replace(/\r\n/g, "\n").replace(/\n/g, " ↵ ");
}

function compactCode(code: string) {
  return code
    .split("\n")
    .map((line) => line.trimEnd())
    .join(" → ");
}

function fillAnswers(answers: string[][]) {
  return answers
    .map((options) => (options.length === 1 ? options[0] : options.map((option) => `\`${option}\``).join(" or ")))
    .join("; then ");
}

function constructList(constructs: RequiredConstruct[] | undefined) {
  if (!constructs?.length) return null;
  return constructs.join(", ");
}

function withHint3(defaults: HintTriple, hint3: string, override?: HintTriple): HintTriple {
  if (override) return override;
  return [defaults[0], defaults[1], hint3];
}

function fixHint3(debug: LessonSeed["debug"]) {
  const fix = compactCode(debug.expectedFix);
  return `${debug.feedback} Corrected program shape: ${fix}.`;
}

function traceHint3(predict: LessonSeed["predict"]) {
  return `Almost there — match this exact output (including spaces and line breaks): ${compactOutput(predict.expectedOutput)}.`;
}

function completeHint3(complete: LessonSeed["complete"]) {
  return `Fill the blank(s) with: ${fillAnswers(complete.answers)}.`;
}

function writeHint3(task: CodeTaskSeed) {
  const constructs = constructList(task.requiredConstructs);
  const output = compactOutput(task.exampleOutput);
  return constructs
    ? `Your solution should use: ${constructs}. Aim for output like: ${output}.`
    : `Aim for output like: ${output}. Keep the same structure as the starter comments.`;
}

function reviewHint3(review: LessonSeed["review"]) {
  const choice = review.options[review.answer];
  return `Choose: “${choice}”. ${review.correctFeedback}`;
}

export function buildLesson(seed: LessonSeed): Lesson {
  const id = seed.slug;
  return {
    ...seed,
    examples: seed.examples.map((example, index) => ({ ...example, id: `${id}-example-${index + 1}` })),
    exercises: [
      {
        id: `${id}-predict`,
        exercise_type: "predict_output",
        stage: "trace",
        title: "Predict the output",
        instructions: seed.predict.instructions ?? "Give the exact output produced by this code.",
        hints: withHint3(defaultHints.trace, traceHint3(seed.predict), seed.predict.hints),
        knowledgeWeight: 0.8,
        applicationWeight: 0.2,
        language: seed.predict.language,
        code: seed.predict.code,
        expectedOutput: seed.predict.expectedOutput,
        misconceptionFeedback: seed.predict.misconceptionFeedback,
      },
      {
        id: `${id}-debug`,
        exercise_type: "debug_code",
        stage: "fix",
        title: "Find and fix the error",
        instructions: "Identify the error type, then write the corrected code.",
        hints: withHint3(defaultHints.fix, fixHint3(seed.debug), seed.debug.hints),
        knowledgeWeight: 0.5,
        applicationWeight: 0.5,
        language: seed.debug.language,
        code: seed.debug.code,
        errorKind: seed.debug.errorKind,
        expectedFix: seed.debug.expectedFix,
        acceptedFixes: seed.debug.acceptedFixes ?? [],
        feedback: seed.debug.feedback,
      },
      {
        id: `${id}-complete`,
        exercise_type: "fill_blank",
        stage: "complete",
        title: "Complete the program",
        hints: withHint3(defaultHints.complete, completeHint3(seed.complete), seed.complete.hints),
        knowledgeWeight: 0.45,
        applicationWeight: 0.55,
        language: seed.complete.language,
        instructions: seed.complete.instructions,
        codeParts: seed.complete.codeParts,
        answers: seed.complete.answers,
        feedback: seed.complete.feedback,
      },
      {
        id: `${id}-guided`,
        exercise_type: "write_code",
        stage: "write",
        language: "python",
        hints: withHint3(defaultHints.write, writeHint3(seed.guided), seed.guided.hints),
        knowledgeWeight: 0.35,
        applicationWeight: 0.65,
        starterCode: seed.guided.starterCode,
        visibleExample: {
          input: seed.guided.exampleInput ?? [],
          expectedOutput: seed.guided.exampleOutput,
        },
        hiddenTests: seed.guided.hiddenTests.map((test) => ({ input: test.input ?? [], expectedOutput: test.expectedOutput, expectedVariables: test.expectedVariables })),
        requiredConstructs: seed.guided.requiredConstructs ?? [],
        restrictedPatterns: seed.guided.restrictedPatterns ?? [],
        title: seed.guided.title,
        instructions: seed.guided.instructions,
        successMessage: seed.guided.successMessage,
      },
      {
        id: `${id}-independent`,
        exercise_type: "write_code",
        stage: "write",
        language: "python",
        hints: withHint3(defaultHints.write, writeHint3(seed.independent), seed.independent.hints),
        knowledgeWeight: 0.2,
        applicationWeight: 0.8,
        starterCode: seed.independent.starterCode,
        visibleExample: {
          input: seed.independent.exampleInput ?? [],
          expectedOutput: seed.independent.exampleOutput,
        },
        hiddenTests: seed.independent.hiddenTests.map((test) => ({ input: test.input ?? [], expectedOutput: test.expectedOutput, expectedVariables: test.expectedVariables })),
        requiredConstructs: seed.independent.requiredConstructs ?? [],
        restrictedPatterns: seed.independent.restrictedPatterns ?? [],
        title: seed.independent.title,
        instructions: seed.independent.instructions,
        successMessage: seed.independent.successMessage,
      },
      {
        id: `${id}-review`,
        exercise_type: "multiple_choice",
        stage: "review",
        title: "Retrieval check",
        instructions: seed.review.question,
        hints: withHint3(defaultHints.review, reviewHint3(seed.review), seed.review.hints),
        knowledgeWeight: 1,
        applicationWeight: 0,
        options: seed.review.options,
        answer: seed.review.answer,
        correctFeedback: seed.review.correctFeedback,
        incorrectFeedback: seed.review.incorrectFeedback,
      },
      ...(seed.extraExercises ?? []),
    ],
  };
}
