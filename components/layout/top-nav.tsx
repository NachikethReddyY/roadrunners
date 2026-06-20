import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type TopNavProps = {
  authenticated?: boolean;
  className?: string;
};

export function TopNav({ authenticated = false, className }: TopNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={authenticated ? ROUTES.journey : ROUTES.home} className="flex items-center gap-2.5">
          <Logo size="sm" className="text-primary" />
          <span className="font-heading text-base font-semibold tracking-tight">RoadRunners</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          {authenticated ? (
            <>
              <Link href={ROUTES.journey} className="text-foreground/80 hover:text-foreground">
                Journey
              </Link>
            </>
          ) : (
            <a href="#how-it-works" className="text-foreground/80 hover:text-foreground">
              How it works
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authenticated ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" className="h-11 rounded-full px-5">
                Sign out
              </Button>
            </form>
          ) : (
            <Link href={ROUTES.login} className={buttonVariants({ className: "h-11 rounded-full px-5" })}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
