# Procedural

A static, device-local learning application for OCR J277 procedural programming. Students read OCR Exam Reference Language (ERL), write Python, run it in the browser with Pyodide, and build knowledge and application mastery through spaced review.

The complete ten-unit path covers output, variables, input, data types, sequence and arithmetic, selection, iteration, strings and arrays, procedures and functions, and robust programs.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify a production build

```bash
npm run typecheck
npm run lint
npm run build
```

The app uses Next.js static export. `npm run build` copies the required Pyodide runtime files from `node_modules` into `public/pyodide` before generating `out/`.

## Content and architecture

- `src/data/units/` — typed, unit-level lesson content
- `src/types/course.ts` — Zod-validated lesson and exercise schemas
- `src/components/course/` — dual-language examples, lesson engine and exercise renderers
- `src/lib/python-runner.ts` — browser Python execution and deterministic test checking
- `src/lib/progress.ts` — versioned, safe localStorage persistence and review spacing

There is no login, database or API route. Learner progress stays in the current browser unless it is exported as JSON from the dashboard.
