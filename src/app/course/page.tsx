import type { Metadata } from "next";

import { CourseMap } from "@/components/course/course-map";

export const metadata: Metadata = { title: "Learn" };

export default function CoursePage() {
  return (
    <main>
      <CourseMap />
    </main>
  );
}
