"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Bug, Check, ClipboardCheck, Code2, Eye, GraduationCap, Lightbulb, Quote, TriangleAlert } from "lucide-react";

import type { CourseUnit, Lesson } from "@/types/course";
import { availableLessons } from "@/data/curriculum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DualCodeBlock } from "@/components/course/dual-code-block";
import { ExerciseRenderer } from "@/components/course/exercise-renderer";
import { InlineProse } from "@/components/course/inline-prose";
import { LESSON_STEPS, markStepComplete, setCurrentStep, type LessonStep } from "@/lib/progress";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

function isLessonStep(value: string | null): value is LessonStep {
  return Boolean(value && (LESSON_STEPS as readonly string[]).includes(value));
}

const stepMeta: Record<LessonStep, { label: string; eyebrow: string; description: string; icon: typeof BookOpen }> = {
  learn: { label: "Learn", eyebrow: "Build the idea", description: "Start with the concept and its key vocabulary.", icon: BookOpen },
  example: { label: "Example", eyebrow: "See it modelled", description: "Compare OCR ERL and Python line by line.", icon: Eye },
  trace: { label: "Trace", eyebrow: "Read code", description: "Follow the instructions and predict the exact result.", icon: Quote },
  fix: { label: "Fix", eyebrow: "Debug carefully", description: "Classify the error and repair the program.", icon: Bug },
  complete: { label: "Complete", eyebrow: "Use the pattern", description: "Fill the gap using the syntax you have just seen.", icon: ClipboardCheck },
  write: { label: "Write", eyebrow: "Apply it", description: "Build and test Python in your browser.", icon: Code2 },
  review: { label: "Review", eyebrow: "Retrieve", description: "Recall the idea using OCR-style command words.", icon: GraduationCap },
};

type TipCard = {
  title: string;
  body: string;
  tone: "info" | "warning" | "exam";
  icon: typeof Lightbulb;
};

function tipsForStep(step: LessonStep, lesson: Lesson): TipCard[] {
  switch (step) {
    case "learn":
      return [{ title: "Exam tip", body: lesson.examTip, tone: "info", icon: Lightbulb }];
    case "example":
      return [{ title: "Common mistake", body: lesson.commonMistake, tone: "warning", icon: TriangleAlert }];
    case "trace":
      return [{ title: "Trace tip", body: "Work one line at a time. Record each new value before you move on, and copy capital letters, spaces and punctuation exactly.", tone: "info", icon: Lightbulb }];
    case "fix":
      return [{ title: "Common mistake", body: lesson.commonMistake, tone: "warning", icon: TriangleAlert }];
    case "complete":
      return [{ title: "Pattern tip", body: "Match the surrounding syntax first, then fill only the missing piece. Re-read the expected output before you submit.", tone: "info", icon: Lightbulb }];
    case "write":
      return [{ title: "Write tip", body: "Solve the visible example first, then check that your solution still works for the hidden tests.", tone: "info", icon: Lightbulb }];
    case "review":
      return [
        { title: "Exam tip", body: lesson.examTip, tone: "info", icon: Lightbulb },
        { title: "In the exam…", body: lesson.examCallout, tone: "exam", icon: GraduationCap },
      ];
  }
}

function StepButton({
  step,
  active,
  complete,
  controls,
  onClick,
}: {
  step: LessonStep;
  active: boolean;
  complete: boolean;
  controls: string;
  onClick: () => void;
}) {
  const meta = stepMeta[step];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      role="tab"
      id={`lesson-step-${step}`}
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "group relative flex min-w-[5.25rem] flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors",
        active ? "bg-slate-900 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full border",
          active ? "border-white/25 bg-white/10" : complete ? "border-emerald-500 bg-success-soft text-success" : "border-slate-300 bg-card",
        )}
        aria-hidden={!complete}
      >
        {complete ? <Check className="size-3.5" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
      </span>
      <span>{meta.label}</span>
      {complete ? <span className="sr-only">Completed</span> : null}
    </button>
  );
}

