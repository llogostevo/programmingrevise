"use client";

import { z } from "zod";

export const LESSON_STEPS = ["learn", "example", "trace", "fix", "complete", "write", "review"] as const;
export type LessonStep = (typeof LESSON_STEPS)[number];
export type MasteryLevel = "not-attempted" | "developing" | "secure" | "needs-review";

const masterySchema = z.object({
  score: z.number().min(0).max(1),
  evidence: z.number().int().nonnegative(),
  level: z.enum(["not-attempted", "developing", "secure", "needs-review"]),
});

const exerciseProgressSchema = z.object({
  attempts: z.number().int().nonnegative(),
  correctAttempts: z.number().int().nonnegative(),
  result: z.enum(["not-attempted", "incorrect", "partial", "correct"]),
  hintsUsed: z.number().int().min(0).max(3),
  lastSubmittedCode: z.string().max(5000).optional(),
  lastExecutionError: z.string().max(1000).optional(),
  lastAttemptedAt: z.string(),
});

const lessonProgressSchema = z.object({
  completedSteps: z.array(z.enum(LESSON_STEPS)),
  currentStep: z.enum(LESSON_STEPS),
  startedAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  expandedExamples: z.array(z.string()).optional(),
});

const reviewItemSchema = z.object({
  exerciseId: z.string(),
  unitSlug: z.string(),
  lessonSlug: z.string(),
  dueAt: z.string(),
  intervalDays: z.number().positive(),
  correctStreak: z.number().int().nonnegative(),
});

const progressSchema = z.object({
  version: z.literal(1),
  lessons: z.record(z.string(), lessonProgressSchema),
  exercises: z.record(z.string(), exerciseProgressSchema),
  topics: z.record(
    z.string(),
    z.object({ knowledge: masterySchema, application: masterySchema }),
  ),
  reviewQueue: z.array(reviewItemSchema),
  settings: z
    .object({
      orderedLessons: z.boolean(),
      codeLanguage: z.enum(["erl", "python"]).default("erl"),
    })
    .default({ orderedLessons: true, codeLanguage: "erl" }),
  updatedAt: z.string(),
});

export type ProgressState = z.infer<typeof progressSchema>;
export type ReviewItem = ProgressState["reviewQueue"][number];

const STORAGE_KEY = "procedural.progress.v1";
const nowIso = () => new Date().toISOString();
const emptyMastery = (): ProgressState["topics"][string]["knowledge"] => ({ score: 0, evidence: 0, level: "not-attempted" });

export function createEmptyProgress(): ProgressState {
  return {
    version: 1,
    lessons: {},
    exercises: {},
    topics: {},
    reviewQueue: [],
    settings: { orderedLessons: true, codeLanguage: "erl" },
    updatedAt: nowIso(),
  };
}

let snapshot = createEmptyProgress();
let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const result = progressSchema.safeParse(JSON.parse(raw));
    if (result.success) snapshot = result.data;
  } catch {
    snapshot = createEmptyProgress();
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // The app remains usable in private browsing or when storage is full.
  }
}

