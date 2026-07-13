import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: { default: "Procedural · Learn OCR J277 programming", template: "%s · Procedural" },
  description: "Read OCR Exam Reference Language, write Python and build GCSE Computer Science programming fluency.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f8f7f2" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><AppShell>{children}</AppShell></body></html>;
}
