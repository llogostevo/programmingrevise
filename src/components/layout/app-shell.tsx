"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Menu, RefreshCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProgressMenu } from "@/components/progress/progress-menu";
import { useProgress } from "@/hooks/use-progress";
import { getContinueHref } from "@/lib/continue";
import { isReviewDue } from "@/lib/progress";
import { cn } from "@/lib/utils";

function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="Procedural home">
      <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
        <GraduationCap className="size-5" />
      </span>
      <span>
        <span className="block text-base font-bold leading-4 tracking-tight">Procedural</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">OCR J277</span>
      </span>
    </Link>
  );
}

function SavedChip() {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-success-soft px-2 py-1 text-[11px] font-medium text-success"
    >
      <span className="size-1.5 rounded-full bg-success" aria-hidden />
      Saved on this device
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const progress = useProgress();
  const continueHref = getContinueHref(progress);
  const reviewDue = progress.reviewQueue.filter(isReviewDue).length;
  const learnActive = pathname === "/course" || pathname.startsWith("/course/");
  const reviewActive = pathname === "/review" || pathname.startsWith("/review/");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="ml-6 hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
            <Link
              href="/course/"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                learnActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <BookOpen className="size-4" />
              Learn
            </Link>
            <Link
              href="/review/"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                reviewActive
                  ? "bg-secondary text-secondary-foreground"
                  : reviewDue === 0
                    ? "text-muted-foreground/55 hover:bg-muted hover:text-muted-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title="Short checks that protect what you've learned for the exam"
            >
              <RefreshCcw className="size-4" />
              Review
              {reviewDue > 0 ? (
                <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-warning">{reviewDue}</span>
              ) : null}
              <span className="hidden text-[10px] font-normal text-muted-foreground lg:inline">
                {reviewDue > 0 ? "· protects exam memory" : "· queue clear"}
              </span>
            </Link>
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <SavedChip />
            <ProgressMenu />
            <Button asChild size="sm" className="shrink-0">
              <Link href={continueHref}>Continue learning</Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto shrink-0 sm:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {open ? (
          <div className="border-t bg-card p-4 sm:hidden">
            <nav className="grid gap-1" aria-label="Mobile navigation">
              <Link
                href="/course/"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  learnActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
                )}
              >
                <BookOpen className="size-4" /> Learn
              </Link>
              <Link
                href="/review/"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  reviewActive ? "bg-secondary text-secondary-foreground" : reviewDue === 0 ? "text-muted-foreground/55" : "text-muted-foreground",
                )}
              >
                <RefreshCcw className="size-4" /> Review
                {reviewDue > 0 ? (
                  <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-warning">{reviewDue}</span>
                ) : null}
              </Link>
            </nav>
            <div className="mt-3 flex items-center justify-between gap-3">
              <SavedChip />
              <ProgressMenu />
            </div>
            <Button asChild className="mt-3 w-full">
              <Link href={continueHref} onClick={() => setOpen(false)}>
                Continue learning
              </Link>
            </Button>
          </div>
        ) : null}
      </header>
      {children}
      <footer className="mt-16 border-t bg-card/60">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Procedural · OCR J277 programming practice</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/glossary/" className="hover:text-foreground">
              Glossary
            </Link>
            <p>Progress stays in this browser unless you export it.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
