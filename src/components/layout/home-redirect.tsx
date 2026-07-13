"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useProgress } from "@/hooks/use-progress";
import { hasLocalProgress } from "@/lib/continue";

/** Redirect returning learners with saved progress to /course/. */
export function HomeRedirect({ children }: { children: React.ReactNode }) {
  const progress = useProgress();
  const router = useRouter();
  const [showMarketing, setShowMarketing] = useState(false);

  useEffect(() => {
    if (hasLocalProgress(progress)) {
      router.replace("/course/");
      return;
    }
    setShowMarketing(true);
  }, [progress, router]);

  if (!showMarketing) {
    return <div className="mx-auto max-w-[1450px] px-4 py-24 text-sm text-muted-foreground">Loading…</div>;
  }

  return children;
}
