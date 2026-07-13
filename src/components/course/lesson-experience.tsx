"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Bug, Check, ClipboardCheck, Code2, Eye, GraduationCap, Lightbulb, Quote, Target, TriangleAlert } from "lucide-react";

import type { CourseUnit, Lesson } from "@/types/course";
import { availableLessons } from "@/data/curriculum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DualCodeBlock } from "@/components/course/dual-code-block";
import { ExerciseRenderer } from "@/components/course/exercise-renderer";
import { LESSON_STEPS, markStepComplete, setCurrentStep, type LessonStep } from "@/lib/progress";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

const stepMeta: Record<LessonStep, { label: string; eyebrow: string; description: string; icon: typeof BookOpen }> = {
  learn: { label: "Learn", eyebrow: "Build the idea", description: "Start with the concept and its key vocabulary.", icon: BookOpen },
  example: { label: "Example", eyebrow: "See it modelled", description: "Compare OCR ERL and Python line by line.", icon: Eye },
  trace: { label: "Trace", eyebrow: "Read code", description: "Follow the instructions and predict the exact result.", icon: Quote },
  fix: { label: "Fix", eyebrow: "Debug carefully", description: "Classify the error and repair the program.", icon: Bug },
  complete: { label: "Complete", eyebrow: "Use the pattern", description: "Fill the gap using the syntax you have just seen.", icon: ClipboardCheck },
  write: { label: "Write", eyebrow: "Apply it", description: "Build and test Python in your browser.", icon: Code2 },
  review: { label: "Review", eyebrow: "Retrieve", description: "Recall the idea using OCR-style command words.", icon: GraduationCap },
};

