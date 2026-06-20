import { StickyProgressBar } from "@/components/layout/sticky-progress-bar";
import { TopNav } from "@/components/layout/top-nav";

type AppShellProps = {
  children: React.ReactNode;
  level?: number;
  xp?: number;
  streakDays?: number;
  showProgress?: boolean;
};

export function AppShell({
  children,
  level = 1,
  xp = 0,
  streakDays = 0,
  showProgress = true,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav authenticated />
      {showProgress && (
        <StickyProgressBar level={level} xp={xp} streakDays={streakDays} />
      )}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
