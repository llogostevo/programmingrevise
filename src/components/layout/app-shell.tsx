"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Braces, GraduationCap, LayoutDashboard, Menu, RefreshCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/course", label: "Course", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Braces },
  { href: "/review", label: "Review", icon: RefreshCcw },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/glossary", label: "Glossary", icon: Search },
];

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

function NavLink({ href, label, icon: Icon, onClick }: (typeof navigation)[number] & { onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href === "/course" && pathname.startsWith("/course/"));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
        active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
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
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="ml-auto hidden min-w-0 items-center gap-0.5 2xl:flex" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex 2xl:ml-0">
            <SavedChip />
            <Button asChild size="sm" className="shrink-0">
              <Link href="/dashboard">Continue learning</Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 2xl:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {open ? (
          <div className="border-t bg-card p-4 2xl:hidden">
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {navigation.map((item) => (
                <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between gap-3">
              <SavedChip />
            </div>
            <Button asChild className="mt-3 w-full">
              <Link href="/dashboard" onClick={() => setOpen(false)}>
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
          <p>Progress stays in this browser unless you export it.</p>
        </div>
      </footer>
    </div>
  );
}
