"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/course/");
  }, [router]);
  return <main className="mx-auto max-w-[1200px] px-4 py-16 text-sm text-muted-foreground">Redirecting to Learn…</main>;
}
