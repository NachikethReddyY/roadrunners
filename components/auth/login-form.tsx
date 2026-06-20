"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle, signInWithMagicLink } from "@/lib/actions/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="mx-auto w-full max-w-md rounded-xl">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Sign in to RoadRunners</CardTitle>
        <CardDescription>Magic link or Google — no password needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full"
          disabled={pending}
          onClick={() => startTransition(() => signInWithGoogle())}
        >
          Continue with Google
        </Button>

        <div className="relative py-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
          or
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await signInWithMagicLink(email);
              setSent(true);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-full px-4"
              required
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-full" disabled={pending}>
            Send magic link
          </Button>
        </form>

        {sent && (
          <p className="text-sm text-[var(--semantic-success)]">
            Check your inbox for a sign-in link.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
