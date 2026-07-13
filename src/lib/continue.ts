import { availableLessons } from "@/data/curriculum";
import { LESSON_STEPS, type ProgressState, type LessonStep } from "@/lib/progress";
import type { Exercise, Lesson } from "@/types/course";

export function getNextLesson(progress: ProgressState) {
  return availableLessons.find(({ unit, lesson }) => !progress.lessons[`${unit.slug}/${lesson.slug}`]?.completedAt) ?? availableLessons[0];
}

export function getContinueStep(progress: ProgressState, unitSlug: string, lessonSlug: string): LessonStep {
  const lessonProgress = progress.lessons[`${unitSlug}/${lessonSlug}`];
  const completed = new Set(lessonProgress?.completedSteps ?? []);
  const firstIncomplete = LESSON_STEPS.find((step) => !completed.has(step));
  if (lessonProgress?.currentStep && !completed.has(lessonProgress.currentStep)) {
    return lessonProgress.currentStep;
  }
  return firstIncomplete ?? "learn";
}

/** Deep-link to the next incomplete lesson at its current/incomplete step. */
export function getContinueHref(progress: ProgressState): string {
  const next = getNextLesson(progress);
  if (!next) return "/course/";
  const step = getContinueStep(progress, next.unit.slug, next.lesson.slug);
  return `/course/${next.unit.slug}/${next.lesson.slug}/?step=${step}`;
}

export function writeCodeTasks(lesson: Lesson) {
  const guided = lesson.exercises.find((exercise) => exercise.exercise_type === "write_code" && exercise.id.endsWith("-guided"));
  const independent = lesson.exercises.find((exercise) => exercise.exercise_type === "write_code" && exercise.id.endsWith("-independent"));
  return { guided, independent };
}

export type TaskPassState = "passed" | "failed" | "not-tried";

export function getTaskPassState(progress: ProgressState, exerciseId: string | undefined): TaskPassState {
  if (!exerciseId) return "not-tried";
  const result = progress.exercises[exerciseId]?.result;
  if (result === "correct") return "passed";
  if (result === "incorrect" || result === "partial") return "failed";
  return "not-tried";
}

/** First write-code task in curriculum order that is not yet passed. */
export function getNextUnpassedTask(progress: ProgressState):
  | { unitSlug: string; lessonSlug: string; exercise: Extract<Exercise, { exercise_type: "write_code" }>; href: string }
  | undefined {
  for (const { unit, lesson } of availableLessons) {
    const writeTasks = lesson.exercises.filter((exercise): exercise is Extract<Exercise, { exercise_type: "write_code" }> => exercise.exercise_type === "write_code");
    for (const exercise of writeTasks) {
      if (progress.exercises[exercise.id]?.result !== "correct") {
        return {
          unitSlug: unit.slug,
          lessonSlug: lesson.slug,
          exercise,
          href: `/course/${unit.slug}/${lesson.slug}/?step=write`,
        };
      }
    }
  }
  return undefined;
}

export function hasLocalProgress(progress: ProgressState): boolean {
  return (
    Object.keys(progress.lessons).length > 0 ||
    Object.keys(progress.exercises).length > 0 ||
    progress.reviewQueue.length > 0
  );
}

export function isWriteCodeExerciseId(exerciseId: string) {
  return exerciseId.endsWith("-guided") || exerciseId.endsWith("-independent");
}
