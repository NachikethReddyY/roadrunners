import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { TopNav } from "@/components/layout/top-nav";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />

      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 30%, #007cf0 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 20%, #7928ca 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 90%, #d97706 0%, transparent 45%)",
          }}
        />
        <div className="relative mx-auto flex w-full flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <Logo size="hero" className="mb-6 text-primary" />
          <h1 className="font-heading max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            The junior ladder is gone.
            <br />
            Learn breadth-first.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            RoadRunners is an AI-guided learning journey — pick your path at every step,
            pivot between domains, and earn XP as you explore what hireable looks like now.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={ROUTES.login} className={buttonVariants({ className: "h-11 rounded-full px-6 text-base" })}>
              Start your journey
            </Link>
            <a href="#how-it-works" className={buttonVariants({ variant: "outline", className: "h-11 rounded-full px-6 text-base" })}>
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Set a goal",
              body: "Tell us where you're headed — full-stack, mobile, data, or breadth across all of it.",
            },
            {
              title: "Choose your path",
              body: "At every node, AI offers 2–3 directions. Follow interest, not a fixed curriculum.",
            },
            {
              title: "Pivot anytime",
              body: "React to Swift? Web to AI? Branch without losing progress on your map.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-border bg-[var(--canvas-parchment)] px-4 py-10 text-center text-xs text-muted-foreground dark:bg-[var(--surface-dark)]">
        RoadRunners · Hackathon MVP · B1 — learning to earning
      </footer>
    </div>
  );
}
