"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, Search } from "lucide-react";

import { glossaryEntries } from "@/data/curriculum";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function GlossaryView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => { const value = query.trim().toLowerCase(); return value ? glossaryEntries.filter((entry) => entry.term.toLowerCase().includes(value) || entry.definition.toLowerCase().includes(value)) : glossaryEntries; }, [query]);
  return (
    <div className="mx-auto max-w-[1050px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div><Badge variant="info"><BookMarked className="size-3" /> OCR vocabulary</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Use the words examiners expect</h1><p className="mt-2 max-w-2xl text-muted-foreground">Search the definitions introduced in the available lessons.</p></div>
      <div className="relative mt-7"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for variable, casting, output…" className="h-12 pl-10 text-base" aria-label="Search glossary" /></div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{filtered.length} {filtered.length === 1 ? "definition" : "definitions"}</p>
      {filtered.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{filtered.map((entry) => <Card key={entry.term.toLowerCase()}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold">{entry.term}</h2><Badge variant="muted">{entry.unitTitle}</Badge></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.definition}</p><Link href={`/course/${entry.unitSlug}/${entry.lessonSlug}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See it in the lesson <ArrowRight className="size-3" /></Link></CardContent></Card>)}</div> : <Card className="mt-5"><CardContent className="py-12 text-center"><Search className="mx-auto size-6 text-muted-foreground" /><h2 className="mt-3 font-semibold">No matching term</h2><p className="mt-1 text-sm text-muted-foreground">Try a shorter word or search the definition.</p></CardContent></Card>}
    </div>
  );
}
