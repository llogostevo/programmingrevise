import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Check, GraduationCap, RefreshCcw, ShieldCheck } from "lucide-react";

import { availableLessons, availableUnits } from "@/data/curriculum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DualCodeBlock } from "@/components/course/dual-code-block";
import { HomeRedirect } from "@/components/layout/home-redirect";

export default function HomePage() {
  return (
    <HomeRedirect>
      <main>
        <section className="mx-auto grid max-w-[1450px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(32rem,.95fr)] lg:px-8 lg:py-24">
          <div>
            <Badge variant="info">
              <GraduationCap className="size-3" /> Built for OCR J277 Component 2
            </Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              Read the exam language. <span className="text-primary">Write real Python.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Procedural takes you from your first print statement to complete programs through short explanations, worked examples and practice that checks every answer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/course/output/printing-text/">
                  Start with lesson one <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/course/">Explore the course</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["No account needed", "Progress saved locally", "Runs Python in your browser"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-secondary/60 blur-2xl" />
            <div className="rounded-3xl border bg-card p-4 shadow-[0_24px_70px_rgba(15,23,42,.13)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Worked example</p>
                  <h2 className="mt-1 font-semibold">A personalised greeting</h2>
                </div>
                <Badge variant="success">Lesson 6</Badge>
              </div>
              <DualCodeBlock
                title="Greeting"
                erl={'name = input("What is your name? ")\nprint("Hello, " + name)'}
                python={'name = input("What is your name? ")\nprint("Hello, " + name)'}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["1", "Read"],
                  ["2", "Trace"],
                  ["3", "Write"],
                ].map(([number, label]) => (
                  <div key={number} className="rounded-xl bg-muted/65 p-3">
                    <span className="font-mono text-xs font-bold text-primary">0{number}</span>
                    <p className="mt-1 text-sm font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-card/70">
          <div className="mx-auto grid max-w-[1250px] grid-cols-2 gap-px px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
            {[
              [availableUnits.length, "units ready"],
              [availableLessons.length, "complete lessons"],
              [7, "steps per lesson"],
              [2, "mastery measures"],
            ].map(([value, label]) => (
              <div key={String(label)} className="p-4 text-center">
                <p className="font-mono text-3xl font-semibold">{value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1250px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="outline">A calm learning loop</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Support fades as your confidence grows</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Every lesson moves from a clear model to independent code, with exam technique woven through each step.
            </p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              { icon: BookOpen, title: "Learn in plain language", text: "Short explanations, exact definitions and two worked examples in ERL and Python." },
              { icon: Braces, title: "Practise with feedback", text: "Trace, debug, complete and write code. Hidden tests check that solutions really generalise." },
              { icon: RefreshCcw, title: "Remember for longer", text: "A local review queue brings questions back sooner after mistakes and later after success." },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 text-white">
          <div className="mx-auto grid max-w-[1250px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
            <div>
              <Badge className="bg-white/10 text-teal-200">Complete programming path</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Start with the essentials. Build complete solutions.</h2>
              <p className="mt-3 text-slate-300">
                All ten units are ready, taking you from first output through sequence, selection, iteration, subroutines and robust programs.
              </p>
              <Button asChild variant="secondary" className="mt-6">
                <Link href="/course/">
                  Open curriculum <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableUnits.map((unit) => (
                <Link
                  key={unit.slug}
                  href={`/course/${unit.slug}/`}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-teal-300">UNIT {unit.number.toString().padStart(2, "0")}</span>
                    <ArrowRight className="size-4 text-slate-500 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{unit.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {unit.lessons.length} lessons · {unit.specReference}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="rounded-3xl border bg-card p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Private by design</p>
                    <h2 className="text-2xl font-semibold">No login. No learner database.</h2>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Everything stays in this browser. Export a progress file when you want to move between devices, or reset it whenever you need a fresh start.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/course/">
                  Start learning <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </HomeRedirect>
  );
}
