import { ScrimDemo } from "@/components/playground/scrim-demo";
import scrimData from "@/content/scrims/hello-python.json";
import type { ScrimDemoData } from "@/components/playground/scrim-demo";

const demoData = scrimData as ScrimDemoData;

export const metadata = {
  title: "Python CodeCast demo · RoadRunners",
};

export default function TestScrimPage() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--canvas-dark)]">
      <ScrimDemo
        data={demoData}
        breadcrumb="Python basics / Hello world"
        className="h-full min-h-0 flex-1"
      />
    </div>
  );
}