function LearnStep({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="info">Key idea</Badge>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{lesson.objective}</h2>
        <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
          <InlineProse text={lesson.explanation} glossary />
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 [&>:last-child:nth-child(odd)]:sm:col-span-2">
        {lesson.vocabulary.map((item) => (
          <Card key={item.term} className="bg-muted/40 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.term}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                <InlineProse text={item.definition} glossary />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5 sm:p-6">
        <h3 className="font-semibold">Keep these in mind</h3>
        <ul className="mt-4 space-y-3">
          {lesson.keyPoints.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-6">
              <Check className="mt-1 size-4 shrink-0 text-primary" />
              <span>
                <InlineProse text={point} glossary />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ExampleStep({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-8">
      {lesson.examples.map((example, index) => (
        <article key={example.id} className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-mono text-xs font-bold text-secondary-foreground">{index + 1}</span>
            <div>
              <h2 className="text-xl font-semibold">{example.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                <InlineProse text={example.context} />
              </p>
            </div>
          </div>
          <DualCodeBlock erl={example.erl} python={example.python} title={example.title} notes={example.notes} />
        </article>
      ))}
    </div>
  );
}

function TipCards({ tips }: { tips: TipCard[] }) {
  return (
    <>
      {tips.map((tip) => {
        const Icon = tip.icon;
        if (tip.tone === "exam") {
          return (
            <div key={tip.title} className="rounded-2xl bg-slate-900 p-5 text-white">
              <div className="flex items-center gap-2 text-teal-300">
                <Icon className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">{tip.title}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                <InlineProse text={tip.body} />
              </p>
            </div>
          );
        }
        const styles =
          tip.tone === "warning"
            ? { wrap: "border-amber-200 bg-warning-soft", icon: "text-warning" }
            : { wrap: "border-blue-200 bg-info-soft", icon: "text-info" };
        return (
          <div key={tip.title} className={cn("rounded-2xl border p-5", styles.wrap)}>
            <div className={cn("flex items-center gap-2", styles.icon)}>
              <Icon className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">{tip.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6">
              <InlineProse text={tip.body} />
            </p>
          </div>
        );
      })}
    </>
  );
}

export function LessonExperience({ unit, lesson }: { unit: CourseUnit; lesson: Lesson }) {
  const progress = useProgress();
  const searchParams = useSearchParams();
  const key = `${unit.slug}/${lesson.slug}`;
  const lessonProgress = progress.lessons[key];
  const stepParam = searchParams.get("step");
  const [activeStep, setActiveStep] = useState<LessonStep>(() => (isLessonStep(stepParam) ? stepParam : "learn"));
  const restored = useRef(false);
  const panelId = useId();

  useEffect(() => {
    if (isLessonStep(stepParam)) {
      restored.current = true;
      setActiveStep(stepParam);
      setCurrentStep(unit.slug, lesson.slug, stepParam);
      return;
    }
    if (!restored.current && lessonProgress?.currentStep) {
      restored.current = true;
      setActiveStep(lessonProgress.currentStep);
    }
  }, [lessonProgress?.currentStep, lesson.slug, stepParam, unit.slug]);

  const completedSteps = lessonProgress?.completedSteps ?? [];
  const index = LESSON_STEPS.indexOf(activeStep);
  const previousStep = index > 0 ? LESSON_STEPS[index - 1] : undefined;
  const nextStep = index < LESSON_STEPS.length - 1 ? LESSON_STEPS[index + 1] : undefined;
  const stageExercises = lesson.exercises.filter((exercise) => exercise.stage === activeStep);
  const stageCorrect = stageExercises.length > 0 && stageExercises.every((exercise) => progress.exercises[exercise.id]?.result === "correct");
  const current = availableLessons.findIndex((item) => item.unit.slug === unit.slug && item.lesson.slug === lesson.slug);
  const previous = current > 0 ? availableLessons[current - 1] : undefined;
  const next = current < availableLessons.length - 1 ? availableLessons[current + 1] : undefined;
  const MetaIcon = stepMeta[activeStep].icon;
  const sidebarTips = tipsForStep(activeStep, lesson);

  function selectStep(step: LessonStep) {
    setActiveStep(step);
    setCurrentStep(unit.slug, lesson.slug, step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function advance() {
    markStepComplete(unit.slug, lesson.slug, activeStep);
    if (nextStep && nextStep !== activeStep) selectStep(nextStep);
  }

  function handleCorrect(exerciseId: string) {
    const allCorrect = stageExercises.every((exercise) => exercise.id === exerciseId || progress.exercises[exercise.id]?.result === "correct");
    if (allCorrect) markStepComplete(unit.slug, lesson.slug, activeStep);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = LESSON_STEPS.indexOf(activeStep);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? LESSON_STEPS.length - 1
            : event.key === "ArrowRight"
              ? Math.min(currentIndex + 1, LESSON_STEPS.length - 1)
              : Math.max(currentIndex - 1, 0);
      selectStep(LESSON_STEPS[nextIndex]);
      document.getElementById(`lesson-step-${LESSON_STEPS[nextIndex]}`)?.focus();
    }
  }

  const canAdvanceExercise = stageCorrect || completedSteps.includes(activeStep);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link href="/course" className="hover:text-foreground">
            Course
          </Link>
          <span>/</span>
          <Link href={`/course/${unit.slug}`} className="hover:text-foreground">
            {unit.title}
          </Link>
          <span>/</span>
          <span className="text-foreground">{lesson.title}</span>
        </div>
        <Badge variant="outline">J277 · {lesson.specReference}</Badge>
      </div>

      <section className="mb-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Unit {unit.number} · Lesson {unit.lessons.findIndex((item) => item.slug === lesson.slug) + 1}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1>
        </div>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 overflow-x-auto pb-1" role="tablist" aria-label="Lesson steps" onKeyDown={onTabKeyDown}>
            <div className="flex min-w-max gap-1">
              {LESSON_STEPS.map((step) => (
                <StepButton
                  key={step}
                  step={step}
                  active={activeStep === step}
                  complete={completedSteps.includes(step)}
                  controls={panelId}
                  onClick={() => selectStep(step)}
                />
              ))}
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center gap-3 lg:w-56">
            <div className="min-w-0 flex-1">
              <Progress value={(completedSteps.length / LESSON_STEPS.length) * 100} label={`${lesson.title} progress`} />
            </div>
            <p className="whitespace-nowrap text-xs font-semibold tabular-nums text-slate-700" aria-live="polite">
              {completedSteps.length} / {LESSON_STEPS.length}
            </p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <main className="min-w-0">
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`lesson-step-${activeStep}`}
            className="min-w-0"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white">
                <MetaIcon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{stepMeta[activeStep].eyebrow}</p>
                <p className="text-sm text-muted-foreground">{stepMeta[activeStep].description}</p>
              </div>
            </div>
            {activeStep === "learn" ? <LearnStep lesson={lesson} /> : null}
            {activeStep === "example" ? <ExampleStep lesson={lesson} /> : null}
            {activeStep === "review" ? (
              <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Quick recall</p>
                <p className="mt-2 text-sm leading-6">
                  Answer this aloud or on paper before opening your notes: <span className="font-semibold">{lesson.retrievalPrompt}</span>
                </p>
              </div>
            ) : null}
            {stageExercises.length ? (
              <div className="space-y-6">
                {stageExercises.map((exercise) => (
                  <ExerciseRenderer key={exercise.id} exercise={exercise} unitSlug={unit.slug} lessonSlug={lesson.slug} onCorrect={handleCorrect} />
                ))}
              </div>
            ) : null}

            {activeStep === "review" && completedSteps.includes("review") ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-success-soft p-5 sm:p-6">
                <div className="flex gap-3">
                  <GraduationCap className="size-6 shrink-0 text-success" />
                  <div>
                    <h2 className="font-semibold">Lesson complete</h2>
                    <p className="mt-1 text-sm leading-6">Your results are saved on this device and the questions will return in spaced review.</p>
                    {next ? (
                      <Button asChild className="mt-4">
                        <Link href={`/course/${next.unit.slug}/${next.lesson.slug}`}>
                          Next lesson <ArrowRight />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="mt-4">
                        <Link href="/review">
                          Start review <ArrowRight />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <nav className="mt-8 flex w-full flex-wrap items-center justify-between gap-3 border-t pt-5" aria-label="Lesson navigation">
            <div>
              {previousStep ? (
                <Button type="button" variant="outline" onClick={() => selectStep(previousStep)}>
                  <ArrowLeft /> Previous: {stepMeta[previousStep].label}
                </Button>
              ) : previous ? (
                <Button asChild variant="outline">
                  <Link href={`/course/${previous.unit.slug}/${previous.lesson.slug}`}>
                    <ArrowLeft /> Previous: {previous.lesson.title}
                  </Link>
                </Button>
              ) : null}
            </div>
            <div>
              {nextStep ? (
                <Button
                  type="button"
                  onClick={advance}
                  disabled={activeStep !== "learn" && activeStep !== "example" && !canAdvanceExercise}
                >
                  {activeStep === "learn" || activeStep === "example" ? "Mark complete · " : null}
                  Next: {stepMeta[nextStep].label}
                  <ArrowRight />
                </Button>
              ) : next ? (
                <Button asChild>
                  <Link href={`/course/${next.unit.slug}/${next.lesson.slug}`}>
                    Next: {next.lesson.title} <ArrowRight />
                  </Link>
                </Button>
              ) : null}
            </div>
          </nav>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <TipCards tips={sidebarTips} />
        </aside>
      </div>
    </div>
  );
}
