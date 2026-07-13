import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-4 py-16 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground"><SearchX className="size-7" /></span><p className="mt-5 font-mono text-sm font-semibold text-primary">404</p><h1 className="mt-2 text-3xl font-semibold">That lesson is not here</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">It may be part of a future unit, or the address may have changed.</p><Button asChild className="mt-6"><Link href="/course"><ArrowLeft /> Back to the course</Link></Button></div></main>;
}
