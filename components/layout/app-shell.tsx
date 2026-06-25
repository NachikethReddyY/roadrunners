import { NavDock } from "@/components/layout/nav-dock";
import { StickyProgressBar } from "@/components/layout/sticky-progress-bar";

type AppShellProps = {
  children: React.ReactNode;
  level?: number;
  xp?: number;
  streakDays?: number;
  showProgress?: boolean;
  showNavDock?: boolean;
  /** Full viewport width — no max-width column (roadmap creator) */
  fullBleed?: boolean;
};

export function AppShell({
  children,
  level = 1,
  xp = 0,
  streakDays = 0,
  showProgress = true,
  showNavDock = true,
  fullBleed = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {showProgress && (
        <StickyProgressBar level={level} xp={xp} streakDays={streakDays} />
      )}
      <main
        className={
          fullBleed
            ? "relative w-full flex-1"
            : "mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
      {showNavDock && (
        <NavDock authenticated level={level} streakDays={streakDays} />
      )}
    </div>
  );
}
