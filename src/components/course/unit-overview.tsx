"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";

import type { CourseUnit } from "@/types/course";
import { useProgress } from "@/hooks/use-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function UnitOverview({ unit }: { unit: CourseUnit }) {
  const progress = useProgress();
  const completed = unit.lessons.filter((lesson) => progress.lessons[`${unit.slug}/${lesson.slug}`]?.completedAt).length;
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Button asChild variant="ghost" size="sm"><Link href="/course"><ArrowLeft /> Course map</Link></Button>
      <section className="code-grid mt-5 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5"><div><Badge className="bg-white/10 text-teal-200">Unit {unit.number} · J277 {unit.specReference}</Badge><h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">{unit.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{unit.description}</p></div><div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 sm:w-64"><div className="flex justify-between text-xs text-slate-300"><span>Unit progress</span><span>{completed}/{unit.lessons.length}</span></div><Progress className="mt-2 bg-white/10" value={(completed / unit.lessons.length) * 100} /></div></div>
      </section>
      <div className="mt-8 space-y-3">{unit.lessons.map((lesson, index) => { const item = progress.lessons[`${unit.slug}/${lesson.slug}`]; const done = Boolean(item?.completedAt); return <Card key={lesson.slug}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary font-mono text-sm font-bold text-primary">{done ? <CheckCircle2 className="size-5" /> : index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{lesson.title}</h2><Badge variant={done ? "success" : item ? "warning" : "muted"}>{done ? "Completed" : item ? "In progress" : "Ready"}</Badge></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{lesson.shortDescription}</p><div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {lesson.estimatedMinutes} min</span><span>·</span><span>{item?.completedSteps.length ?? 0}/7 steps</span></div></div><Button asChild variant={item ? "default" : "outline"}><Link href={`/course/${unit.slug}/${lesson.slug}`}>{item ? "Continue" : "Start"} <ArrowRight /></Link></Button></CardContent></Card>; })}</div>
    </div>
  );
}
