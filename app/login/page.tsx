import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-[100dvh] bg-[var(--canvas-parchment)] dark:bg-background">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-10">
        <LoginForm
          nextPath={params.next}
          authError={params.error === "auth"}
        />
      </main>
    </div>
  );
}
