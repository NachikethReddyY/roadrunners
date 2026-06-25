import { NavDock } from "@/components/layout/nav-dock";

type AppShellProps = {
  children: React.ReactNode;
  level?: number;
  xp?: number;
  streakDays?: number;
  showProgress?: boolean;
  /** Full viewport width — no max-width column (roadmap creator) */
  fullBleed?: boolean;
};

export function AppShell({
  children,
  level = 1,
  streakDays = 0,
  fullBleed = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main
        className={
          fullBleed
            ? "relative w-full flex-1"
            : "mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
      <NavDock authenticated level={level} streakDays={streakDays} />
    </div>
  );
}
