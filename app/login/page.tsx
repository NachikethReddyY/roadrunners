import { LoginForm } from "@/components/auth/login-form";
import { TopNav } from "@/components/layout/top-nav";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12 sm:px-6">
        <LoginForm />
      </main>
    </div>
  );
}