export function subscribeProgress(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const result = progressSchema.safeParse(JSON.parse(event.newValue));
      if (result.success) {
        snapshot = result.data;
        notify();
      }
    } catch {
      // Ignore a corrupt update from another tab and keep the last valid state.
    }
  };
  window.addEventListener("storage", onStorage);
  queueMicrotask(listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getProgressSnapshot() {
  ensureLoaded();
  return snapshot;
}

export function getServerProgressSnapshot() {
  return SERVER_SNAPSHOT;
}

const SERVER_SNAPSHOT = createEmptyProgress();

function commit(next: ProgressState) {
  snapshot = { ...next, updatedAt: nowIso() };
  persist();
  notify();
}

function lessonKey(unitSlug: string, lessonSlug: string) {
  return `${unitSlug}/${lessonSlug}`;
}

function calculateLevel(score: number, evidence: number, lastCorrect: boolean): MasteryLevel {
  if (evidence === 0) return "not-attempted";
  if (!lastCorrect && evidence >= 2) return "needs-review";
  if (evidence >= 2 && score >= 0.72) return "secure";
  return "developing";
}

export function markStepComplete(unitSlug: string, lessonSlug: string, step: LessonStep) {
  ensureLoaded();
  const key = lessonKey(unitSlug, lessonSlug);
  const existing = snapshot.lessons[key];
  const completedSteps = Array.from(new Set([...(existing?.completedSteps ?? []), step]));
  const nextStep = LESSON_STEPS[Math.min(LESSON_STEPS.indexOf(step) + 1, LESSON_STEPS.length - 1)];
  const time = nowIso();
  commit({
    ...snapshot,
    lessons: {
      ...snapshot.lessons,
      [key]: {
        completedSteps,
        currentStep: nextStep,
        startedAt: existing?.startedAt ?? time,
        updatedAt: time,
        completedAt: completedSteps.length === LESSON_STEPS.length ? existing?.completedAt ?? time : undefined,
        expandedExamples: existing?.expandedExamples,
      },
    },
  });
}

export function setCurrentStep(unitSlug: string, lessonSlug: string, step: LessonStep) {
  ensureLoaded();
  const key = lessonKey(unitSlug, lessonSlug);
  const existing = snapshot.lessons[key];
  const time = nowIso();
  commit({
    ...snapshot,
    lessons: {
      ...snapshot.lessons,
      [key]: {
        completedSteps: existing?.completedSteps ?? [],
        currentStep: step,
        startedAt: existing?.startedAt ?? time,
        updatedAt: time,
        completedAt: existing?.completedAt,
        expandedExamples: existing?.expandedExamples,
      },
    },
  });
}

export function setExpandedExamples(unitSlug: string, lessonSlug: string, expandedExamples: string[]) {
  ensureLoaded();
  const key = lessonKey(unitSlug, lessonSlug);
  const existing = snapshot.lessons[key];
  const time = nowIso();
  commit({
    ...snapshot,
    lessons: {
      ...snapshot.lessons,
      [key]: {
        completedSteps: existing?.completedSteps ?? [],
        currentStep: existing?.currentStep ?? "learn",
        startedAt: existing?.startedAt ?? time,
        updatedAt: time,
        completedAt: existing?.completedAt,
        expandedExamples,
      },
    },
  });
}

type ExerciseResult = {
  exerciseId: string;
  unitSlug: string;
  lessonSlug: string;
  correct: boolean;
  partial?: boolean;
  hintsUsed: number;
  submittedCode?: string;
  executionError?: string;
  knowledgeWeight: number;
  applicationWeight: number;
};

export function recordExerciseResult(result: ExerciseResult) {
  ensureLoaded();
  const previous = snapshot.exercises[result.exerciseId];
  const topicKey = lessonKey(result.unitSlug, result.lessonSlug);
  const topic = snapshot.topics[topicKey] ?? { knowledge: emptyMastery(), application: emptyMastery() };
  const attemptValue = result.correct ? Math.max(0.7, 1 - result.hintsUsed * 0.1) : result.partial ? 0.45 : 0;

  const updateMastery = (current: typeof topic.knowledge, weight: number) => {
    if (weight === 0) return current;
    const evidence = current.evidence + 1;
    const score = Math.max(0, Math.min(1, current.score * 0.65 + attemptValue * 0.35));
    return { score, evidence, level: calculateLevel(score, evidence, result.correct) };
  };

  const currentQueue = snapshot.reviewQueue.filter((item) => item.exerciseId !== result.exerciseId);
  const oldQueueItem = snapshot.reviewQueue.find((item) => item.exerciseId === result.exerciseId);
  const correctStreak = result.correct ? (oldQueueItem?.correctStreak ?? 0) + 1 : 0;
  const isWriteCode = result.exerciseId.endsWith("-guided") || result.exerciseId.endsWith("-independent");
  // Failed write-code tasks return immediately alongside knowledge review items.
  const intervalDays = result.correct
    ? result.hintsUsed > 0
      ? 1
      : Math.min(30, Math.max(3, (oldQueueItem?.intervalDays ?? 1) * 2))
    : isWriteCode
      ? 0
      : 1 / 144;
  const dueAt = new Date(Date.now() + intervalDays * 86_400_000).toISOString();

  commit({
    ...snapshot,
    exercises: {
      ...snapshot.exercises,
      [result.exerciseId]: {
        attempts: (previous?.attempts ?? 0) + 1,
        correctAttempts: (previous?.correctAttempts ?? 0) + (result.correct ? 1 : 0),
        result: result.correct ? "correct" : result.partial ? "partial" : "incorrect",
        hintsUsed: Math.max(previous?.hintsUsed ?? 0, result.hintsUsed),
        lastSubmittedCode: result.submittedCode?.slice(-5000) ?? previous?.lastSubmittedCode,
        lastExecutionError: result.executionError?.slice(0, 1000),
        lastAttemptedAt: nowIso(),
      },
    },
    topics: {
      ...snapshot.topics,
      [topicKey]: {
        knowledge: updateMastery(topic.knowledge, result.knowledgeWeight),
        application: updateMastery(topic.application, result.applicationWeight),
      },
    },
    reviewQueue: [
      ...currentQueue,
      { exerciseId: result.exerciseId, unitSlug: result.unitSlug, lessonSlug: result.lessonSlug, dueAt, intervalDays: Math.max(intervalDays, 1 / 144), correctStreak },
    ],
  });
}

export function setOrderedLessons(value: boolean) {
  ensureLoaded();
  commit({ ...snapshot, settings: { ...snapshot.settings, orderedLessons: value } });
}

export function setCodeLanguage(value: "erl" | "python") {
  ensureLoaded();
  commit({ ...snapshot, settings: { ...snapshot.settings, codeLanguage: value } });
}

export function exportProgress() {
  ensureLoaded();
  return JSON.stringify(snapshot, null, 2);
}

export function importProgress(raw: string) {
  try {
    const parsed = progressSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ok: false as const, message: "This file is not a valid Procedural progress export." };
    commit(parsed.data);
    return { ok: true as const, message: "Progress imported successfully." };
  } catch {
    return { ok: false as const, message: "The selected file does not contain valid JSON." };
  }
}

export function resetProgress() {
  commit(createEmptyProgress());
}

export function isReviewDue(item: ReviewItem) {
  return new Date(item.dueAt).getTime() <= Date.now();
}
