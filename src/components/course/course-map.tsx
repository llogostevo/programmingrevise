"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  LockKeyhole,
  Map,
  Settings2,
} from "lucide-react";

import { curriculum, availableLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { getNextLesson, getTaskPassState, writeCodeTasks, type TaskPassState } from "@/lib/continue";
import { isReviewDue, setOrderedLessons } from "@/lib/progress";
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

function TaskBadge({ label, state }: { label: "Guided write" | "Own write"; state: TaskPassState }) {
  if (state === "passed") {
    return (
      <Badge variant="success" className="gap-1">
        <Check className="size-3" />
        {label}
      </Badge>
    );
  }
  if (state === "failed") {
    return <Badge variant="warning">{label}</Badge>;
  }
  return <Badge variant="muted">{label}</Badge>;
}

function lessonRowId(unitSlug: string, lessonSlug: string) {
  return `lesson-row-${unitSlug}--${lessonSlug}`;
}

export function CourseMap() {
  const progress = useProgress();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const highlightTimer = useRef<number>(undefined);
  const completedCount = availableLessons.filter(({ unit, lesson }) => progress.lessons[`${unit.slug}/${lesson.slug}`]?.completedAt).length;
  const next = getNextLesson(progress);
  const nextProgress = next ? progress.lessons[`${next.unit.slug}/${next.lesson.slug}`] : undefined;
  const reviewDue = progress.reviewQueue.filter(isReviewDue).length;

  function scrollToNextLesson() {
    if (!next) return;
    const key = `${next.unit.slug}/${next.lesson.slug}`;
    const row = document.getElementById(lessonRowId(next.unit.slug, next.lesson.slug));
    if (!row) return;

    window.clearTimeout(highlightTimer.current);
    setHighlightedKey(null);

    let started = false;
    const startHighlight = () => {
      if (started) return;
      started = true;
      window.removeEventListener("scrollend", startHighlight);
      setHighlightedKey(key);
      highlightTimer.current = window.setTimeout(() => setHighlightedKey(null), 2400);
    };
    // "scrollend" fires when the smooth scroll settles; the timeout covers
    // browsers without it and the case where no scrolling is needed.
    window.addEventListener("scrollend", startHighlight, { once: true });
    window.setTimeout(startHighlight, 1200);
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="mx-auto max-w-[1250px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="info">
            <Map className="size-3" /> Learn
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your next step</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {completedCount}/{availableLessons.length} lessons complete
            {reviewDue > 0 ? ` · ${reviewDue} review${reviewDue === 1 ? "" : "s"} ready` : ""}
          </p>
        </div>
        <div className="relative">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOptionsOpen((value) => !value)} aria-expanded={optionsOpen}>
            <Settings2 className="size-4" /> Options
          </Button>
          {optionsOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-card p-4 shadow-lg">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                <span>
                  <span className="flex items-center gap-2 font-medium">Complete in order</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Turn off for free navigation</span>
                </span>
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={progress.settings.orderedLessons}
                  onChange={(event) => setOrderedLessons(event.target.checked)}
                />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-muted transition-colors after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5" />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {next ? (
        <Card className="mt-6 overflow-hidden">
          <div className="code-grid border-b bg-slate-900 p-5 text-white sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge className="bg-white/10 text-teal-200">Up next · Unit {next.unit.number}</Badge>
                <h2 className="mt-4 text-2xl font-semibold sm:text-4xl">{next.lesson.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{next.lesson.shortDescription}</p>
              </div>
              <span className="font-mono text-xs text-slate-400">J277 {next.lesson.specReference}</span>
            </div>
          </div>
          <CardContent className="pt-5 sm:pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-56 flex-1">
                <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                  <span>{nextProgress ? "Lesson in progress" : "Ready to begin"}</span>
                  <span>{nextProgress?.completedSteps.length ?? 0} / 7 steps</span>
                </div>
                <Progress value={((nextProgress?.completedSteps.length ?? 0) / 7) * 100} />
              </div>
              <Button type="button" size="lg" onClick={scrollToNextLesson}>
                Go to next lesson
                <ArrowDown />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Full curriculum</h2>
          <p className="mt-1 text-xs text-muted-foreground">Guided write = supported task · Own write = on your own</p>
        </div>
      </div>

      <div className="relative mt-5 space-y-5 before:absolute before:bottom-8 before:left-[1.45rem] before:top-8 before:w-px before:bg-border sm:before:left-[2.45rem]">
        {curriculum.map((unit) => {
          const available = unit.status === "available";
          return (
            <section key={unit.slug} id={`unit-${unit.slug}`} className="relative grid scroll-mt-24 grid-cols-[3rem_1fr] gap-3 sm:grid-cols-[5rem_1fr] sm:gap-5">
              <div
                className={cn(
                  "relative z-10 grid size-12 place-items-center rounded-2xl border-4 border-background font-mono text-sm font-bold shadow-sm sm:ml-4",
                  accents[unit.accent],
                )}
              >
                {unit.number.toString().padStart(2, "0")}
              </div>
              <Card className={cn(!available && "bg-card/65")}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold sm:text-2xl">{unit.title}</h3>
                        <Badge variant="outline">{unit.specReference}</Badge>
                        {!available ? (
                          <Badge variant="muted">
                            <Clock3 className="size-3" /> Planned
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{unit.description}</p>
                    </div>
                  </div>
                  {available ? (
                    <div className="mt-5 grid gap-2">
                      {unit.lessons.map((lesson) => {
                        const globalIndex = availableLessons.findIndex((item) => item.unit.slug === unit.slug && item.lesson.slug === lesson.slug);
                        const previous = globalIndex > 0 ? availableLessons[globalIndex - 1] : undefined;
                        const locked = Boolean(
                          progress.settings.orderedLessons && previous && !progress.lessons[`${previous.unit.slug}/${previous.lesson.slug}`]?.completedAt,
                        );
                        const item = progress.lessons[`${unit.slug}/${lesson.slug}`];
                        const stepsDone = item?.completedSteps.length ?? 0;
                        const { guided, independent } = writeCodeTasks(lesson);
                        const guidedState = getTaskPassState(progress, guided?.id);
                        const ownState = getTaskPassState(progress, independent?.id);
                        const state = item?.completedAt ? "completed" : item ? "in progress" : locked ? "locked" : "available";
                        const Icon = state === "completed" ? Check : state === "locked" ? LockKeyhole : state === "in progress" ? Circle : ChevronRight;
                        const content = (
                          <>
                            <span
                              className={cn(
                                "grid size-8 shrink-0 place-items-center rounded-lg",
                                state === "completed"
                                  ? "bg-success-soft text-success"
                                  : state === "in progress"
                                    ? "bg-warning-soft text-warning"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{lesson.title}</span>
                              <span className="text-xs capitalize text-muted-foreground">
                                {state} · {lesson.estimatedMinutes} min · {stepsDone}/7 steps
                              </span>
                            </span>
                            <span className="flex flex-wrap items-center justify-end gap-1.5">
                              <TaskBadge label="Guided write" state={guidedState} />
                              <TaskBadge label="Own write" state={ownState} />
                            </span>
                          </>
                        );
                        return locked ? (
                          <div key={lesson.slug} id={lessonRowId(unit.slug, lesson.slug)} className="flex items-center gap-3 rounded-xl border bg-muted/35 p-3 opacity-65">
                            {content}
                          </div>
                        ) : (
                          <Link
                            key={lesson.slug}
                            id={lessonRowId(unit.slug, lesson.slug)}
                            href={`/course/${unit.slug}/${lesson.slug}/`}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/35 hover:bg-secondary/45",
                              highlightedKey === `${unit.slug}/${lesson.slug}` && "lesson-row-pulse",
                            )}
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {unit.plannedLessons.map((lesson) => (
                        <Badge key={lesson} variant="muted">
                          {lesson}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          );
        })}
      </div>
    </div>
  );
}
