import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn("h-10 w-full rounded-lg border bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground disabled:opacity-50", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("min-h-24 w-full rounded-lg border bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground disabled:opacity-50", className)} {...props} />;
}

export { Input, Textarea };
