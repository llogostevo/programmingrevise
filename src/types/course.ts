import { z } from "zod";

export const languageSchema = z.enum(["erl", "python"]);
export type CodeLanguage = z.infer<typeof languageSchema>;

const exerciseBaseSchema = z.object({
  id: z.string().min(1),
  stage: z.enum(["trace", "fix", "complete", "write", "review"]),
  title: z.string().min(1),
  instructions: z.string().min(1),
  hints: z.tuple([z.string(), z.string(), z.string()]),
  knowledgeWeight: z.number().min(0).max(1).default(0.5),
  applicationWeight: z.number().min(0).max(1).default(0.5),
});

const testCaseSchema = z.object({
  input: z.array(z.string()).default([]),
  expectedOutput: z.string(),
  expectedVariables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const requiredConstructSchema = z.enum([
  "print", "input", "int", "float", "variable", "update", "concatenation", "arithmetic", "mod", "div", "power",
  "if", "nested-if", "elif", "else", "boolean", "comparison", "for", "while", "loop", "nested-loop",
  "print-in-for", "print-in-while", "input-in-loop", "update-in-loop", "index-in-loop", "append-in-loop",
  "print-in-nested-loop", "break", "list", "index", "len", "slice", "string-method", "ascii", "ord", "chr",
  "append", "function", "call", "procedure-output", "parameter", "return", "return-used", "global", "open",
  "file-read", "file-write", "random",
]);
export type RequiredConstruct = z.infer<typeof requiredConstructSchema>;

export const exerciseSchema = z.discriminatedUnion("exercise_type", [
  exerciseBaseSchema.extend({
    exercise_type: z.literal("multiple_choice"),
    options: z.array(z.string()).min(2),
    answer: z.number().int().nonnegative(),
    correctFeedback: z.string(),
    incorrectFeedback: z.record(z.string(), z.string()).optional(),
  }),
  exerciseBaseSchema.extend({
    exercise_type: z.literal("predict_output"),
    language: languageSchema,
    code: z.string(),
    expectedOutput: z.string(),
    misconceptionFeedback: z.record(z.string(), z.string()).optional(),
  }),
  exerciseBaseSchema.extend({
    exercise_type: z.literal("trace_table"),
    language: languageSchema,
    code: z.string(),
    columns: z.array(z.string()).min(2),
    rows: z.array(z.object({ line: z.number().int().positive(), values: z.array(z.string()) })).min(1),
  }),
  exerciseBaseSchema.extend({
    exercise_type: z.literal("fill_blank"),
    language: languageSchema,
    codeParts: z.array(z.string()).min(2),
    answers: z.array(z.array(z.string()).min(1)).min(1),
  }),
  exerciseBaseSchema.extend({
    exercise_type: z.literal("debug_code"),
    language: languageSchema,
    code: z.string(),
    errorKind: z.enum(["syntax", "runtime", "logic"]),
    expectedFix: z.string(),
    acceptedFixes: z.array(z.string()).default([]),
    feedback: z.string(),
  }),
  exerciseBaseSchema.extend({
    exercise_type: z.literal("write_code"),
    language: z.literal("python"),
    starterCode: z.string(),
    visibleExample: testCaseSchema,
    hiddenTests: z.array(testCaseSchema).min(1),
    requiredConstructs: z.array(requiredConstructSchema).default([]),
    restrictedPatterns: z.array(z.string()).default([]),
    successMessage: z.string(),
  }),
  exerciseBaseSchema.extend({
    exercise_type: z.literal("parsons"),
    language: languageSchema,
    lines: z.array(z.object({ id: z.string(), code: z.string(), indent: z.number().int().nonnegative() })).min(2),
    correctOrder: z.array(z.string()).min(2),
  }),
  exerciseBaseSchema.extend({
    exercise_type: z.literal("translate"),
    language: z.literal("erl"),
    code: z.string(),
    starterCode: z.string(),
    hiddenTests: z.array(testCaseSchema).min(1),
    requiredConstructs: z.array(requiredConstructSchema).default([]),
  }),
]);

export type Exercise = z.infer<typeof exerciseSchema>;
export type WriteCodeExercise = Extract<Exercise, { exercise_type: "write_code" }>;

export const vocabularySchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const exampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  context: z.string(),
  erl: z.string(),
  python: z.string(),
  notes: z.array(z.object({ line: z.string(), explanation: z.string() })).min(1),
});

export const lessonSchema = z.object({
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  objective: z.string(),
  estimatedMinutes: z.number().int().positive(),
  specReference: z.string(),
  vocabulary: z.array(vocabularySchema).min(1),
  explanation: z.string(),
  keyPoints: z.array(z.string()).min(2),
  examTip: z.string(),
  commonMistake: z.string(),
  examples: z.array(exampleSchema).min(2),
  exercises: z.array(exerciseSchema).min(5),
  retrievalPrompt: z.string(),
  examCallout: z.string(),
});

export type Lesson = z.infer<typeof lessonSchema>;

export const unitSchema = z.object({
  slug: z.string(),
  number: z.number().int().positive(),
  title: z.string(),
  specReference: z.string(),
  description: z.string(),
  accent: z.enum(["teal", "blue", "amber", "violet", "rose", "slate"]),
  status: z.enum(["available", "coming-soon"]),
  lessons: z.array(lessonSchema),
  plannedLessons: z.array(z.string()).default([]),
});

export type CourseUnit = z.infer<typeof unitSchema>;
export const curriculumSchema = z.array(unitSchema).min(1).superRefine((units, context) => {
  const unitSlugs = new Set<string>();
  const unitNumbers = new Set<number>();
  const lessonSlugs = new Set<string>();
  const exerciseIds = new Set<string>();

  units.forEach((unit, unitIndex) => {
    if (unitSlugs.has(unit.slug)) {
      context.addIssue({ code: "custom", path: [unitIndex, "slug"], message: `Duplicate unit slug: ${unit.slug}` });
    }
    unitSlugs.add(unit.slug);

    if (unitNumbers.has(unit.number)) {
      context.addIssue({ code: "custom", path: [unitIndex, "number"], message: `Duplicate unit number: ${unit.number}` });
    }
    unitNumbers.add(unit.number);

    if (unit.status === "available" && unit.lessons.length === 0) {
      context.addIssue({ code: "custom", path: [unitIndex, "lessons"], message: "An available unit must contain at least one lesson." });
    }

    unit.lessons.forEach((lesson, lessonIndex) => {
      if (lessonSlugs.has(lesson.slug)) {
        context.addIssue({ code: "custom", path: [unitIndex, "lessons", lessonIndex, "slug"], message: `Lesson slugs must be globally unique: ${lesson.slug}` });
      }
      lessonSlugs.add(lesson.slug);

      const requiredStages = ["trace", "fix", "complete", "write", "review"] as const;
      for (const stage of requiredStages) {
        if (!lesson.exercises.some((exercise) => exercise.stage === stage)) {
          context.addIssue({ code: "custom", path: [unitIndex, "lessons", lessonIndex, "exercises"], message: `Lesson ${lesson.slug} is missing its ${stage} stage.` });
        }
      }

      lesson.exercises.forEach((exercise, exerciseIndex) => {
        if (exerciseIds.has(exercise.id)) {
          context.addIssue({ code: "custom", path: [unitIndex, "lessons", lessonIndex, "exercises", exerciseIndex, "id"], message: `Exercise IDs must be globally unique: ${exercise.id}` });
        }
        exerciseIds.add(exercise.id);
      });
    });
  });
});
