"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  GitHubIcon,
  GoogleIcon,
  OAuthButton,
} from "@/components/auth/oauth-button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants/routes";
import {
  signInWithGitHub,
  signInWithGoogle,
  signInWithMagicLink,
} from "@/lib/actions/auth";

type LoginFormProps = {
  nextPath?: string;
  authError?: boolean;
};

export function LoginForm({ nextPath, authError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const safeNext = nextPath?.startsWith("/") ? nextPath : undefined;

  async function runOAuth(action: (next?: string) => Promise<void>) {
    setError(null);
    try {
      await action(safeNext);
    } catch {
      setError("Could not start sign-in. Try again or use email.");
    }
  }

  return (
    <div className="flex w-full flex-col">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href={ROUTES.home}
          className="flex min-h-11 min-w-11 items-center gap-2.5 rounded-full pr-3 active:opacity-80"
        >
          <Logo size="sm" className="text-primary" />
          <span className="font-heading text-base font-semibold tracking-tight">
            RoadRunners
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <section className="mx-auto w-full max-w-[480px] flex-1">
        <div className="mb-8 space-y-3 text-center sm:text-left">
          <Logo size="lg" className="mx-auto text-primary sm:mx-0" />
          <h1 className="font-heading text-[clamp(1.75rem,5vw,2rem)] font-semibold leading-tight tracking-[-0.02em]">
            Sign in to continue
          </h1>
          <p className="text-[17px] leading-[1.47] text-muted-foreground">
            Pick up your learning path where you left off. No password needed.
          </p>
        </div>

        {(authError || error) && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error ??
              "Sign-in did not complete. Try again or use a different method."}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_1px_#00000005,0_2px_2px_#0000000a] sm:p-8">
          <div className="space-y-3">
            <OAuthButton
              label="Continue with Google"
              icon={<GoogleIcon />}
              action={() => runOAuth(signInWithGoogle)}
              disabled={pending}
            />
            <OAuthButton
              label="Continue with GitHub"
              icon={<GitHubIcon />}
              action={() => runOAuth(signInWithGitHub)}
              disabled={pending}
            />
          </div>

          <div className="relative my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              or email
            </span>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>

          {sent ? (
            <div
              className="space-y-2 rounded-xl bg-[var(--primary-soft)] px-4 py-4 text-center sm:text-left"
              role="status"
            >
              <p className="font-medium text-foreground">Check your inbox</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We sent a sign-in link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Tap the link on this device to continue.
              </p>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                startTransition(async () => {
                  try {
                    await signInWithMagicLink(email, safeNext);
                    setSent(true);
                  } catch {
                    setError("Could not send the link. Check your email and try again.");
                  }
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 rounded-full px-4 text-base md:text-base"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="h-11 min-h-11 w-full rounded-full text-base font-medium active:scale-[0.97] motion-reduce:active:scale-100"
              >
                {pending ? "Sending link…" : "Send magic link"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 px-1 text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
          By continuing, you agree to learn breadth-first and explore paths at
          your own pace. We only use your email to sign you in.
        </p>
      </section>
    </div>
  );
}
