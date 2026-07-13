import type { Metadata } from "next";
import { GlossaryView } from "@/components/course/glossary-view";

export const metadata: Metadata = { title: "Glossary" };
export default function GlossaryPage() { return <main><GlossaryView /></main>; }
