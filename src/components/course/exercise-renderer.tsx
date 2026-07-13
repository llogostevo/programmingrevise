"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { CheckCircle2, ChevronDown, ChevronUp, CircleAlert, GripVertical, LoaderCircle, Play } from "lucide-react";

import type { Exercise } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { SingleCodeBlock } from "@/components/course/dual-code-block";
import { CodeExercise, HintControls } from "@/components/course/code-exercise";
import { recordExerciseResult } from "@/lib/progress";
import { runPython, validateRequiredConstructs } from "@/lib/python-runner";
import { cn } from "@/lib/utils";

type ExerciseProps<T extends Exercise> = {
  exercise: T;
  unitSlug: string;
  lessonSlug: string;
  onCorrect: (exerciseId: string) => void;
};

function save<T extends Exercise>(props: ExerciseProps<T>, correct: boolean, hintsUsed: number, partial = false, submittedCode?: string) {
  recordExerciseResult({
    exerciseId: props.exercise.id,
    unitSlug: props.unitSlug,
    lessonSlug: props.lessonSlug,
    correct,
    partial,
    hintsUsed,
    submittedCode,
    knowledgeWeight: props.exercise.knowledgeWeight,
    applicationWeight: props.exercise.applicationWeight,
  });
  if (correct) props.onCorrect(props.exercise.id);
}

function SimpleFeedback({ correct, partial = false, children }: { correct: boolean; partial?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm leading-6", correct ? "border-emerald-200 bg-success-soft" : partial ? "border-amber-200 bg-warning-soft" : "border-rose-200 bg-rose-50")} role="status" aria-live="polite">
      {correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <CircleAlert className={cn("mt-0.5 size-5 shrink-0", partial ? "text-warning" : "text-rose-600")} />}
      <div>{children}</div>
    </div>
  );
}

function ExerciseCard({ exercise, children }: { exercise: Exercise; children: React.ReactNode }) {
  return (
    <article className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="info">{exercise.exercise_type.replaceAll("_", " ")}</Badge>
          <h3 className="mt-3 text-xl font-semibold">{exercise.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{exercise.instructions}</p>
        </div>
        {"language" in exercise ? <Badge variant="outline">{exercise.language === "erl" ? "OCR ERL" : "Python"}</Badge> : null}
      </div>
      {children}
    </article>
  );
}

function MultipleChoiceExercise(props: ExerciseProps<Extract<Exercise, { exercise_type: "multiple_choice" }>>) {
  const { exercise } = props;
  const [selected, setSelected] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const [hints, setHints] = useState(0);
  const correct = selected === exercise.answer;

  function check() {
    if (selected === undefined) return;
    setSubmitted(true);
    save(props, correct, hints);
  }

  return (
    <ExerciseCard exercise={exercise}>
      <div className="grid gap-3" role="radiogroup" aria-label={exercise.instructions}>
        {exercise.options.map((option, index) => (
          <button key={option} type="button" role="radio" aria-checked={selected === index} onClick={() => { setSelected(index); setSubmitted(false); }} className={cn("flex min-h-12 items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors", selected === index ? "border-primary bg-secondary" : "bg-card hover:bg-muted")}>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs font-semibold", selected === index ? "border-primary bg-primary text-primary-foreground" : "bg-muted")}>{String.fromCharCode(65 + index)}</span>
            {option}
          </button>
        ))}
      </div>
      <div className="flex gap-3"><Button type="button" onClick={check} disabled={selected === undefined}>Check answer</Button></div>
      <HintControls hints={exercise.hints} used={hints} onUse={() => setHints((value) => Math.min(3, value + 1))} />
      {submitted ? (
        <SimpleFeedback correct={correct}>
          {correct ? exercise.correctFeedback : exercise.incorrectFeedback?.[String(selected)] ?? "Not quite. Return to the definition and try again."}
        </SimpleFeedback>
      ) : null}
    </ExerciseCard>
  );
}

function PredictExercise(props: ExerciseProps<Extract<Exercise, { exercise_type: "predict_output" }>>) {
  const { exercise } = props;
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hints, setHints] = useState(0);
  const normalise = (value: string) => value.replace(/\r\n/g, "\n").replace(/\n$/, "");
  const correct = normalise(answer) === normalise(exercise.expectedOutput);

  function check() {
    setSubmitted(true);
    save(props, correct, hints);
  }

  return (
    <ExerciseCard exercise={exercise}>
      <SingleCodeBlock code={exercise.code} language={exercise.language} numbered />
      <div>
        <label htmlFor={`${exercise.id}-answer`} className="mb-2 block text-sm font-semibold">Exact output</label>
        <Textarea id={`${exercise.id}-answer`} value={answer} onChange={(event) => { setAnswer(event.target.value); setSubmitted(false); }} placeholder="Type each output line exactly…" className="font-mono" spellCheck={false} />
      </div>
      <Button type="button" onClick={check} disabled={!answer.length}>Check answer</Button>
      <HintControls hints={exercise.hints} used={hints} onUse={() => setHints((value) => Math.min(3, value + 1))} />
      {submitted ? <SimpleFeedback correct={correct}>{correct ? "Correct. Your output matches exactly." : exercise.misconceptionFeedback?.[answer] ?? "Not yet. Trace the code from the first line and include every output line exactly."}</SimpleFeedback> : null}
    </ExerciseCard>
  );
}

