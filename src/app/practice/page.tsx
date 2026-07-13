"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PracticeRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/course/?tab=tasks");
  }, [router]);
  return <main className="mx-auto max-w-[1200px] px-4 py-16 text-sm text-muted-foreground">Redirecting to Tasks…</main>;
}
