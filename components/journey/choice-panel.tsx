import { submitChoiceAction } from "@/lib/actions/journey";
import { cn } from "@/lib/utils";

export type Choice = {
  id: string;
  label: string;
  description?: string | null;
};

type ChoicePanelProps = {
  journeyId: string;
  nodeId: string;
  choices: Choice[];
};

export function ChoicePanel({ journeyId, nodeId, choices }: ChoicePanelProps) {
  return (
    <div className="space-y-3">
      {choices.map((choice) => (
        <form key={choice.id} action={submitChoiceAction}>
          <input type="hidden" name="journeyId" value={journeyId} />
          <input type="hidden" name="nodeId" value={nodeId} />
          <input type="hidden" name="choiceId" value={choice.id} />
          <button
            type="submit"
            className={cn(
              "min-h-11 w-full rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors",
              "hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--link)]"
            )}
          >
            <span className="block text-sm font-medium">{choice.label}</span>
            {choice.description && (
              <span className="mt-1 block text-sm text-muted-foreground">{choice.description}</span>
            )}
          </button>
        </form>
      ))}
      <button
        type="button"
        className="text-sm text-[var(--link)] hover:underline dark:text-[var(--link-on-dark)]"
      >
        Pivot to a different track →
      </button>
    </div>
  );
}
