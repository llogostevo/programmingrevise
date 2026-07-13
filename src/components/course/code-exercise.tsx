"use client";

import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { CheckCircle2, CircleAlert, Lightbulb, LoaderCircle, Play, Send, Terminal } from "lucide-react";

import type { WriteCodeExercise } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkPython, runPython, type CheckResult } from "@/lib/python-runner";
import { recordExerciseResult } from "@/lib/progress";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

function HintControls({
  hints,
  used,
  onUse,
  encourage,
}: {
  hints: [string, string, string];
  used: number;
  onUse: () => void;
  encourage?: boolean;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-warning-soft/65 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{encourage ? "Not stuck forever" : "Need a nudge?"}</p>
          <p className="text-xs text-muted-foreground">
            {encourage ? "Try the next hint, then run again." : "Hints become more specific one step at a time."}
          </p>
        </div>
        {used < 3 ? (
          <Button type="button" variant="outline" size="sm" onClick={onUse}>
            <Lightbulb className="size-3.5" /> Show hint {used + 1}
          </Button>
        ) : null}
      </div>
      {used > 0 ? (
        <ol className="mt-3 space-y-2 text-sm leading-6">
          {hints.slice(0, used).map((hint, index) => (
            <li key={hint} className="flex gap-2">
              <span className="font-mono text-xs font-bold text-warning">{index + 1}</span>
              <span>{hint}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function Feedback({ result, onAskHint, canHint }: { result: CheckResult; onAskHint?: () => void; canHint?: boolean }) {
  const correct = result.status === "correct";
  const partial = result.status === "partial";
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        correct ? "border-emerald-200 bg-success-soft" : partial ? "border-amber-200 bg-warning-soft" : "border-rose-200 bg-rose-50",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3">
        {correct ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        ) : (
          <CircleAlert className={cn("mt-0.5 size-5 shrink-0", partial ? "text-warning" : "text-rose-600")} />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{correct ? "Correct" : partial ? "Almost there" : "Not quite yet"}</p>
          <p className="mt-1 text-sm leading-6">{result.message}</p>
          {result.executionError ? (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-rose-200">{result.executionError}</pre>
          ) : null}
          {result.total > 1 ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Tests passed: {result.passed} of {result.total}
            </p>
          ) : null}
          {!correct && canHint ? (
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onAskHint}>
              <Lightbulb className="size-3.5" /> Try hint 1
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CodeExercise({
  exercise,
  unitSlug,
  lessonSlug,
  onCorrect,
}: {
  exercise: WriteCodeExercise;
  unitSlug: string;
  lessonSlug: string;
  onCorrect: (exerciseId: string) => void;
}) {
  const progress = useProgress();
  const savedCode = progress.exercises[exercise.id]?.lastSubmittedCode;
  const [code, setCode] = useState(savedCode ?? exercise.starterCode);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [runError, setRunError] = useState<string>();
  const [result, setResult] = useState<CheckResult>();
  const [loading, setLoading] = useState<"run" | "check" | null>(null);
  const [hintsUsed, setHintsUsed] = useState(progress.exercises[exercise.id]?.hintsUsed ?? 0);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const guided = exercise.id.endsWith("guided");

  useEffect(() => {
    if (result && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result]);

  async function run() {
    setLoading("run");
    setResult(undefined);
    const execution = await runPython(code, exercise.visibleExample.input);
    setConsoleOutput(execution.output);
    setRunError(execution.ok ? undefined : execution.error);
    setLoading(null);
  }

  async function check() {
    setLoading("check");
    setRunError(undefined);
    const nextResult = await checkPython(code, exercise);
    setResult(nextResult);
    setConsoleOutput(nextResult.output);
    const correct = nextResult.status === "correct";
    recordExerciseResult({
      exerciseId: exercise.id,
      unitSlug,
      lessonSlug,
      correct,
      partial: nextResult.status === "partial",
      hintsUsed,
      submittedCode: code,
      executionError: nextResult.executionError,
      knowledgeWeight: exercise.knowledgeWeight,
      applicationWeight: exercise.applicationWeight,
    });
    if (correct) onCorrect(exercise.id);
    setLoading(null);
  }

  return (
    <article className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant={guided ? "info" : "success"}>{guided ? "Guided write" : "Own write"}</Badge>
          <h3 className="mt-3 text-xl font-semibold">{exercise.title}</h3>
        </div>
        <Badge variant="outline">Python</Badge>
      </div>

      <div className="rounded-xl border border-primary/15 bg-secondary/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">What to build</p>
        <p className="mt-2 text-sm leading-6 text-foreground">{exercise.instructions}</p>
        <div className="mt-3 grid gap-3 border-t border-primary/10 pt-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example input</p>
            <p className="mt-1 font-mono text-xs sm:text-sm">
              {exercise.visibleExample.input.length ? exercise.visibleExample.input.join(" · ") : "No input"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected output</p>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs sm:text-sm">{exercise.visibleExample.expectedOutput}</pre>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400">
          <span>student_solution.py</span>
          <span>{savedCode ? "Saved on this device" : "Python 3 · runs in your browser"}</span>
        </div>
        <CodeMirror
          value={code}
          height="260px"
          theme="dark"
          extensions={[python()]}
          onChange={setCode}
          aria-label={`${exercise.title} Python editor`}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={run} disabled={loading !== null}>
          {loading === "run" ? <LoaderCircle className="animate-spin" /> : <Play />} Run code
        </Button>
        <Button type="button" onClick={check} disabled={loading !== null}>
          {loading === "check" ? <LoaderCircle className="animate-spin" /> : <Send />} Check answer
        </Button>
        <span className="text-xs text-muted-foreground">
          {loading === "run" ? "Starting Python…" : loading === "check" ? "Running test cases…" : "Run to try · Check to mark"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border bg-slate-950 text-slate-100">
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400">
          <Terminal className="size-3.5" /> Console
        </div>
        <pre className="min-h-16 whitespace-pre-wrap p-4 font-mono text-sm leading-6">
          {runError ? (
            <span className="text-rose-300">{runError}</span>
          ) : consoleOutput ? (
            consoleOutput
          ) : (
            <span className="text-slate-500">Run your code to see its output here.</span>
          )}
        </pre>
      </div>

      <div ref={feedbackRef} className="space-y-4">
        {result ? (
          <Feedback
            result={result}
            canHint={result.status !== "correct" && hintsUsed === 0}
            onAskHint={() => setHintsUsed(1)}
          />
        ) : null}
        <HintControls
          hints={exercise.hints}
          used={hintsUsed}
          encourage={Boolean(result && result.status !== "correct")}
          onUse={() => setHintsUsed((value) => Math.min(3, value + 1))}
        />
      </div>
    </article>
  );
}

export { HintControls };
