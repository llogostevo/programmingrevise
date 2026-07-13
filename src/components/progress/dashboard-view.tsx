"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, RefreshCcw, Sparkles, Target } from "lucide-react";

import { availableLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { isReviewDue } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressControls } from "@/components/progress/progress-controls";

export function DashboardView() {
  const progress = useProgress();
  const completed = availableLessons.filter(({ unit, lesson }) => progress.lessons[`${unit.slug}/${lesson.slug}`]?.completedAt);
  const started = availableLessons.filter(({ unit, lesson }) => progress.lessons[`${unit.slug}/${lesson.slug}`]);
  const next = availableLessons.find(({ unit, lesson }) => !progress.lessons[`${unit.slug}/${lesson.slug}`]?.completedAt) ?? availableLessons[0];
  const nextProgress = progress.lessons[`${next.unit.slug}/${next.lesson.slug}`];
  const reviewDue = progress.reviewQueue.filter(isReviewDue).length;
  const recent = [...started].sort((a, b) => {
    const aTime = progress.lessons[`${a.unit.slug}/${a.lesson.slug}`]?.updatedAt ?? "";
    const bTime = progress.lessons[`${b.unit.slug}/${b.lesson.slug}`]?.updatedAt ?? "";
    return bTime.localeCompare(aTime);
  }).slice(0, 3);
  const percent = Math.round((completed.length / availableLessons.length) * 100);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><Badge variant="success"><Sparkles className="size-3" /> Your learning space</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1><p className="mt-2 max-w-2xl text-muted-foreground">Pick up from your next step, or spend a few minutes strengthening earlier topics.</p></div>
        <ProgressControls compact />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5 sm:pt-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><BookOpen className="size-5" /></span><Badge variant="muted">{availableLessons.length} available</Badge></div><p className="mt-5 text-3xl font-semibold">{completed.length}</p><p className="mt-1 text-sm text-muted-foreground">Lessons completed</p></CardContent></Card>
        <Card><CardContent className="pt-5 sm:pt-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-info-soft text-info"><Target className="size-5" /></span><Badge variant="muted">Two dimensions</Badge></div><p className="mt-5 text-3xl font-semibold">{Object.values(progress.topics).filter((topic) => topic.knowledge.level === "secure" && topic.application.level === "secure").length}</p><p className="mt-1 text-sm text-muted-foreground">Topics fully secure</p></CardContent></Card>
        <Card><CardContent className="pt-5 sm:pt-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-warning-soft text-warning"><RefreshCcw className="size-5" /></span><Badge variant={reviewDue ? "warning" : "muted"}>{reviewDue ? "Ready now" : "Queue clear"}</Badge></div><p className="mt-5 text-3xl font-semibold">{reviewDue}</p><p className="mt-1 text-sm text-muted-foreground">Questions due for review</p></CardContent></Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.85fr)]">
        <Card className="overflow-hidden">
          <div className="code-grid border-b bg-slate-900 p-5 text-white sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><Badge className="bg-white/10 text-teal-200">Up next · Unit {next.unit.number}</Badge><h2 className="mt-4 text-2xl font-semibold sm:text-3xl">{next.lesson.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{next.lesson.shortDescription}</p></div><span className="font-mono text-xs text-slate-400">J277 {next.lesson.specReference}</span></div></div>
          <CardContent className="pt-5 sm:pt-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-56 flex-1"><div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>{nextProgress ? "Lesson in progress" : "Ready to begin"}</span><span>{nextProgress?.completedSteps.length ?? 0} / 7 steps</span></div><Progress value={((nextProgress?.completedSteps.length ?? 0) / 7) * 100} /></div><Button asChild size="lg"><Link href={`/course/${next.unit.slug}/${next.lesson.slug}`}>{nextProgress ? "Continue lesson" : "Start lesson"}<ArrowRight /></Link></Button></div></CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center justify-between"><CardTitle>Course progress</CardTitle><span className="font-mono text-2xl font-semibold">{percent}%</span></div></CardHeader>
          <CardContent><Progress value={percent} className="h-3" /><p className="mt-4 text-sm leading-6 text-muted-foreground">Complete both knowledge and application tasks to make each topic secure.</p><Button asChild variant="outline" className="mt-5 w-full"><Link href="/progress">View full progress <ArrowRight /></Link></Button></CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><div className="flex items-center justify-between"><CardTitle>Recently studied</CardTitle><Clock3 className="size-4 text-muted-foreground" /></div></CardHeader>
          <CardContent>
            {recent.length ? <div className="space-y-3">{recent.map(({ unit, lesson }) => { const item = progress.lessons[`${unit.slug}/${lesson.slug}`]; return <Link key={lesson.slug} href={`/course/${unit.slug}/${lesson.slug}`} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted"><span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">{item.completedAt ? <CheckCircle2 className="size-4" /> : <BookOpen className="size-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{lesson.title}</span><span className="text-xs text-muted-foreground">{unit.title} · {item.completedSteps.length}/7 steps</span></span><ArrowRight className="size-4 text-muted-foreground" /></Link>; })}</div> : <div className="rounded-xl bg-muted/60 p-5 text-center"><BookOpen className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">Your recent lessons will appear here.</p></div>}
          </CardContent>
        </Card>
        <ProgressControls />
      </section>
    </div>
  );
}
