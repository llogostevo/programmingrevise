import type { Metadata } from "next";
import { PracticeView } from "@/components/course/practice-view";

export const metadata: Metadata = { title: "Practice" };
export default function PracticePage() { return <main><PracticeView /></main>; }