function StepButton({ step, active, complete, onClick }: { step: LessonStep; active: boolean; complete: boolean; onClick: () => void }) {
  const meta = stepMeta[step];
  const Icon = meta.icon;
  return (
    <button type="button" onClick={onClick} aria-current={active ? "step" : undefined} className={cn("group flex min-w-[5.25rem] flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors", active ? "bg-slate-900 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <span className={cn("grid size-7 place-items-center rounded-full border", active ? "border-white/25 bg-white/10" : complete ? "border-emerald-300 bg-success-soft text-success" : "bg-card")}>
        {complete ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
      </span>
      {meta.label}
    </button>
  );
}

function LearnStep({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="info">Key idea</Badge>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.objective}</h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{lesson.explanation}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lesson.vocabulary.map((item) => (
          <Card key={item.term} className="bg-muted/40 shadow-none">
            <CardHeader className="pb-2"><CardTitle className="text-base">{item.term}</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-6 text-muted-foreground">{item.definition}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5 sm:p-6">
        <h3 className="font-semibold">Keep these in mind</h3>
        <ul className="mt-4 space-y-3">
          {lesson.keyPoints.map((point) => <li key={point} className="flex gap-3 text-sm leading-6"><Check className="mt-1 size-4 shrink-0 text-primary" /><span>{point}</span></li>)}
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
            <div><h2 className="text-xl font-semibold">{example.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{example.context}</p></div>
          </div>
          <DualCodeBlock erl={example.erl} python={example.python} title={example.title} />
          <div className="rounded-xl border bg-muted/45 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line-by-line notes</p>
            <dl className="mt-3 space-y-3">{example.notes.map((note) => <div key={`${example.id}-${note.line}`} className="grid grid-cols-[3.25rem_1fr] gap-3 text-sm leading-6"><dt className="font-mono font-semibold text-primary">Line {note.line}</dt><dd>{note.explanation}</dd></div>)}</dl>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LessonExperience({ unit, lesson }: { unit: CourseUnit; lesson: Lesson }) {
  const progress = useProgress();
  const key = `${unit.slug}/${lesson.slug}`;
  const lessonProgress = progress.lessons[key];
  const [activeStep, setActiveStep] = useState<LessonStep>("learn");
  const restored = useRef(false);

  useEffect(() => {
    if (!restored.current && lessonProgress?.currentStep) {
      restored.current = true;
      setActiveStep(lessonProgress.currentStep);
    }
  }, [lessonProgress?.currentStep]);

  const completedSteps = lessonProgress?.completedSteps ?? [];
  const index = LESSON_STEPS.indexOf(activeStep);
  const stageExercises = lesson.exercises.filter((exercise) => exercise.stage === activeStep);
  const stageCorrect = stageExercises.length > 0 && stageExercises.every((exercise) => progress.exercises[exercise.id]?.result === "correct");
  const current = availableLessons.findIndex((item) => item.unit.slug === unit.slug && item.lesson.slug === lesson.slug);
  const previous = current > 0 ? availableLessons[current - 1] : undefined;
  const next = current < availableLessons.length - 1 ? availableLessons[current + 1] : undefined;
  const MetaIcon = stepMeta[activeStep].icon;

  function selectStep(step: LessonStep) {
    setActiveStep(step);
    setCurrentStep(unit.slug, lesson.slug, step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function advance() {
    markStepComplete(unit.slug, lesson.slug, activeStep);
    const nextStep = LESSON_STEPS[Math.min(index + 1, LESSON_STEPS.length - 1)];
    if (nextStep !== activeStep) selectStep(nextStep);
  }

  function handleCorrect(exerciseId: string) {
    const allCorrect = stageExercises.every((exercise) => exercise.id === exerciseId || progress.exercises[exercise.id]?.result === "correct");
    if (allCorrect) markStepComplete(unit.slug, lesson.slug, activeStep);
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link href="/course" className="hover:text-foreground">Course</Link><span>/</span>
          <Link href={`/course/${unit.slug}`} className="hover:text-foreground">{unit.title}</Link><span>/</span>
          <span className="text-foreground">{lesson.title}</span>
        </div>
        <Badge variant="outline">J277 · {lesson.specReference}</Badge>
      </div>

      <section className="mb-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Unit {unit.number} · Lesson {unit.lessons.findIndex((item) => item.slug === lesson.slug) + 1}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1></div>
          <div className="min-w-52 flex-1 sm:max-w-xs"><div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>Lesson progress</span><span>{completedSteps.length} / {LESSON_STEPS.length}</span></div><Progress value={(completedSteps.length / LESSON_STEPS.length) * 100} label={`${lesson.title} progress`} /></div>
        </div>
        <nav className="mt-5 overflow-x-auto pb-1" aria-label="Lesson steps"><div className="flex min-w-max gap-1">{LESSON_STEPS.map((step) => <StepButton key={step} step={step} active={activeStep === step} complete={completedSteps.includes(step)} onClick={() => selectStep(step)} />)}</div></nav>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <main className="min-w-0">
          <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white"><MetaIcon className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{stepMeta[activeStep].eyebrow}</p><p className="text-sm text-muted-foreground">{stepMeta[activeStep].description}</p></div></div>
          {activeStep === "learn" ? <LearnStep lesson={lesson} /> : null}
          {activeStep === "example" ? <ExampleStep lesson={lesson} /> : null}
          {activeStep === "review" ? (
            <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Quick recall</p>
              <p className="mt-2 text-sm leading-6">Answer this aloud or on paper before opening your notes: <span className="font-semibold">{lesson.retrievalPrompt}</span></p>
            </div>
          ) : null}
          {stageExercises.length ? <div className="space-y-6">{stageExercises.map((exercise) => <ExerciseRenderer key={exercise.id} exercise={exercise} unitSlug={unit.slug} lessonSlug={lesson.slug} onCorrect={handleCorrect} />)}</div> : null}

          {activeStep === "review" && completedSteps.includes("review") ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-success-soft p-5 sm:p-6">
              <div className="flex gap-3"><GraduationCap className="size-6 shrink-0 text-success" /><div><h2 className="font-semibold">Lesson complete</h2><p className="mt-1 text-sm leading-6">Your results are saved on this device and the questions will return in spaced review.</p>{next ? <Button asChild className="mt-4"><Link href={`/course/${next.unit.slug}/${next.lesson.slug}`}>Next lesson <ArrowRight /></Link></Button> : <Button asChild className="mt-4"><Link href="/review">Start review <ArrowRight /></Link></Button>}</div></div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Button type="button" variant="ghost" disabled={index === 0} onClick={() => selectStep(LESSON_STEPS[index - 1])}><ArrowLeft /> Previous step</Button>
            {activeStep === "learn" || activeStep === "example" ? <Button type="button" onClick={advance}>Mark complete & continue <ArrowRight /></Button> : index < LESSON_STEPS.length - 1 ? <Button type="button" onClick={advance} disabled={!stageCorrect && !completedSteps.includes(activeStep)}>Continue <ArrowRight /></Button> : null}
          </div>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardHeader className="pb-3"><div className="flex items-center gap-2 text-primary"><Target className="size-4" /><p className="text-xs font-semibold uppercase tracking-wider">Learning objective</p></div></CardHeader>
            <CardContent><p className="text-sm leading-6">{lesson.objective}</p></CardContent>
          </Card>
          <div className="rounded-2xl border border-blue-200 bg-info-soft p-5"><div className="flex items-center gap-2 text-info"><Lightbulb className="size-4" /><p className="text-xs font-semibold uppercase tracking-wider">Exam tip</p></div><p className="mt-3 text-sm leading-6">{lesson.examTip}</p></div>
          <div className="rounded-2xl border border-amber-200 bg-warning-soft p-5"><div className="flex items-center gap-2 text-warning"><TriangleAlert className="size-4" /><p className="text-xs font-semibold uppercase tracking-wider">Common mistake</p></div><p className="mt-3 text-sm leading-6">{lesson.commonMistake}</p></div>
          {activeStep === "review" ? <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-xs font-semibold uppercase tracking-wider text-teal-300">In the exam…</p><p className="mt-3 text-sm leading-6 text-slate-200">{lesson.examCallout}</p></div> : null}
          <div className="flex gap-2">{previous ? <Button asChild variant="outline" size="sm" className="flex-1"><Link href={`/course/${previous.unit.slug}/${previous.lesson.slug}`}><ArrowLeft /> Previous</Link></Button> : null}{next ? <Button asChild variant="outline" size="sm" className="flex-1"><Link href={`/course/${next.unit.slug}/${next.lesson.slug}`}>Next <ArrowRight /></Link></Button> : null}</div>
        </aside>
      </div>
    </div>
  );
}
