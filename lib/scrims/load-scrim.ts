import { readFileSync } from "fs";
import path from "path";
import {
  lessonScrimSchema,
  scrimTimelineSchema,
  type LessonScrim,
} from "@/lib/schemas/playground";

type ScrimSeedJson = {
  slug: string;
  title: string;
  skill_tag: string;
  template: "vanilla" | "react-ts" | "python";
  initial_files: Record<string, string>;
  duration_ms: number;
  slides: LessonScrim["slides"];
  timeline: LessonScrim["timeline"];
};

export function loadScrimFromFile(filename: string): ScrimSeedJson {
  const filePath = path.join(process.cwd(), "content", "scrims", filename);
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as ScrimSeedJson;
  scrimTimelineSchema.parse(raw.timeline);
  return raw;
}

export function parseLessonScrim(row: {
  id: string;
  slug: string;
  title: string;
  skill_tag: string;
  template: string;
  initial_files: Record<string, string>;
  timeline: unknown;
  slides: unknown;
  duration_ms: number;
}): LessonScrim {
  return lessonScrimSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    skill_tag: row.skill_tag,
    template: row.template,
    initial_files: row.initial_files,
    timeline: row.timeline,
    slides: row.slides,
    duration_ms: row.duration_ms,
  });
}
