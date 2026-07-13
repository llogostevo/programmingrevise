"use client";

import Link from "next/link";
import { ArrowRight, Braces, CheckCircle2, Circle, Play } from "lucide-react";

import { availableLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PracticeView() {
  const progress = useProgress();
  const tasks = availableLessons.flatMap(({ unit, lesson }) => lesson.exercises.filter((exercise) => exercise.exercise_type === "write_code").map((exercise) => ({ unit, lesson, exercise })));
  const completed = tasks.filter(({ exercise }) => progress.exercises[exercise.id]?.result === "correct").length;
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge variant="info"><Braces className="size-3" /> Python practice</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Turn understanding into working code</h1><p className="mt-2 max-w-2xl text-muted-foreground">Run code as often as you like. Checking an answer uses the example and hidden test cases.</p></div><div className="rounded-2xl border bg-card px-5 py-4 text-sm"><span className="font-mono text-2xl font-semibold">{completed}/{tasks.length}</span><span className="ml-2 text-muted-foreground">tasks passed</span></div></div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">{tasks.map(({ unit, lesson, exercise }) => { const result = progress.exercises[exercise.id]; const correct = result?.result === "correct"; return <Card key={exercise.id}><CardContent className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white"><Play className="size-4" /></span>{correct ? <Badge variant="success"><CheckCircle2 className="size-3" /> Passed</Badge> : result ? <Badge variant="warning">{result.attempts} attempt{result.attempts === 1 ? "" : "s"}</Badge> : <Badge variant="muted"><Circle className="size-3" /> Not tried</Badge>}</div><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">Unit {unit.number} · {lesson.title}</p><h2 className="mt-2 text-lg font-semibold">{exercise.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{exercise.instructions}</p><Button asChild variant="outline" className="mt-5 w-full"><Link href={`/course/${unit.slug}/${lesson.slug}`}>{correct ? "Practise again" : "Open task"}<ArrowRight /></Link></Button></CardContent></Card>; })}</div>
    </div>
  );
}
