"use client";

import { useRef, useState } from "react";
import { AlertDialog } from "radix-ui";
import { Download, FileJson, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportProgress, importProgress, resetProgress } from "@/lib/progress";

export function ProgressControls({ compact = false }: { compact?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string>();

  function download() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `procedural-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Progress export downloaded.");
  }

  async function importFile(file?: File) {
    if (!file) return;
    const result = importProgress(await file.text());
    setMessage(result.message);
    if (fileRef.current) fileRef.current.value = "";
  }

  const controls = (
    <>
      <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => importFile(event.target.files?.[0])} />
      <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={download}><Download /> Export</Button>
      <Button type="button" variant="outline" size={compact ? "sm" : "default"} onClick={() => fileRef.current?.click()}><Upload /> Import</Button>
      <AlertDialog.Root>
        <AlertDialog.Trigger asChild><Button type="button" variant="ghost" size={compact ? "sm" : "default"} className="text-destructive hover:bg-rose-50"><RotateCcw /> Reset</Button></AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-destructive"><RotateCcw className="size-5" /></div>
            <AlertDialog.Title className="mt-4 text-xl font-semibold">Reset all progress?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">This clears lesson steps, code attempts, hints and the review queue from this browser. Export first if you may want it later.</AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3"><AlertDialog.Cancel asChild><Button variant="outline">Keep progress</Button></AlertDialog.Cancel><AlertDialog.Action asChild><Button variant="destructive" onClick={() => { resetProgress(); setMessage("All local progress has been reset."); }}>Reset everything</Button></AlertDialog.Action></div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );

  if (compact) return <div><div className="flex flex-wrap gap-2">{controls}</div>{message ? <p className="mt-2 text-xs text-muted-foreground" role="status">{message}</p> : null}</div>;

  return (
    <Card>
      <CardHeader><div className="flex items-center gap-2 text-primary"><FileJson className="size-4" /><p className="text-xs font-semibold uppercase tracking-wider">Local progress</p></div><CardTitle className="mt-1">Take your learning with you</CardTitle></CardHeader>
      <CardContent><p className="mb-4 text-sm leading-6 text-muted-foreground">Progress is saved on this device and browser only. Export a small JSON file to move between school and home.</p><div className="flex flex-wrap gap-2">{controls}</div>{message ? <p className="mt-3 text-sm text-muted-foreground" role="status">{message}</p> : null}</CardContent>
    </Card>
  );
}
