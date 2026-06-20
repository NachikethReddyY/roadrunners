"use client";

import { useCallback, useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

const morphTime = 1.5;
const cooldownTime = 0.5;

function useMorphingText(texts: string[]) {
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(new Date());

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const [current1, current2] = [text1Ref.current, text2Ref.current];
      if (!current1 || !current2) return;

      current2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const invertedFraction = 1 - fraction;
      current1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts]
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current++;
    }
  }, [setStyles]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (current1 && current2) {
      current2.style.filter = "none";
      current2.style.opacity = "100%";
      current1.style.filter = "none";
      current1.style.opacity = "0%";
    }
  }, []);

  const textsKey = texts.join("\0");

  useEffect(() => {
    textIndexRef.current = 0;
    morphRef.current = 0;
    cooldownRef.current = cooldownTime;
    timeRef.current = new Date();

    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (!current1 || !current2 || texts.length === 0) return;

    current1.textContent = texts[0];
    current2.textContent = texts[1 % texts.length];
    current1.style.opacity = "0%";
    current2.style.opacity = "100%";
    current1.style.filter = "none";
    current2.style.filter = "none";
  }, [texts, textsKey]);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const newTime = new Date();
      const dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };

    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [doMorph, doCooldown]);

  return { text1Ref, text2Ref };
}

interface MorphingTextProps {
  className?: string;
  texts: string[];
  filterId: string;
  align?: "left" | "center";
}

function MorphingTextLayers({
  texts,
  filterId,
  className,
  align = "center",
}: MorphingTextProps) {
  const { text1Ref, text2Ref } = useMorphingText(texts);
  const spanClass =
    align === "left"
      ? "absolute left-0 top-0 inline-block w-full truncate text-left"
      : "absolute inset-x-0 top-0 m-auto inline-block w-full truncate text-center";

  return (
    <div
      className={cn(
        "relative h-16 w-full max-w-3xl font-sans text-[40pt] leading-none font-bold md:h-24 lg:text-[6rem]",
        align === "left" ? "mx-0 text-left" : "mx-auto text-center",
        className
      )}
      style={{ filter: `url(#${filterId}) blur(0.6px)` }}
    >
      <span className={spanClass} ref={text1Ref} />
      <span className={spanClass} ref={text2Ref} />
    </div>
  );
}

function MorphingTextFilters({ filterId }: { filterId: string }) {
  return (
    <svg
      aria-hidden
      className="fixed h-0 w-0"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id={filterId}>
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function MorphingText({
  texts,
  className,
  align = "center",
}: Omit<MorphingTextProps, "filterId">) {
  const filterId = `morph-threshold-${useId().replace(/:/g, "")}`;

  return (
    <>
      <MorphingTextLayers
        texts={texts}
        filterId={filterId}
        className={className}
        align={align}
      />
      <MorphingTextFilters filterId={filterId} />
    </>
  );
}
