"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  GoogleIcon,
  OAuthButton,
  oauthHref,
} from "@/components/auth/oauth-button";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants/routes";
import { sendEmailCode } from "@/lib/actions/auth";
import type { OAuthProviders } from "@/lib/auth/oauth";
import { hasAnyOAuthProvider } from "@/lib/auth/oauth";

type LoginFormProps = {
  nextPath?: string;
  authError?: boolean;
  authMessage?: string;
  oauth: OAuthProviders;
};

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function LoginForm({
  nextPath,
  authError,
  authMessage,
  oauth,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const safeNext = nextPath?.startsWith("/") ? nextPath : undefined;
  const displayError =
    error ?? (authError ? authMessage ?? "Sign-in did not complete. Try again." : null);

  function sendCode() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await sendEmailCode(trimmedEmail, safeNext);
        setEmail(trimmedEmail);
        setCode("");
        setStep("code");
      } catch (err) {
        setError(
          errorMessage(err, "Could not send the code. Check your email and try again.")
        );
      }
    });
  }

  const showOAuth = hasAnyOAuthProvider(oauth);

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[1.75rem] bg-primary/10 blur-2xl dark:bg-primary/15"
      />

      <div className="relative rounded-2xl border border-border/80 bg-card/95 p-8 pb-10 shadow-[0_1px_1px_#00000005,0_8px_24px_#00000012] backdrop-blur-sm dark:border-border dark:bg-card/90 dark:shadow-[0_8px_32px_#00000040] sm:p-10 sm:pb-11">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href={ROUTES.home}
            className="mb-5 flex flex-col items-center gap-2.5 rounded-xl px-2 py-1 active:opacity-80"
          >
            <Logo className="size-16 text-primary sm:size-[4.25rem]" />
            <span className="font-heading text-lg font-semibold tracking-[0.06em] text-foreground sm:text-xl">
              RoadRunners
            </span>
          </Link>
          <h1 className="font-heading text-[clamp(1.75rem,5vw,2.125rem)] font-semibold leading-tight tracking-[-0.02em] text-foreground">
            Sign in to continue
          </h1>
          <p className="mt-3 max-w-sm text-[17px] leading-[1.47] text-foreground/80">
            Pick up your learning path where you left off. No password needed.
          </p>
        </div>

        {displayError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {displayError}
          </div>
        )}

        {showOAuth && (
          <>
            <div className="space-y-3">
              {oauth.google && (
                <OAuthButton
                  label="Continue with Google"
                  icon={<GoogleIcon />}
                  href={oauthHref("google", safeNext)}
                  disabled={pending}
                />
              )}
            </div>

            <div className="relative my-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-border" aria-hidden />
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
                Or email
              </span>
              <span className="h-px flex-1 bg-border" aria-hidden />
            </div>
          </>
        )}

        {!showOAuth && step === "email" && (
          <p className="mb-6 text-center text-sm text-foreground/70">
            Sign in with a one-time code sent to your email.
          </p>
        )}

        {step === "code" ? (
          <div className="space-y-4">
            <div
              className="rounded-xl border border-primary/35 bg-[var(--primary-soft)] px-4 py-4 text-center dark:border-primary/50"
              role="status"
            >
              <p className="font-medium text-[var(--primary-active)] dark:text-primary-foreground">
                Check your inbox
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90 dark:text-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
                Enter it below to sign in.
              </p>
            </div>

            <form action="/auth/verify" method="POST" className="space-y-4">
              <input type="hidden" name="email" value={email} />
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Sign-in code
                </Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="h-12 rounded-full border-border bg-background px-4 text-center text-lg tracking-[0.3em] transition-colors duration-200 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 md:text-lg dark:bg-background/60"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={code.length !== 6}
                className="h-12 min-h-12 w-full rounded-full text-base font-medium shadow-sm transition-all duration-200 hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30 active:scale-[0.98] motion-reduce:active:scale-100"
              >
                Verify code
              </Button>
            </form>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="text-sm text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
              >
                Use a different email
              </button>
              <button
                type="button"
                className="text-sm text-foreground/70 underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                disabled={pending}
                onClick={sendCode}
              >
                Resend code
              </button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
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
                className="h-12 rounded-full border-border bg-background px-4 text-base transition-colors duration-200 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 md:text-base dark:bg-background/60"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={pending || !email.trim()}
              className="h-12 min-h-12 w-full rounded-full text-base font-medium shadow-sm transition-all duration-200 hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {pending ? "Sending code…" : "Send sign-in code"}
            </Button>
          </form>
        )}

        <p className="mt-10 max-w-sm text-center text-xs leading-relaxed text-foreground/55">
          By continuing, you agree to learn breadth-first and explore paths at
          your own pace. We only use your email to sign you in.
        </p>
      </div>
    </div>
  );
}
