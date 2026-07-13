"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-python";

import type { CodeLanguage } from "@/types/course";
import { Button } from "@/components/ui/button";
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

export function DualCodeBlock({ erl, python, title }: { erl: string; python: string; title?: string }) {
  const [language, setLanguage] = useState<CodeLanguage>("erl");
  const [copied, setCopied] = useState(false);
  const code = language === "erl" ? erl : python;

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
                aria-selected={language === item}
                onClick={() => setLanguage(item)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition-colors", language === item ? "bg-white text-slate-950" : "text-slate-400 hover:text-white")}
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
      <HighlightedCode code={code} language={language} />
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