function DebugExercise(props: ExerciseProps<Extract<Exercise, { exercise_type: "debug_code" }>>) {
  const { exercise } = props;
  const [kind, setKind] = useState<"syntax" | "runtime" | "logic">("syntax");
  const [fix, setFix] = useState(exercise.code);
  const [submitted, setSubmitted] = useState(false);
  const [hints, setHints] = useState(0);
  const normalise = (value: string) => value.trim().split("\n").map((line) => line.trimEnd()).join("\n");
  const accepted = [exercise.expectedFix, ...exercise.acceptedFixes].map(normalise);
  const codeCorrect = accepted.includes(normalise(fix));
  const correct = codeCorrect && kind === exercise.errorKind;
  const partial = codeCorrect || kind === exercise.errorKind;

  function check() {
    setSubmitted(true);
    save(props, correct, hints, partial);
  }

  return (
    <ExerciseCard exercise={exercise}>
      <SingleCodeBlock code={exercise.code} language={exercise.language} numbered />
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div>
          <label htmlFor={`${exercise.id}-kind`} className="mb-2 block text-sm font-semibold">Error type</label>
          <select id={`${exercise.id}-kind`} value={kind} onChange={(event) => { setKind(event.target.value as typeof kind); setSubmitted(false); }} className="h-10 w-full rounded-lg border bg-card px-3 text-sm">
            <option value="syntax">Syntax error</option>
            <option value="runtime">Runtime error</option>
            <option value="logic">Logic error</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${exercise.id}-fix`} className="mb-2 block text-sm font-semibold">Corrected code</label>
          <Textarea id={`${exercise.id}-fix`} value={fix} onChange={(event) => { setFix(event.target.value); setSubmitted(false); }} className="min-h-32 font-mono" spellCheck={false} />
        </div>
      </div>
      <Button type="button" onClick={check}>Check fix</Button>
      <HintControls hints={exercise.hints} used={hints} onUse={() => setHints((value) => Math.min(3, value + 1))} />
      {submitted ? <SimpleFeedback correct={correct} partial={partial && !correct}>{correct ? `Correct. ${exercise.feedback}` : partial ? "One part is right. Check both the error classification and the corrected line." : "That correction does not yet produce the intended program. Compare it with the worked syntax."}</SimpleFeedback> : null}
    </ExerciseCard>
  );
}

function FillBlankExercise(props: ExerciseProps<Extract<Exercise, { exercise_type: "fill_blank" }>>) {
  const { exercise } = props;
  const [values, setValues] = useState(() => exercise.answers.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const [hints, setHints] = useState(0);
  const correctCells = values.map((value, index) => exercise.answers[index].some((answer) => answer.trim() === value.trim()));
  const correct = correctCells.every(Boolean);

  function check() {
    setSubmitted(true);
    save(props, correct, hints, correctCells.some(Boolean));
  }

  return (
    <ExerciseCard exercise={exercise}>
      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-5 font-mono text-sm leading-10 text-slate-100">
        {exercise.codeParts.map((part, index) => (
          <span key={`${part}-${index}`}>
            <span className="whitespace-pre-wrap">{part}</span>
            {index < exercise.answers.length ? (
              <Input aria-label={`Blank ${index + 1}`} value={values[index]} onChange={(event) => { const next = [...values]; next[index] = event.target.value; setValues(next); setSubmitted(false); }} className={cn("mx-1 inline-flex h-8 w-36 border-slate-600 bg-slate-900 font-mono text-slate-100", submitted && (correctCells[index] ? "border-emerald-400" : "border-rose-400"))} />
            ) : null}
          </span>
        ))}
      </div>
      <Button type="button" onClick={check} disabled={values.some((value) => !value.trim())}>Check blanks</Button>
      <HintControls hints={exercise.hints} used={hints} onUse={() => setHints((value) => Math.min(3, value + 1))} />
      {submitted ? <SimpleFeedback correct={correct} partial={!correct && correctCells.some(Boolean)}>{correct ? "Correct. Every missing part fits the program." : "Check the highlighted blank. The surrounding code tells you the exact syntax needed."}</SimpleFeedback> : null}
    </ExerciseCard>
  );
}

function TraceTableExercise(props: ExerciseProps<Extract<Exercise, { exercise_type: "trace_table" }>>) {
  const { exercise } = props;
  const [cells, setCells] = useState(() => exercise.rows.map((row) => row.values.map(() => "")));
  const [submitted, setSubmitted] = useState(false);
  const [hints, setHints] = useState(0);
  const matches = cells.map((row, r) => row.map((cell, c) => cell === exercise.rows[r].values[c]));
  const correct = matches.flat().every(Boolean);

  function check() {
    setSubmitted(true);
    save(props, correct, hints, matches.flat().some(Boolean));
  }

  return (
    <ExerciseCard exercise={exercise}>
      <SingleCodeBlock code={exercise.code} language={exercise.language} numbered />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-lg text-sm">
          <thead className="bg-muted"><tr><th className="px-3 py-2 text-left">Line</th>{exercise.columns.map((column) => <th key={column} className="px-3 py-2 text-left">{column}</th>)}</tr></thead>
          <tbody>{exercise.rows.map((row, r) => <tr key={`${row.line}-${r}`} className="border-t"><td className="px-3 py-2 font-mono text-muted-foreground">{row.line}</td>{row.values.map((_, c) => <td key={c} className="p-2"><Input aria-label={`Row ${r + 1}, ${exercise.columns[c]}`} value={cells[r][c]} onChange={(event) => { const next = cells.map((item) => [...item]); next[r][c] = event.target.value; setCells(next); setSubmitted(false); }} className={cn("min-w-24 font-mono", submitted && (matches[r][c] ? "border-emerald-500" : "border-rose-500"))} /></td>)}</tr>)}</tbody>
        </table>
      </div>
      <Button type="button" onClick={check}>Check table</Button>
      <HintControls hints={exercise.hints} used={hints} onUse={() => setHints((value) => Math.min(3, value + 1))} />
      {submitted ? <SimpleFeedback correct={correct} partial={!correct && matches.flat().some(Boolean)}>{correct ? "Correct. Every change and output is in the right row." : "Some cells need another look. Leave output blank on any row where nothing is printed."}</SimpleFeedback> : null}
    </ExerciseCard>
  );
}

function ParsonsExercise(props: ExerciseProps<Extract<Exercise, { exercise_type: "parsons" }>>) {
  const { exercise } = props;
  const [lines, setLines] = useState(exercise.lines);
  const [dragged, setDragged] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [hints, setHints] = useState(0);
  const correct = lines.map((line) => line.id).every((id, index) => id === exercise.correctOrder[index]);

  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= lines.length) return;
    const next = [...lines];
    [next[index], next[target]] = [next[target], next[index]];
    setLines(next);
    setSubmitted(false);
  }

  function drop(targetId: string) {
    if (!dragged || dragged === targetId) return;
    const next = [...lines];
    const from = next.findIndex((line) => line.id === dragged);
    const to = next.findIndex((line) => line.id === targetId);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setLines(next);
    setSubmitted(false);
  }

  return (
    <ExerciseCard exercise={exercise}>
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={line.id} draggable onDragStart={() => setDragged(line.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(line.id)} className="flex items-center gap-2 rounded-lg border bg-slate-950 p-2 text-slate-100">
            <GripVertical className="size-4 text-slate-500" aria-hidden="true" />
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-sm" style={{ paddingInlineStart: `${line.indent * 1.25}rem` }}>{line.code}</code>
            <Button type="button" variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0} className="text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={`Move ${line.code} up`}><ChevronUp /></Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => move(index, 1)} disabled={index === lines.length - 1} className="text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={`Move ${line.code} down`}><ChevronDown /></Button>
          </div>
        ))}
      </div>
      <Button type="button" onClick={() => { setSubmitted(true); save(props, correct, hints); }}>Check order</Button>
      <HintControls hints={exercise.hints} used={hints} onUse={() => setHints((value) => Math.min(3, value + 1))} />
      {submitted ? <SimpleFeedback correct={correct}>{correct ? "Correct. The program is in a valid order." : "The order is not quite right. Check which values must exist before another line can use them."}</SimpleFeedback> : null}
    </ExerciseCard>
  );
}

function TranslateExercise(props: ExerciseProps<Extract<Exercise, { exercise_type: "translate" }>>) {
  const { exercise } = props;
  const [code, setCode] = useState(exercise.starterCode);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>();
  const [hints, setHints] = useState(0);

  async function run(checkAll: boolean) {
    setLoading(true);
    if (checkAll) {
      const constructMessage = validateRequiredConstructs(code, exercise.requiredConstructs);
      if (constructMessage) {
        setFeedback({ correct: false, message: constructMessage });
        save(props, false, hints, false, code);
        setLoading(false);
        return;
      }
    }
    const tests = checkAll ? exercise.hiddenTests : [exercise.hiddenTests[0]];
    let passed = 0;
    for (const test of tests) {
      const result = await runPython(code, test.input);
      if (!result.ok) {
        setOutput(result.error ?? "Runtime error");
        setFeedback({ correct: false, message: result.errorType === "syntax" ? "Python found a syntax error." : "The translated program stopped with a runtime error." });
        if (checkAll) save(props, false, hints, false, code);
        setLoading(false);
        return;
      }
      setOutput(result.output);
      if (result.output.replace(/\n$/, "") === test.expectedOutput.replace(/\n$/, "")) passed += 1;
    }
    if (checkAll) {
      const correct = passed === tests.length;
      setFeedback({ correct, message: correct ? `Correct. Your translation passed all ${tests.length} tests.` : "The Python runs, but its behaviour does not match the ERL for every test." });
      save(props, correct, hints, passed > 0, code);
    }
    setLoading(false);
  }

  return (
    <ExerciseCard exercise={exercise}>
      <SingleCodeBlock code={exercise.code} language="erl" numbered />
      <div className="overflow-hidden rounded-xl border border-slate-700"><CodeMirror value={code} height="240px" theme="dark" extensions={[python()]} onChange={setCode} aria-label="Python translation editor" /></div>
      <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => run(false)} disabled={loading}><Play /> Run</Button><Button type="button" onClick={() => run(true)} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : null} Check translation</Button></div>
      {output ? <pre className="rounded-xl bg-slate-950 p-4 font-mono text-sm text-slate-100">{output}</pre> : null}
      <HintControls hints={exercise.hints} used={hints} onUse={() => setHints((value) => Math.min(3, value + 1))} />
      {feedback ? <SimpleFeedback correct={feedback.correct}>{feedback.message}</SimpleFeedback> : null}
    </ExerciseCard>
  );
}

export function ExerciseRenderer(props: ExerciseProps<Exercise>) {
  switch (props.exercise.exercise_type) {
    case "multiple_choice": return <MultipleChoiceExercise {...props as ExerciseProps<Extract<Exercise, { exercise_type: "multiple_choice" }>>} />;
    case "predict_output": return <PredictExercise {...props as ExerciseProps<Extract<Exercise, { exercise_type: "predict_output" }>>} />;
    case "debug_code": return <DebugExercise {...props as ExerciseProps<Extract<Exercise, { exercise_type: "debug_code" }>>} />;
    case "fill_blank": return <FillBlankExercise {...props as ExerciseProps<Extract<Exercise, { exercise_type: "fill_blank" }>>} />;
    case "trace_table": return <TraceTableExercise {...props as ExerciseProps<Extract<Exercise, { exercise_type: "trace_table" }>>} />;
    case "parsons": return <ParsonsExercise {...props as ExerciseProps<Extract<Exercise, { exercise_type: "parsons" }>>} />;
    case "translate": return <TranslateExercise {...props as ExerciseProps<Extract<Exercise, { exercise_type: "translate" }>>} />;
    case "write_code": return <CodeExercise exercise={(props as ExerciseProps<Extract<Exercise, { exercise_type: "write_code" }>>).exercise} unitSlug={props.unitSlug} lessonSlug={props.lessonSlug} onCorrect={props.onCorrect} />;
  }
}
