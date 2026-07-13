import type { CodeLanguage, Exercise, Lesson, RequiredConstruct } from "@/types/course";

type ExampleSeed = {
  title: string;
  context: string;
  erl: string;
  python: string;
  notes: { line: string; explanation: string }[];
};

type CodeTaskSeed = {
  title: string;
  instructions: string;
  starterCode: string;
  exampleInput?: string[];
  exampleOutput: string;
  hiddenTests: { input?: string[]; expectedOutput: string; expectedVariables?: Record<string, string | number | boolean> }[];
  requiredConstructs?: RequiredConstruct[];
  restrictedPatterns?: string[];
  successMessage: string;
};

export type LessonSeed = Omit<Lesson, "examples" | "exercises"> & {
  examples: ExampleSeed[];
  predict: {
    language: CodeLanguage;
    code: string;
    expectedOutput: string;
    instructions?: string;
    misconceptionFeedback?: Record<string, string>;
  };
  debug: {
    language: CodeLanguage;
    code: string;
    errorKind: "syntax" | "runtime" | "logic";
    expectedFix: string;
    acceptedFixes?: string[];
    feedback: string;
  };
  complete: {
    language: CodeLanguage;
    instructions: string;
    codeParts: string[];
    answers: string[][];
  };
  guided: CodeTaskSeed;
  independent: CodeTaskSeed;
  review: {
    question: string;
    options: string[];
    answer: number;
    correctFeedback: string;
    incorrectFeedback?: Record<string, string>;
  };
  extraExercises?: Exercise[];
};

const defaultHints = {
  trace: [
    "Read one line at a time and keep an exact note of what is displayed.",
    "Only include output created by a print instruction.",
    "Work through the values on paper, then copy the final output exactly.",
  ],
  fix: [
    "Decide whether the program cannot run or runs with the wrong result.",
    "Compare the line with the syntax in the worked examples.",
    "Replace only the faulty line; keep the program's intended result the same.",
  ],
  complete: [
    "Say the missing line aloud in plain English first.",
    "Look for the matching pattern in the examples above.",
    "Use the shape of the surrounding code to complete the missing part.",
  ],
  write: [
    "Break the problem into input, process and output steps.",
    "Use the starter comments as a checklist for each line.",
    "Borrow the structure of the worked example and change its values or names.",
  ],
  review: [
    "Recall the definition before looking back at the code.",
    "Remove answers that describe a different programming concept.",
    "Use the exact OCR wording from the lesson's vocabulary section.",
  ],
} satisfies Record<string, [string, string, string]>;

export function buildLesson(seed: LessonSeed): Lesson {
  const id = seed.slug;
  return {
    ...seed,
    examples: seed.examples.map((example, index) => ({ ...example, id: `${id}-example-${index + 1}` })),
    exercises: [
      {
        id: `${id}-predict`,
        exercise_type: "predict_output",
        stage: "trace",
        title: "Predict the output",
        instructions: seed.predict.instructions ?? "Give the exact output produced by this code.",
        hints: defaultHints.trace,
        knowledgeWeight: 0.8,
        applicationWeight: 0.2,
        ...seed.predict,
      },
      {
        id: `${id}-debug`,
        exercise_type: "debug_code",
        stage: "fix",
        title: "Find and fix the error",
        instructions: "Identify the error type, then write the corrected code.",
        hints: defaultHints.fix,
        knowledgeWeight: 0.5,
        applicationWeight: 0.5,
        ...seed.debug,
        acceptedFixes: seed.debug.acceptedFixes ?? [],
      },
      {
        id: `${id}-complete`,
        exercise_type: "fill_blank",
        stage: "complete",
        title: "Complete the program",
        hints: defaultHints.complete,
        knowledgeWeight: 0.45,
        applicationWeight: 0.55,
        ...seed.complete,
      },
      {
        id: `${id}-guided`,
        exercise_type: "write_code",
        stage: "write",
        language: "python",
        hints: defaultHints.write,
        knowledgeWeight: 0.35,
        applicationWeight: 0.65,
        starterCode: seed.guided.starterCode,
        visibleExample: {
          input: seed.guided.exampleInput ?? [],
          expectedOutput: seed.guided.exampleOutput,
        },
        hiddenTests: seed.guided.hiddenTests.map((test) => ({ input: test.input ?? [], expectedOutput: test.expectedOutput, expectedVariables: test.expectedVariables })),
        requiredConstructs: seed.guided.requiredConstructs ?? [],
        restrictedPatterns: seed.guided.restrictedPatterns ?? [],
        title: seed.guided.title,
        instructions: seed.guided.instructions,
        successMessage: seed.guided.successMessage,
      },
      {
        id: `${id}-independent`,
        exercise_type: "write_code",
        stage: "write",
        language: "python",
        hints: defaultHints.write,
        knowledgeWeight: 0.2,
        applicationWeight: 0.8,
        starterCode: seed.independent.starterCode,
        visibleExample: {
          input: seed.independent.exampleInput ?? [],
          expectedOutput: seed.independent.exampleOutput,
        },
        hiddenTests: seed.independent.hiddenTests.map((test) => ({ input: test.input ?? [], expectedOutput: test.expectedOutput, expectedVariables: test.expectedVariables })),
        requiredConstructs: seed.independent.requiredConstructs ?? [],
        restrictedPatterns: seed.independent.restrictedPatterns ?? [],
        title: seed.independent.title,
        instructions: seed.independent.instructions,
        successMessage: seed.independent.successMessage,
      },
      {
        id: `${id}-review`,
        exercise_type: "multiple_choice",
        stage: "review",
        title: "Retrieval check",
        instructions: seed.review.question,
        hints: defaultHints.review,
        knowledgeWeight: 1,
        applicationWeight: 0,
        options: seed.review.options,
        answer: seed.review.answer,
        correctFeedback: seed.review.correctFeedback,
        incorrectFeedback: seed.review.incorrectFeedback,
      },
      ...(seed.extraExercises ?? []),
    ],
  };
}
