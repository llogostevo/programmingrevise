import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { availableLessons, getLesson } from "@/data/curriculum";
import { LessonExperience } from "@/components/course/lesson-experience";

export const dynamicParams = false;
export function generateStaticParams() {
  return availableLessons.map(({ unit, lesson }) => ({ unitSlug: unit.slug, lessonSlug: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ unitSlug: string; lessonSlug: string }> }): Promise<Metadata> {
  const { unitSlug, lessonSlug } = await params;
  const result = getLesson(unitSlug, lessonSlug);
  return result ? { title: result.lesson.title, description: result.lesson.shortDescription } : {};
}

export default async function LessonPage({ params }: { params: Promise<{ unitSlug: string; lessonSlug: string }> }) {
  const { unitSlug, lessonSlug } = await params;
  const result = getLesson(unitSlug, lessonSlug);
  if (!result) notFound();
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1500px] px-4 py-12 text-sm text-muted-foreground">Loading lesson…</main>}>
      <LessonExperience unit={result.unit} lesson={result.lesson} />
    </Suspense>
  );
}
