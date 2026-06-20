"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type OAuthProvider = "google" | "github";

function authCallbackUrl(next?: string) {
  const url = new URL("/auth/callback", process.env.NEXT_PUBLIC_APP_URL!);
  if (next?.startsWith("/")) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

async function signInWithOAuth(provider: OAuthProvider, next?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: authCallbackUrl(next),
    },
  });

  if (error) throw error;
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}

export async function signInWithGoogle(next?: string) {
  await signInWithOAuth("google", next);
}

export async function signInWithGitHub(next?: string) {
  await signInWithOAuth("github", next);
}

export async function signInWithMagicLink(
  email: string,
  next?: string
): Promise<{ success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: authCallbackUrl(next),
    },
  });

  if (error) throw error;
  return { success: true };
}
