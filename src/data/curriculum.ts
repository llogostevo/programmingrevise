import { curriculumSchema } from "@/types/course";
import { outputUnit } from "@/data/units/output";
import { variablesUnit } from "@/data/units/variables";
import { inputUnit } from "@/data/units/input";
import { dataTypesUnit } from "@/data/units/data-types";
import { arithmeticUnit } from "@/data/units/arithmetic";
import { selectionUnit } from "@/data/units/selection";
import { iterationUnit } from "@/data/units/iteration";
import { stringsArraysUnit } from "@/data/units/strings-arrays";
import { proceduresFunctionsUnit } from "@/data/units/procedures-functions";
import { robustProgramsUnit } from "@/data/units/robust-programs";

export const curriculum = curriculumSchema.parse([
  outputUnit,
  variablesUnit,
  inputUnit,
  dataTypesUnit,
  arithmeticUnit,
  selectionUnit,
  iterationUnit,
  stringsArraysUnit,
  proceduresFunctionsUnit,
  robustProgramsUnit,
]);

export const availableUnits = curriculum.filter((unit) => unit.status === "available");
export const availableLessons = availableUnits.flatMap((unit) =>
  unit.lessons.map((lesson) => ({ unit, lesson })),
);

export function getUnit(slug: string) {
  return curriculum.find((unit) => unit.slug === slug);
}

export function getLesson(unitSlug: string, lessonSlug: string) {
  const unit = getUnit(unitSlug);
  const lesson = unit?.lessons.find((item) => item.slug === lessonSlug);
  return unit && lesson ? { unit, lesson } : undefined;
}

export const glossaryEntries = Array.from(
  new Map(
    availableLessons.flatMap(({ unit, lesson }) =>
      lesson.vocabulary.map((entry) => [
        entry.term.toLowerCase(),
        { ...entry, unitTitle: unit.title, unitSlug: unit.slug, lessonSlug: lesson.slug },
      ] as const),
    ),
  ).values(),
).sort((a, b) => a.term.localeCompare(b.term));
