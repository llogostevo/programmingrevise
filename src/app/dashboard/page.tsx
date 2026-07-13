import type { Metadata } from "next";
import { DashboardView } from "@/components/progress/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };
export default function DashboardPage() { return <main><DashboardView /></main>; }
