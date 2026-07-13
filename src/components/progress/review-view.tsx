"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, RefreshCcw } from "lucide-react";

import { availableLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { isReviewDue } from "@/lib/progress";
import { ExerciseRenderer } from "@/components/course/exercise-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const exerciseMap = new Map(availableLessons.flatMap(({ unit, lesson }) => lesson.exercises.map((exercise) => [exercise.id, { unit, lesson, exercise }] as const)));

export function ReviewView() {
  const progress = useProgress();
  const due = progress.reviewQueue.filter(isReviewDue).map((item) => exerciseMap.get(item.exerciseId)).filter(Boolean).slice(0, 5);
  const scheduled = progress.reviewQueue.filter((item) => !isReviewDue(item)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return (
    <div className="mx-auto max-w-[1050px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div><Badge variant="warning"><RefreshCcw className="size-3" /> Spaced review</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Bring earlier ideas back at the right time</h1><p className="mt-2 max-w-2xl text-muted-foreground">Incorrect answers return soon. Correct answers with no hints wait longer, then space out as your recall strengthens.</p></div>
      {due.length ? <div className="mt-8 space-y-8">{due.map((item) => item ? <div key={item.exercise.id}><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">{item.unit.title} · {item.lesson.title}</p><ExerciseRenderer exercise={item.exercise} unitSlug={item.unit.slug} lessonSlug={item.lesson.slug} onCorrect={() => {}} /></div> : null)}</div> : <Card className="mt-8"><CardContent className="py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-success-soft text-success"><CheckCircle2 className="size-6" /></span><h2 className="mt-4 text-xl font-semibold">You are up to date</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Complete lesson questions to build your queue. We will bring them back when they are due.</p><Button asChild className="mt-5"><Link href="/course">Choose a lesson</Link></Button></CardContent></Card>}
      {scheduled.length ? <div className="mt-8 rounded-2xl border bg-card p-5"><div className="flex items-center gap-2"><CalendarClock className="size-4 text-primary" /><h2 className="font-semibold">Coming up</h2></div><p className="mt-2 text-sm text-muted-foreground">{scheduled.length} question{scheduled.length === 1 ? " is" : "s are"} scheduled. Next review: {new Date(scheduled[0].dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.</p></div> : null}
    </div>
  );
}
