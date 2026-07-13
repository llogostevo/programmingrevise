"use client";

import { useId, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-python";

import type { CodeLanguage } from "@/types/course";
import { Button } from "@/components/ui/button";
import { setCodeLanguage } from "@/lib/progress";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

Prism.languages.erl = {
  comment: [
    { pattern: /\/\/.*|#.*|\/\*[\s\S]*?\*\//, greedy: true },
  ],
  string: { pattern: /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/, greedy: true },
  keyword: /\b(?:if|then|elseif|else|endif|for|to|next|step|while|endwhile|do|until|switch|case|default|endswitch|procedure|endprocedure|function|return|endfunction|const|global|array|AND|OR|NOT|DIV|MOD)\b/i,
  boolean: /\b(?:true|false)\b/i,
  function: /\b(?:print|input|str|int|float|real|bool|ASC|CHR|random|open|readLine|writeLine|close|endOfFile|newFile)(?=\s*\()/,
  number: /\b(?:0x[\da-f]+|\d+(?:\.\d+)?)\b/i,
  operator: /==|!=|<=|>=|\^|[+\-*\/%=<>]/,
  punctuation: /[{}\[\];(),.:]/,
};

type LineNote = { line: string; explanation: string };

function parseNoteLines(label: string, language: CodeLanguage): number[] {
  const bilingual = label.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (bilingual) return [Number(language === "erl" ? bilingual[1] : bilingual[2])];

  const range = label.match(/^(\d+)\s*[–-]\s*(\d+)$/);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (end >= start) return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  const single = label.match(/^(\d+)$/);
  if (single) return [Number(single[1])];

  return [];
}

function notesForLine(notes: LineNote[], lineNumber: number, language: CodeLanguage) {
  return notes.filter((note) => parseNoteLines(note.line, language).includes(lineNumber));
}

function highlightedLines(notes: LineNote[], language: CodeLanguage) {
  return new Set(notes.flatMap((note) => parseNoteLines(note.line, language)));
}

function HighlightedLine({ code, language }: { code: string; language: CodeLanguage }) {
  const html = useMemo(() => {
    const grammar = language === "erl" ? Prism.languages.erl : Prism.languages.python;
    return Prism.highlight(code || " ", grammar, language);
  }, [code, language]);

  return <code className={language === "erl" ? "erl-code" : "python-code"} dangerouslySetInnerHTML={{ __html: html }} />;
}

function HighlightedCode({ code, language }: { code: string; language: CodeLanguage }) {
  const html = useMemo(() => {
    const grammar = language === "erl" ? Prism.languages.erl : Prism.languages.python;
    return Prism.highlight(code, grammar, language);
  }, [code, language]);

  return (
    <pre className={cn("overflow-x-auto p-5 font-mono text-[13px] leading-6 text-slate-100 sm:text-sm", language === "erl" ? "erl-code" : "python-code")}>
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

function AnnotatedCode({ code, language, notes }: { code: string; language: CodeLanguage; notes: LineNote[] }) {
  const lines = code.split("\n");
  const highlighted = highlightedLines(notes, language);
  const detached = notes.filter((note) => parseNoteLines(note.line, language).length === 0);

  return (
    <div className="overflow-x-auto font-mono text-[13px] leading-6 text-slate-100 sm:text-sm">
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        const lineNotes = notesForLine(notes, lineNumber, language);
        const active = highlighted.has(lineNumber);
        return (
          <div
            key={`${lineNumber}-${line}`}
            className={cn(
              "grid grid-cols-[2.5rem_minmax(12rem,1fr)] border-l-2 sm:grid-cols-[2.5rem_minmax(14rem,1fr)_minmax(10rem,.9fr)]",
              active ? "border-l-teal-300 bg-teal-400/10" : "border-l-transparent",
            )}
          >
            <span className={cn("select-none py-1.5 pr-3 text-right", active ? "text-teal-200" : "text-slate-600")}>{lineNumber}</span>
            <pre className="overflow-x-auto py-1.5 pr-4 whitespace-pre">
              <HighlightedLine code={line} language={language} />
            </pre>
            <div className={cn("hidden border-l border-slate-800 px-3 py-1.5 text-[12px] leading-5 text-slate-300 sm:block", !lineNotes.length && "text-transparent")}>
              {lineNotes.length ? (
                <ul className="space-y-1.5 font-sans">
                  {lineNotes.map((note) => (
                    <li key={`${note.line}-${note.explanation}`}>{note.explanation}</li>
                  ))}
                </ul>
              ) : (
                "\u00a0"
              )}
            </div>
            {lineNotes.length ? (
              <div className="col-span-2 border-t border-slate-800/80 bg-slate-900/50 px-3 py-2 font-sans text-xs leading-5 text-slate-300 sm:hidden">
                {lineNotes.map((note) => (
                  <p key={`${note.line}-${note.explanation}`}>{note.explanation}</p>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      {detached.length ? (
        <div className="space-y-2 border-t border-slate-800 px-4 py-3 font-sans text-xs leading-5 text-slate-300">
          {detached.map((note) => (
            <p key={`${note.line}-${note.explanation}`}>
              <span className="font-semibold text-teal-200">{note.line}: </span>
              {note.explanation}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DualCodeBlock({
  erl,
  python,
  title,
  notes,
}: {
  erl: string;
  python: string;
  title?: string;
  notes?: LineNote[];
}) {
  const progress = useProgress();
  const language = progress.settings.codeLanguage ?? "erl";
  const [copied, setCopied] = useState(false);
  const code = language === "erl" ? erl : python;
  const reactId = useId();
  const panelId = `${reactId}-panel`;

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
        <div className="flex items-center gap-3">
          {title ? <span className="hidden text-xs font-medium text-slate-400 sm:inline">{title}</span> : null}
          <div className="flex rounded-lg bg-slate-900 p-1" role="tablist" aria-label="Code language">
            {(["erl", "python"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                id={`${reactId}-${item}`}
                aria-selected={language === item}
                aria-controls={panelId}
                tabIndex={language === item ? 0 : -1}
                onClick={() => setCodeLanguage(item)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  language === item ? "bg-white text-slate-950" : "text-slate-400 hover:text-white",
                )}
              >
                {item === "erl" ? "OCR ERL" : "Python"}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={copy} className="text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Copy code">
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={`${reactId}-${language}`}>
        {notes?.length ? <AnnotatedCode code={code} language={language} notes={notes} /> : <HighlightedCode code={code} language={language} />}
      </div>
    </div>
  );
}

export function SingleCodeBlock({ code, language, numbered = false }: { code: string; language: CodeLanguage; numbered?: boolean }) {
  if (!numbered) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
        <div className="border-b border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400">{language === "erl" ? "OCR ERL" : "Python"}</div>
        <HighlightedCode code={code} language={language} />
      </div>
    );
  }
  const lines = code.split("\n");
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-5 font-mono text-[13px] leading-6 text-slate-100 sm:text-sm">
      {lines.map((line, index) => (
        <div key={`${index}-${line}`} className="grid grid-cols-[2rem_1fr]">
          <span className="select-none pr-3 text-right text-slate-600">{index + 1}</span>
          <HighlightedInline code={line} language={language} />
        </div>
      ))}
    </div>
  );
}

function HighlightedInline({ code, language }: { code: string; language: CodeLanguage }) {
  const html = Prism.highlight(code || " ", language === "erl" ? Prism.languages.erl : Prism.languages.python, language);
  return <code className={language === "erl" ? "erl-code" : "python-code"} dangerouslySetInnerHTML={{ __html: html }} />;
}
