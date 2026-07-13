import { cn } from "@/lib/utils";

export function Progress({ value, className, label = "Progress" }: { value: number; className?: string; label?: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-slate-300", className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safe)}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${safe}%` }} />
    </div>
  );
}
