import type { Metadata } from "next";
import { ReviewView } from "@/components/progress/review-view";

export const metadata: Metadata = { title: "Review" };
export default function ReviewPage() { return <main><ReviewView /></main>; }
