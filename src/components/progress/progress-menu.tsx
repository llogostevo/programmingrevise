"use client";

import { useRef, useState } from "react";
import { AlertDialog, DropdownMenu } from "radix-ui";
import { ChevronDown, Download, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportProgress, importProgress, resetProgress } from "@/lib/progress";

export function ProgressMenu() {
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
    window.setTimeout(() => setMessage(undefined), 2500);
  }

  async function importFile(file?: File) {
    if (!file) return;
    const result = importProgress(await file.text());
    setMessage(result.message);
    window.setTimeout(() => setMessage(undefined), 2500);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => importFile(event.target.files?.[0])}
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground" aria-label="Progress options">
            Progress
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-48 rounded-xl border bg-card p-1.5 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out"
          >
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
              onSelect={(event) => {
                event.preventDefault();
                download();
              }}
            >
              <Download className="size-4" /> Export
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
              onSelect={(event) => {
                event.preventDefault();
                fileRef.current?.click();
              }}
            >
              <Upload className="size-4" /> Import
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive outline-none hover:bg-rose-50"
                >
                  <RotateCcw className="size-4" /> Reset
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm" />
                <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl">
                  <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-destructive">
                    <RotateCcw className="size-5" />
                  </div>
                  <AlertDialog.Title className="mt-4 text-xl font-semibold">Reset all progress?</AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                    This clears lesson steps, code attempts, hints and the review queue from this browser. Export first if you may want it later.
                  </AlertDialog.Description>
                  <div className="mt-6 flex justify-end gap-3">
                    <AlertDialog.Cancel asChild>
                      <Button variant="outline">Keep progress</Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          resetProgress();
                          setMessage("All local progress has been reset.");
                          window.setTimeout(() => setMessage(undefined), 2500);
                        }}
                      >
                        Reset everything
                      </Button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {message ? (
        <p className="absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
