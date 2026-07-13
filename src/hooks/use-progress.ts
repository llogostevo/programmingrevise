"use client";

import { useSyncExternalStore } from "react";
import { getProgressSnapshot, getServerProgressSnapshot, subscribeProgress } from "@/lib/progress";

export function useProgress() {
  return useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
}
