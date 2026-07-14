"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, RefreshCcw } from "lucide-react";

import { availableLessons } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { isWriteCodeExerciseId } from "@/lib/continue";
import { isReviewDue } from "@/lib/progress";
import { ExerciseRenderer } from "@/components/course/exercise-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const exerciseMap = new Map(
  availableLessons.flatMap(({ unit, lesson }) => lesson.exercises.map((exercise) => [exercise.id, { unit, lesson, exercise }] as const)),
);

function sortDueForMixedReview<T extends { exerciseId: string; dueAt: string }>(items: T[]) {
  const write = items.filter((item) => isWriteCodeExerciseId(item.exerciseId)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const knowledge = items.filter((item) => !isWriteCodeExerciseId(item.exerciseId)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const mixed: T[] = [];
  let wi = 0;
  let ki = 0;
  while (wi < write.length || ki < knowledge.length) {
    if (ki < knowledge.length) mixed.push(knowledge[ki++]);
    if (wi < write.length) mixed.push(write[wi++]);
  }
  return mixed;
}

export function ReviewView() {
  const progress = useProgress();
  const dueQueue = sortDueForMixedReview(progress.reviewQueue.filter(isReviewDue)).slice(0, 5);
  const due = dueQueue.map((item) => exerciseMap.get(item.exerciseId)).filter(Boolean);
  const scheduled = progress.reviewQueue.filter((item) => !isReviewDue(item)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const writeDueCount = dueQueue.filter((item) => isWriteCodeExerciseId(item.exerciseId)).length;

  return (
    <div className="mx-auto max-w-[1050px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div>
        <Badge variant="warning">
          <RefreshCcw className="size-3" /> Spaced review
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Bring earlier ideas back at the right time</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Short checks that protect what you have learned for the exam. Knowledge questions and failed write tasks return soon; confident answers wait longer.
        </p>
      </div>
      {due.length ? (
        <div className="mt-8 space-y-8">
          {writeDueCount ? (
            <p className="text-xs font-medium text-muted-foreground">
              Session includes {writeDueCount} write-code task{writeDueCount === 1 ? "" : "s"} alongside knowledge questions.
            </p>
          ) : null}
          {due.map((item) =>
            item ? (
              <div key={item.exercise.id}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  {item.unit.title} · {item.lesson.title}
                  {item.exercise.exercise_type === "write_code" ? " · Write task" : ""}
                </p>
                <ExerciseRenderer exercise={item.exercise} unitSlug={item.unit.slug} lessonSlug={item.lesson.slug} onCorrect={() => {}} />
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <Card className="mt-6 p-6 sm:p-7">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
              <CheckCircle2 className="size-5" />
            </span>
            <h2 className="mt-3 text-lg font-semibold">Nothing due — your memory queue is clear</h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
              Keep learning and these short checks will return later to protect your exam memory.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/course/">Choose a lesson</Link>
            </Button>
          </div>
        </Card>
      )}
      {scheduled.length ? (
        <div className="mt-4 rounded-2xl border bg-card px-5 py-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Coming up</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {scheduled.length} question{scheduled.length === 1 ? " is" : "s are"} scheduled. Next review:{" "}
            {new Date(scheduled[0].dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
