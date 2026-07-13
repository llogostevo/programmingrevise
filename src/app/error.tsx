"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-4 py-16 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-destructive"><CircleAlert className="size-7" /></span><h1 className="mt-5 text-3xl font-semibold">Something went wrong</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your saved progress has not been removed. Try loading this screen again.</p><Button type="button" className="mt-6" onClick={reset}><RotateCcw /> Try again</Button></div></main>;
}
