"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { INTEREST_OPTIONS } from "@/lib/schemas/onboarding";
import { cn } from "@/lib/utils";

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggleInterest(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <Card className="w-full rounded-xl">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step {step} of 2
        </p>
        <CardTitle className="font-heading text-xl">
          {step === 1 ? "What's your goal?" : "What interests you?"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={completeOnboarding} className="space-y-6">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="goal">Learning goal</Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Become hireable full-stack"
                  className="h-11 rounded-full px-4"
                  required
                />
              </div>
              <Button
                type="button"
                className="h-11 w-full rounded-full"
                disabled={goal.trim().length < 3}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <input type="hidden" name="goal" value={goal} />
              {selected.map((id) => (
                <input key={id} type="hidden" name="interests" value={id} />
              ))}
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((item) => {
                  const active = selected.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleInterest(item.id)}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm transition-colors",
                        active && "border-primary bg-[var(--primary-soft)] text-[var(--primary-active)]"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="h-11 flex-1 rounded-full" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={selected.length === 0} className="h-11 flex-1 rounded-full">
                  Start journey
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
