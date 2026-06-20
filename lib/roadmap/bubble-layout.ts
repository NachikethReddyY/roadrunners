import { bubbleVisualMeta, isCoreSkill } from "@/lib/roadmap/filter-skills";

export type BubbleSize = { w: number; h: number };

export type PlacedBubble = {
  slug: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  opacity: number;
  depth: number;
  priority: "core" | "normal" | "ambient";
};

type Rect = { x: number; y: number; w: number; h: number };

const PADDING = 32;
const GAP = 14;
const GOLDEN = 2.399963229728653;

function hash(slug: string, i: number): number {
  let h = i * 2654435761;
  for (const c of slug) h = (h + c.charCodeAt(0) * (i + 1)) | 0;
  return Math.abs(h);
}

function rectsOverlap(a: Rect, b: Rect, gap = GAP): boolean {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

function clampBubble(
  x: number,
  y: number,
  w: number,
  h: number,
  containerW: number,
  containerH: number
): { x: number; y: number } {
  return {
    x: Math.max(PADDING, Math.min(containerW - PADDING - w, x)),
    y: Math.max(PADDING, Math.min(containerH - PADDING - h, y)),
  };
}

function estimateBubbleSize(name: string, scale: number): BubbleSize {
  const charW = 8.5;
  const baseH = 44;
  const baseW = Math.min(Math.max(name.length * charW + 36, 76), 200);
  return {
    w: Math.round(baseW * scale),
    h: Math.round(baseH * scale),
  };
}

export function layoutSkillBubbles(
  containerW: number,
  containerH: number,
  exclusion: Rect,
  skills: Array<{ slug: string; name: string }>
): PlacedBubble[] {
  if (containerW < 320 || containerH < 400 || skills.length === 0) return [];

  const cx = containerW / 2;
  const cy = containerH / 2;
  const exclusionPad = 20;
  const paddedExclusion: Rect = {
    x: exclusion.x - exclusionPad,
    y: exclusion.y - exclusionPad,
    w: exclusion.w + exclusionPad * 2,
    h: exclusion.h + exclusionPad * 2,
  };

  const exHalfW = paddedExclusion.w / 2;
  const exHalfH = paddedExclusion.h / 2;
  const innerR = Math.max(exHalfW, exHalfH) + 28;
  const outerR = Math.min(containerW, containerH) * 0.46;
  const stretchX = containerW / Math.max(containerW, containerH);
  const stretchY = containerH / Math.max(containerW, containerH);

  const placed: PlacedBubble[] = [];

  skills.forEach((skill, index) => {
    const visual = bubbleVisualMeta(skill.slug, index);
    const { w, h } = estimateBubbleSize(skill.name, visual.scale);

    for (let attempt = 0; attempt < 48; attempt++) {
      const t = index + attempt * 0.37;
      const angle = t * GOLDEN + hash(skill.slug, attempt) * 0.002;

      const bandRoll = (hash(skill.slug, index + attempt) % 100) / 100;
      let radius: number;
      if (bandRoll < 0.35) {
        radius = innerR + (outerR - innerR) * (0.08 + (hash(skill.slug, attempt) % 30) / 100);
      } else if (bandRoll < 0.75) {
        radius = innerR + (outerR - innerR) * (0.35 + (hash(skill.slug, attempt + 1) % 35) / 100);
      } else {
        radius = innerR + (outerR - innerR) * (0.72 + (hash(skill.slug, attempt + 2) % 28) / 100);
      }

      const jitterX = ((hash(skill.slug, attempt + 3) % 100) - 50) * 0.35;
      const jitterY = ((hash(skill.slug, attempt + 4) % 100) - 50) * 0.35;

      const rawX =
        cx + Math.cos(angle) * radius * stretchX + jitterX - w / 2;
      const rawY =
        cy + Math.sin(angle) * radius * stretchY + jitterY - h / 2;

      const { x, y } = clampBubble(rawX, rawY, w, h, containerW, containerH);
      const rect: Rect = { x, y, w, h };

      if (rectsOverlap(rect, paddedExclusion, 6)) continue;
      if (placed.some((p) => rectsOverlap(rect, { x: p.x, y: p.y, w: p.w, h: p.h })))
        continue;

      placed.push({
        slug: skill.slug,
        name: skill.name,
        x,
        y,
        w,
        h,
        scale: visual.scale,
        opacity: visual.opacity,
        depth: visual.depth,
        priority: visual.priority,
      });
      return;
    }
  });

  return placed;
}

export { estimateBubbleSize, isCoreSkill };
