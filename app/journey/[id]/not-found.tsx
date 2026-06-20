import Link from "next/link";
import { EmptyJourneyCard } from "@/components/journey/journey-node-card";

export default function JourneyNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16">
      <EmptyJourneyCard />
      <Link href="/journey" className="mt-6 text-center text-sm text-[var(--link)]">
        ← Back to journeys
      </Link>
    </div>
  );
}
