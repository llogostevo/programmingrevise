"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { Popover } from "radix-ui";

import { glossaryEntries } from "@/data/curriculum";
import { cn } from "@/lib/utils";

const CODE_TOKEN =
  /(`[^`]+`)|(\b[A-Za-z_][\w.]*(?:\[[^\]]*\])?\(\))|(\b(?:AND|OR|NOT|DIV|MOD)\b)|((?<![A-Za-z0-9_])(?:==|!=|<=|>=|\+=|-=|\*=|\/=|=|\+|%|\^)(?![A-Za-z0-9_]))/g;

function Code({ children }: { children: string }) {
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] font-medium text-foreground">
      {children}
    </code>
  );
}

function GlossaryTerm({ term, definition, unitSlug, lessonSlug }: { term: string; definition: string; unitSlug: string; lessonSlug: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="rounded-sm border-b border-dotted border-primary/50 text-left font-medium text-foreground decoration-primary/40 underline-offset-2 hover:border-primary hover:text-primary"
        >
          {term}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-4 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out"
        >
          <p className="text-sm font-semibold">{term}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{definition}</p>
          <Link href={`/course/${unitSlug}/${lessonSlug}/`} className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
            See it in the lesson
          </Link>
          <Popover.Arrow className="fill-card" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function splitByGlossary(text: string, enableGlossary: boolean) {
  if (!enableGlossary || !glossaryEntries.length) return [{ type: "text" as const, value: text }];

  const sorted = [...glossaryEntries].sort((a, b) => b.term.length - a.term.length);
  const pattern = new RegExp(`\\b(${sorted.map((entry) => entry.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  const byLower = new Map(sorted.map((entry) => [entry.term.toLowerCase(), entry]));
  const parts: Array<{ type: "text" | "term"; value: string; entry?: (typeof glossaryEntries)[number] }> = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", value: text.slice(last, index) });
    const entry = byLower.get(match[0].toLowerCase());
    if (entry) parts.push({ type: "term", value: match[0], entry });
    else parts.push({ type: "text", value: match[0] });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  if (!parts.length) parts.push({ type: "text", value: text });
  return parts;
}

function renderCodeSegments(text: string, keyPrefix: string) {
  const parts: Array<{ type: "text" | "code"; value: string }> = [];
  let last = 0;
  for (const match of text.matchAll(CODE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", value: text.slice(last, index) });
    const raw = match[0];
    parts.push({ type: "code", value: raw.startsWith("`") ? raw.slice(1, -1) : raw });
    last = index + raw.length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  if (!parts.length) parts.push({ type: "text", value: text });

  return parts.map((part, index) =>
    part.type === "code" ? (
      <Code key={`${keyPrefix}-c-${index}`}>{part.value}</Code>
    ) : (
      <Fragment key={`${keyPrefix}-t-${index}`}>{part.value}</Fragment>
    ),
  );
}

export function InlineProse({ text, className, glossary = false }: { text: string; className?: string; glossary?: boolean }) {
  const segments = useMemo(() => splitByGlossary(text, glossary), [text, glossary]);

  return (
    <span className={cn(className)}>
      {segments.map((segment, index) => {
        if (segment.type === "term" && segment.entry) {
          return (
            <GlossaryTerm
              key={`${index}-${segment.value}`}
              term={segment.value}
              definition={segment.entry.definition}
              unitSlug={segment.entry.unitSlug}
              lessonSlug={segment.entry.lessonSlug}
            />
          );
        }
        return <Fragment key={`${index}-plain`}>{renderCodeSegments(segment.value, `${index}`)}</Fragment>;
      })}
    </span>
  );
}
