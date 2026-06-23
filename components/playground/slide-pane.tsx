"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import type { ScrimSlide } from "@/lib/schemas/playground";
import { cn } from "@/lib/utils";

type SlidePaneProps = {
  slides: ScrimSlide[];
  activeSlideId: string | null;
  onSelectSlide?: (slideId: string) => void;
  className?: string;
};

export function SlidePane({
  slides,
  activeSlideId,
  onSelectSlide,
  className,
}: SlidePaneProps) {
  const activeSlide = slides.find((s) => s.id === activeSlideId);

  if (slides.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="px-2 text-xs font-semibold uppercase tracking-widest text-[var(--on-dark-mute)]">
        Slides
      </p>
      <div className="flex flex-col gap-1 overflow-y-auto px-1">
        {slides.map((slide) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => onSelectSlide?.(slide.id)}
            className={cn(
              "rounded-lg border px-2 py-2 text-left text-xs transition-colors",
              slide.id === activeSlideId
                ? "border-[var(--primary)] bg-[var(--surface-dark-soft)] text-[var(--on-dark)]"
                : "border-transparent text-[var(--on-dark-mute)] hover:bg-[var(--surface-dark-soft)]"
            )}
          >
            {slide.title}
          </button>
        ))}
      </div>
      {activeSlide && (
        <div className="mt-2 rounded-lg border border-[var(--hairline-warm)] bg-[var(--surface-dark-elevated)] p-3">
          <p className="mb-2 text-sm font-semibold text-[var(--on-dark)]">
            {activeSlide.title}
          </p>
          {activeSlide.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSlide.image_url}
              alt={activeSlide.title}
              className="mb-2 max-h-24 w-full rounded object-contain"
            />
          )}
          {activeSlide.markdown && (
            <div className="prose prose-invert prose-sm max-w-none text-[var(--on-dark-mute)]">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {activeSlide.markdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
