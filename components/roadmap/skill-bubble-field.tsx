"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { layoutSkillBubbles, type PlacedBubble } from "@/lib/roadmap/bubble-layout";
import type { SkillBubble } from "@/lib/schemas/roadmap";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

type Rect = { x: number; y: number; w: number; h: number };

type FlyingLabel = {
  id: string;
  text: string;
  from: Point;
  to: Point;
};

type BurstParticle = {
  id: string;
  x: number;
  y: number;
  angle: number;
};

type SkillBubbleFieldProps = {
  skills: SkillBubble[];
  filterKey: string;
  exclusionRef: React.RefObject<HTMLElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (name: string) => void;
};

const depthZ = [1, 2, 3] as const;

export function SkillBubbleField({
  skills,
  filterKey,
  exclusionRef,
  inputRef,
  onPick,
}: SkillBubbleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<PlacedBubble[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [flying, setFlying] = useState<FlyingLabel | null>(null);
  const [burst, setBurst] = useState<BurstParticle[]>([]);
  const isFirstFilter = useRef(true);

  const computeLayout = useCallback(() => {
    const container = containerRef.current;
    const exclusion = exclusionRef.current;
    if (!container || !exclusion) return;

    const containerRect = container.getBoundingClientRect();
    const exclusionRect = exclusion.getBoundingClientRect();

    const exclusionLocal: Rect = {
      x: exclusionRect.left - containerRect.left,
      y: exclusionRect.top - containerRect.top,
      w: exclusionRect.width,
      h: exclusionRect.height,
    };

    setPlaced(
      layoutSkillBubbles(containerRect.width, containerRect.height, exclusionLocal, skills)
    );
  }, [exclusionRef, skills]);

  useLayoutEffect(() => {
    computeLayout();
  }, [computeLayout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => computeLayout());
    observer.observe(container);
    if (exclusionRef.current) observer.observe(exclusionRef.current);

    return () => observer.disconnect();
  }, [computeLayout, exclusionRef]);

  useEffect(() => {
    if (isFirstFilter.current) {
      isFirstFilter.current = false;
      return;
    }

    setHidden(new Set());
    setActiveSlug(null);
    setFlying(null);
  }, [filterKey]);

  function spawnBurst(centerX: number, centerY: number) {
    const particles: BurstParticle[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      x: centerX,
      y: centerY,
      angle: (360 / 10) * i + ((i * 13) % 20),
    }));
    setBurst(particles);
    window.setTimeout(() => setBurst([]), 520);
  }

  function handleClick(bubble: PlacedBubble, bubbleEl: HTMLButtonElement) {
    if (activeSlug || hidden.has(bubble.slug)) return;

    const input = inputRef.current;
    if (!input) return;

    const bubbleRect = bubbleEl.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const from = {
      x: bubbleRect.left + bubbleRect.width / 2,
      y: bubbleRect.top + bubbleRect.height / 2,
    };
    const to = {
      x: inputRect.left + inputRect.width / 2,
      y: inputRect.top + inputRect.height / 2,
    };

    setActiveSlug(bubble.slug);
    spawnBurst(from.x, from.y);
    setFlying({ id: bubble.slug, text: bubble.name, from, to });

    window.setTimeout(() => {
      setFlying(null);
      setHidden((prev) => new Set(prev).add(bubble.slug));
      setActiveSlug(null);
      onPick(bubble.name);
    }, 620);
  }

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-[8] overflow-hidden">
        {placed.map((bubble, i) => {
          if (hidden.has(bubble.slug)) return null;
          const isActive = activeSlug === bubble.slug;

          return (
            <button
              key={`${filterKey}-${bubble.slug}`}
              type="button"
              data-slug={bubble.slug}
              aria-label={bubble.name}
              onClick={(e) => handleClick(bubble, e.currentTarget)}
              style={{
                left: bubble.x,
                top: bubble.y,
                width: bubble.w,
                height: bubble.h,
                opacity: bubble.opacity,
                zIndex: depthZ[bubble.depth] ?? 2,
                animationDelay: `${(i % 8) * 0.35}s`,
                animationDuration: `${6.5 + (bubble.depth * 0.8)}s`,
              }}
              className={cn(
                "glass-bubble pointer-events-auto absolute isolate cursor-pointer overflow-hidden",
                "animate-[bubble-drift_7s_ease-in-out_infinite]",
                bubble.priority === "core" && "glass-bubble-core",
                isActive && "pointer-events-none opacity-0"
              )}
            >
              <span className="block w-full truncate px-2 text-center text-[length:var(--bubble-font,0.875rem)]">
                {bubble.name}
              </span>
            </button>
          );
        })}
      </div>

      {burst.map((p) => (
        <span
          key={p.id}
          className="burst-particle pointer-events-none fixed z-[60]"
          style={{
            left: p.x,
            top: p.y,
            ["--burst-angle" as string]: `${p.angle}deg`,
          }}
        />
      ))}

      {flying && (
        <span
          className="flying-label pointer-events-none fixed z-[70] rounded-full px-3 py-1.5 text-sm font-medium"
          style={
            {
              left: flying.from.x,
              top: flying.from.y,
              ["--fly-dx" as string]: `${flying.to.x - flying.from.x}px`,
              ["--fly-dy" as string]: `${flying.to.y - flying.from.y}px`,
            } as React.CSSProperties
          }
        >
          {flying.text}
        </span>
      )}
    </>
  );
}
