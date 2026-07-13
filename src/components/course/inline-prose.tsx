import { Fragment } from "react";

const TOKEN =
  /(`[^`]+`)|(\b[A-Za-z_][\w.]*(?:\[[^\]]*\])?\(\))|(\b(?:AND|OR|NOT|DIV|MOD)\b)|((?<![A-Za-z0-9_])(?:==|!=|<=|>=|\+=|-=|\*=|\/=|=|\+|%|\^)(?![A-Za-z0-9_]))/g;

function Code({ children }: { children: string }) {
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] font-medium text-foreground">
      {children}
    </code>
  );
}

export function InlineProse({ text, className }: { text: string; className?: string }) {
  const parts: Array<{ type: "text" | "code"; value: string }> = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", value: text.slice(last, index) });
    const raw = match[0];
    parts.push({ type: "code", value: raw.startsWith("`") ? raw.slice(1, -1) : raw });
    last = index + raw.length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  if (!parts.length) parts.push({ type: "text", value: text });

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.type === "code" ? (
          <Code key={`${index}-${part.value}`}>{part.value}</Code>
        ) : (
          <Fragment key={`${index}-${part.value.slice(0, 12)}`}>{part.value}</Fragment>
        ),
      )}
    </span>
  );
}
