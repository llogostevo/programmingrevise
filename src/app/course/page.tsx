import { Suspense } from "react";
import type { Metadata } from "next";

import { CourseMap } from "@/components/course/course-map";

export const metadata: Metadata = { title: "Learn" };

export default function CoursePage() {
  return (
    <main>
      <Suspense fallback={<div className="mx-auto max-w-[1250px] px-4 py-12 text-sm text-muted-foreground">Loading course…</div>}>
        <CourseMap />
      </Suspense>
    </main>
  );
}
