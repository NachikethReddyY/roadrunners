"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function preferredDarkTheme() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("rr-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return stored === "dark" || (!stored && prefersDark);
}

export function ThemeToggle() {
  const [dark, setDark] = useState(preferredDarkTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
  }, [dark]);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("rr-theme", next ? "dark" : "light");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-11 rounded-full border border-border/70 bg-background/55 shadow-sm backdrop-blur-md ring-1 ring-foreground/5 transition-colors hover:border-primary/30 hover:bg-background/80 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 dark:ring-white/10"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
