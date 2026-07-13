import { availableLessons } from "@/data/curriculum";
import { LESSON_STEPS, type ProgressState, type LessonStep } from "@/lib/progress";

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

export function hasLocalProgress(progress: ProgressState): boolean {
  return (
    Object.keys(progress.lessons).length > 0 ||
    Object.keys(progress.exercises).length > 0 ||
    progress.reviewQueue.length > 0
  );
}
