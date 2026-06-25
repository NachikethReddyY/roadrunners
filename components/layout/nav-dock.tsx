"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Moon,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Dock, DockIcon } from "@/components/ui/dock";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

type NavDockProps = {
  authenticated?: boolean;
  level?: number;
  streakDays?: number;
};

function dockItemClass(active: boolean) {
  return cn(
    "relative flex size-full items-center justify-center rounded-full transition-all duration-200",
    active
      ? "bg-primary/20 text-primary shadow-[0_0_0_1px_rgba(217,119,6,0.45),0_0_20px_rgba(217,119,6,0.35)]"
      : "text-foreground/65 hover:bg-foreground/8 hover:text-foreground"
  );
}

function ActiveBubble({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-[-3px] rounded-full border border-primary/50 bg-primary/10 blur-[0.5px]"
    />
  );
}

type DockNavLinkProps = {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
};

function DockNavLink({ href, active, label, children }: DockNavLinkProps) {
  return (
    <DockIcon>
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={dockItemClass(active)}
      >
        <ActiveBubble active={active} />
        <span className="relative z-[1]">{children}</span>
      </Link>
    </DockIcon>
  );
}

function ThemeDockIcon() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("rr-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
  });

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <DockIcon>
      {mounted ? (
        <AnimatedThemeToggler
          theme={theme}
          onThemeChange={(next) => {
            setTheme(next);
            localStorage.setItem("rr-theme", next);
          }}
          variant="circle"
          duration={450}
          className={dockItemClass(false)}
        />
      ) : (
        <button
          type="button"
          className={dockItemClass(false)}
          aria-label="Toggle theme"
          disabled
        >
          <Moon />
        </button>
      )}
    </DockIcon>
  );
}

export function NavDock({
  authenticated = false,
  level = 1,
  streakDays = 0,
}: NavDockProps) {
  const pathname = usePathname();
  const onRoadmapsList =
    pathname === ROUTES.journey || pathname.startsWith("/journey/");

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center"
      style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto">
        <Dock
          className={cn(
            "border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.28)]",
            "backdrop-blur-xl dark:border-white/10 dark:bg-black/35 dark:shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
          )}
        >
          {authenticated ? (
            <>
              <DockNavLink
                href={ROUTES.journey}
                active={onRoadmapsList}
                label="Roadmaps"
              >
                <LayoutGrid />
              </DockNavLink>
              <DockNavLink
                href={ROUTES.roadmapNew}
                active={pathname === ROUTES.roadmapNew}
                label="New roadmap"
              >
                <Plus />
              </DockNavLink>
              <DockIcon disableMagnification>
                <div
                  className="flex size-full flex-col items-center justify-center gap-0 text-[10px] font-semibold leading-none text-primary"
                  title={`Level ${level} · ${streakDays} day streak`}
                >
                  <Flame className="!size-4" />
                  <span>{level}</span>
                </div>
              </DockIcon>
              <ThemeDockIcon />
              <DockIcon>
                <SignOutButton className={dockItemClass(false)}>
                  <LogOut />
                </SignOutButton>
              </DockIcon>
            </>
          ) : (
            <>
              <DockNavLink href={ROUTES.home} active={pathname === ROUTES.home} label="Home">
                <Home />
              </DockNavLink>
              <DockNavLink
                href={ROUTES.login}
                active={pathname === ROUTES.login}
                label="Sign in"
              >
                <LogIn />
              </DockNavLink>
              <ThemeDockIcon />
            </>
          )}
        </Dock>
      </div>
    </div>
  );
}
