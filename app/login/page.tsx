import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getOAuthProviders } from "@/lib/auth/oauth";
import { ROUTES } from "@/lib/constants/routes";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const oauth = getOAuthProviders();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--canvas-parchment)] dark:bg-background">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[100px] dark:bg-primary/10 lg:left-[28%] lg:top-1/2"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]"
      />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-6">
        <Link
          href={ROUTES.home}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-full border border-border/70 bg-background/55 px-1 pr-3 text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-md ring-1 ring-foreground/5 transition-colors hover:border-primary/30 hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25 active:scale-[0.97] motion-reduce:active:scale-100 dark:ring-white/10"
        >
          <ChevronLeft className="size-5 shrink-0" aria-hidden />
          Back
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-6xl lg:grid-cols-[1fr_minmax(0,520px)] lg:items-center lg:gap-8 lg:pl-4 lg:pr-8 xl:pl-6">
        {/* Brand panel — desktop */}
        <aside className="hidden flex-col items-start justify-center py-16 pl-0 pr-8 lg:flex xl:pr-12">
          <div className="relative w-full max-w-[28rem]">
            <div
              aria-hidden
              className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl"
            />
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              AI-guided learning
            </p>
            <h2 className="font-heading text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
              The junior ladder is gone. Learn breadth-first.
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-foreground/75">
              Branch across skills, pivot when it feels right, and build a journey
              that scales with you — not a fixed curriculum.
            </p>
          </div>
        </aside>

        <div className="flex min-h-[100dvh] flex-col justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))] sm:px-6 lg:min-h-0 lg:py-16">
          <LoginForm
            nextPath={params.next}
            authError={params.error === "auth"}
            authMessage={params.message}
            oauth={oauth}
          />
        </div>
      </main>
    </div>
  );
}
