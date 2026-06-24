import { cn } from "@/lib/utils";

const PATHS = (
  <>
    <path d="M5 38h8M3 42h10" opacity="0.22" />
    <path d="M22 34C13 31 7 24 6 15" />
    <path d="M22 34C12 36 6 31 5 23" />
    <path d="M22 34C14 40 7 39 6 33" />
    <path d="M22 34c6-6 14-10 22-12c5-1 9 1 8 6" />
    <path d="M52 28c1 5-3 10-9 12c-6 2-12 0-15-4" />
    <path d="M32 28c2 3 2 7 0 9" />
    <path d="M38 17 36 10M40 16v-7M42 17l2-6" />
    <path d="M52 28 58 27" />
    <circle cx="46" cy="24" r="1.25" />
    <path d="M34 38l5 10 5 2M30 39l-5 10-5-2" />
    <path d="M44 50l4 1M20 47l-4 1" />
  </>
);

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
};

const sizes = {
  sm: "size-6",
  md: "size-8",
  lg: "size-12",
  hero: "size-[clamp(72px,10vw,96px)]",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden={size !== "hero"}
      role={size === "hero" ? "img" : undefined}
      aria-label={size === "hero" ? "RoadRunners" : undefined}
      className={cn(
        "shrink-0 stroke-current [stroke-linecap:round] [stroke-linejoin:round] [vector-effect:non-scaling-stroke]",
        sizes[size],
        className
      )}
      strokeWidth={2}
    >
      {PATHS}
    </svg>
  );
}
