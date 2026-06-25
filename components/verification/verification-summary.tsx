import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CloudOff,
  Play,
  Sparkles,
} from "lucide-react";
import {
  canUserConfirmCompletion,
  type Verdict,
} from "@/lib/journey/presentation";
import { cn } from "@/lib/utils";

export type VerificationSummaryProps = {
  verdict?: Verdict | null;
  confirmationControl?: React.ReactNode;
  className?: string;
};

function StatusRow({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof Play;
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border p-3">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "success" && "text-[var(--semantic-success)]",
          tone === "warning" && "text-[var(--semantic-warning)]",
          tone === "error" && "text-destructive",
          tone === "neutral" && "text-muted-foreground"
        )}
        aria-hidden
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm">{value}</p>
      </div>
    </li>
  );
}

export function VerificationSummary({
  verdict,
  confirmationControl,
  className,
}: VerificationSummaryProps) {
  if (!verdict) {
    return (
      <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
        <div className="flex items-start gap-3">
          <CircleDashed className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="font-heading text-lg font-semibold">Verification</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Run your own implementation. Execution, objective evidence, AI advice, and
              infrastructure status will be reported separately.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const objectiveTone =
    verdict.objectiveFulfillment === "pass"
      ? "success"
      : verdict.objectiveFulfillment === "fail"
        ? "error"
        : "warning";

  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <h2 className="font-heading text-lg font-semibold">Verification</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Objective evidence is authoritative when it covers the requirement. AI feedback is
        advisory.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatusRow
          icon={verdict.runs ? CheckCircle2 : Play}
          label="Execution"
          value={verdict.runs ? "Code ran successfully." : "Code did not run successfully."}
          tone={verdict.runs ? "success" : "error"}
        />
        <StatusRow
          icon={verdict.infrastructureError ? CloudOff : CheckCircle2}
          label="Infrastructure"
          value={
            verdict.infrastructureError
              ? "The runtime is unavailable. This is not a failure of your code."
              : "Runtime infrastructure responded."
          }
          tone={verdict.infrastructureError ? "warning" : "neutral"}
        />
        <StatusRow
          icon={objectiveTone === "success" ? CheckCircle2 : AlertTriangle}
          label="Objective evidence"
          value={`${verdict.objectiveFulfillment}: ${verdict.reason}`}
          tone={objectiveTone}
        />
        <StatusRow
          icon={Sparkles}
          label="AI advisory"
          value={
            verdict.aiAdvisory
              ? `${verdict.aiAdvisory.plausible ? "Plausible" : "Possible gap"}: ${verdict.aiAdvisory.reason}`
              : "No AI advisory was needed."
          }
          tone={verdict.aiAdvisory?.plausible === false ? "warning" : "neutral"}
        />
      </ul>

      {verdict.output && (
        <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-[#141413] p-3 text-xs text-white">
          {verdict.output}
        </pre>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm">
          <span className="font-semibold">Completion basis:</span>{" "}
          {verdict.completionBasis === "objective"
            ? "Objective verification"
            : verdict.completionBasis === "user_confirmed"
              ? "User-confirmed"
              : "Not completed"}
        </p>
        {canUserConfirmCompletion(verdict) && !verdict.completionBasis && (
          <div className="mt-3">
            <p className="mb-3 text-sm text-muted-foreground">
              Because the code runs, you may confirm the stated feature works when automation is
              incomplete. This advances the roadmap without marking concepts verified.
            </p>
            {confirmationControl}
          </div>
        )}
      </div>
    </section>
  );
}
