"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Circle, Clock3, LockKeyhole, Map, Settings2 } from "lucide-react";

import { curriculum, availableLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { setOrderedLessons } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const accents = {
  teal: "bg-secondary text-primary",
  blue: "bg-info-soft text-info",
  amber: "bg-warning-soft text-warning",
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function CourseMap() {
  const progress = useProgress();
  const completedCount = availableLessons.filter(({ unit, lesson }) => progress.lessons[`${unit.slug}/${lesson.slug}`]?.completedAt).length;

  return (
    <div className="mx-auto max-w-[1250px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge variant="info"><Map className="size-3" /> Curriculum map</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Learn in small, connected steps</h1><p className="mt-2 max-w-2xl text-muted-foreground">Read OCR ERL, write Python and revisit key ideas as you move through J277 programming.</p></div><Card className="sm:w-80"><CardContent className="pt-5 sm:pt-6"><div className="flex justify-between text-xs font-medium text-muted-foreground"><span>Available lessons</span><span>{completedCount} / {availableLessons.length}</span></div><Progress className="mt-2" value={(completedCount / availableLessons.length) * 100} /><label className="mt-4 flex cursor-pointer items-center justify-between gap-3 border-t pt-4 text-sm"><span><span className="flex items-center gap-2 font-medium"><Settings2 className="size-4" /> Complete in order</span><span className="mt-0.5 block text-xs text-muted-foreground">Default is free navigation</span></span><input type="checkbox" className="peer sr-only" checked={progress.settings.orderedLessons} onChange={(event) => setOrderedLessons(event.target.checked)} /><span className="relative h-6 w-11 rounded-full bg-muted transition-colors after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5" /></label></CardContent></Card></div>

      <div className="relative mt-10 space-y-5 before:absolute before:bottom-8 before:left-[1.45rem] before:top-8 before:w-px before:bg-border sm:before:left-[2.45rem]">
        {curriculum.map((unit) => {
          const available = unit.status === "available";
          return (
            <section key={unit.slug} className="relative grid grid-cols-[3rem_1fr] gap-3 sm:grid-cols-[5rem_1fr] sm:gap-5">
              <div className={cn("relative z-10 grid size-12 place-items-center rounded-2xl border-4 border-background font-mono text-sm font-bold shadow-sm sm:ml-4", accents[unit.accent])}>{unit.number.toString().padStart(2, "0")}</div>
              <Card className={cn(!available && "bg-card/65")}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold sm:text-2xl">{unit.title}</h2><Badge variant="outline">{unit.specReference}</Badge>{!available ? <Badge variant="muted"><Clock3 className="size-3" /> Planned</Badge> : null}</div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{unit.description}</p></div>{available ? <Button asChild variant="ghost" size="sm"><Link href={`/course/${unit.slug}`}>Unit overview <ArrowRight /></Link></Button> : null}</div>
                  {available ? <div className="mt-5 grid gap-2">{unit.lessons.map((lesson) => {
                    const globalIndex = availableLessons.findIndex((item) => item.unit.slug === unit.slug && item.lesson.slug === lesson.slug);
                    const previous = globalIndex > 0 ? availableLessons[globalIndex - 1] : undefined;
                    const locked = Boolean(progress.settings.orderedLessons && previous && !progress.lessons[`${previous.unit.slug}/${previous.lesson.slug}`]?.completedAt);
                    const item = progress.lessons[`${unit.slug}/${lesson.slug}`];
                    const state = item?.completedAt ? "completed" : item ? "in progress" : locked ? "locked" : "available";
                    const Icon = state === "completed" ? Check : state === "locked" ? LockKeyhole : state === "in progress" ? Circle : ChevronRight;
                    const content = <><span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", state === "completed" ? "bg-success-soft text-success" : state === "in progress" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{lesson.title}</span><span className="text-xs capitalize text-muted-foreground">{state} · {lesson.estimatedMinutes} min</span></span>{item ? <span className="text-xs font-medium text-muted-foreground">{item.completedSteps.length}/7</span> : null}</>;
                    return locked ? <div key={lesson.slug} className="flex items-center gap-3 rounded-xl border bg-muted/35 p-3 opacity-65">{content}</div> : <Link key={lesson.slug} href={`/course/${unit.slug}/${lesson.slug}`} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/35 hover:bg-secondary/45">{content}</Link>;
                  })}</div> : <div className="mt-5 flex flex-wrap gap-2">{unit.plannedLessons.map((lesson) => <Badge key={lesson} variant="muted">{lesson}</Badge>)}</div>}
                </CardContent>
              </Card>
            </section>
          );
        })}
      </div>
    </div>
  );
}
