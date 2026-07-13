import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";

import { curriculum, getUnit } from "@/data/curriculum";
import { UnitOverview } from "@/components/course/unit-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamicParams = false;
export function generateStaticParams() { return curriculum.map((unit) => ({ unitSlug: unit.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ unitSlug: string }> }): Promise<Metadata> {
  const { unitSlug } = await params;
  const unit = getUnit(unitSlug);
  return unit ? { title: unit.title, description: unit.description } : {};
}

export default async function UnitPage({ params }: { params: Promise<{ unitSlug: string }> }) {
  const { unitSlug } = await params;
  const unit = getUnit(unitSlug);
  if (!unit) notFound();
  if (unit.status === "available") return <main><UnitOverview unit={unit} /></main>;
  return <main className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:px-8"><Button asChild variant="ghost" size="sm"><Link href="/course"><ArrowLeft /> Course map</Link></Button><section className="mt-6 rounded-3xl border bg-card p-7 sm:p-10"><Badge variant="muted"><Clock3 className="size-3" /> Planned unit</Badge><h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">{unit.title}</h1><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{unit.description}</p><div className="mt-7 flex flex-wrap gap-2">{unit.plannedLessons.map((lesson) => <Badge key={lesson} variant="outline">{lesson}</Badge>)}</div><p className="mt-7 border-t pt-5 text-sm leading-6 text-muted-foreground">The course structure is ready for this unit. Its full teaching and practice content will be added in a later release.</p></section></main>;
}
