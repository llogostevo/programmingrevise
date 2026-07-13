"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Code2, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { availableLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import type { MasteryLevel } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressControls } from "@/components/progress/progress-controls";

const levelStyle: Record<MasteryLevel, { label: string; variant: "muted" | "info" | "success" | "warning" }> = {
  "not-attempted": { label: "Not attempted", variant: "muted" },
  developing: { label: "Developing", variant: "info" },
  secure: { label: "Secure", variant: "success" },
  "needs-review": { label: "Needs review", variant: "warning" },
};

function MasteryCell({ level, score, icon: Icon }: { level: MasteryLevel; score: number; icon: typeof Brain }) {
  const style = levelStyle[level];
  return <div className="rounded-xl border bg-muted/30 p-3"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-semibold"><Icon className="size-3.5 text-primary" />{Icon === Brain ? "Knowledge" : "Application"}</span><Badge variant={style.variant}>{style.label}</Badge></div><Progress value={score * 100} className="mt-3 h-1.5" /></div>;
}

export function ProgressView() {
  const progress = useProgress();
  const completed = availableLessons.filter(({ unit, lesson }) => progress.lessons[`${unit.slug}/${lesson.slug}`]?.completedAt).length;
  const secureKnowledge = Object.values(progress.topics).filter((topic) => topic.knowledge.level === "secure").length;
  const secureApplication = Object.values(progress.topics).filter((topic) => topic.application.level === "secure").length;
  const attempts = Object.values(progress.exercises).reduce((sum, exercise) => sum + exercise.attempts, 0);
  const summaryCards: Array<[number, string, LucideIcon]> = [
    [completed, "Lessons complete", BarChart3],
    [secureKnowledge, "Knowledge secure", Brain],
    [secureApplication, "Application secure", Code2],
    [attempts, "Total attempts", RotateCcw],
  ];
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div><Badge variant="info"><BarChart3 className="size-3" /> Mastery</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">See what you know — and what you can apply</h1><p className="mt-2 max-w-2xl text-muted-foreground">A topic only becomes secure after repeated evidence. One correct answer is a good start, not the finish line.</p></div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{summaryCards.map(([value, label, Icon]) => <Card key={label}><CardContent className="pt-5 sm:pt-6"><Icon className="size-5 text-primary" /><p className="mt-4 font-mono text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></CardContent></Card>)}</section>
      <section className="mt-8 space-y-3">{availableLessons.map(({ unit, lesson }) => { const topic = progress.topics[`${unit.slug}/${lesson.slug}`] ?? { knowledge: { level: "not-attempted" as const, score: 0, evidence: 0 }, application: { level: "not-attempted" as const, score: 0, evidence: 0 } }; const lessonState = progress.lessons[`${unit.slug}/${lesson.slug}`]; return <Card key={`${unit.slug}/${lesson.slug}`}><CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(15rem,1fr)_minmax(12rem,.8fr)_minmax(12rem,.8fr)_auto] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Unit {unit.number} · {unit.title}</p><h2 className="mt-1 font-semibold">{lesson.title}</h2><p className="mt-1 text-xs text-muted-foreground">{lessonState?.completedSteps.length ?? 0}/7 lesson steps</p></div><MasteryCell level={topic.knowledge.level} score={topic.knowledge.score} icon={Brain} /><MasteryCell level={topic.application.level} score={topic.application.score} icon={Code2} /><Button asChild variant="ghost" size="icon"><Link href={`/course/${unit.slug}/${lesson.slug}`} aria-label={`Open ${lesson.title}`}><ArrowRight /></Link></Button></CardContent></Card>; })}</section>
      <div className="mt-8"><ProgressControls /></div>
    </div>
  );
}
