"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendAuthCodeEmail } from "@/lib/email/send-auth-code";
import { isOAuthProviderEnabled } from "@/lib/auth/oauth";
import { setOtpCookie } from "@/lib/auth/otp";
import { ROUTES } from "@/lib/constants/routes";
import { emailSchema, normalizeOtpCode } from "@/lib/schemas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type OAuthProvider = "google";

async function authCallbackUrl(next?: string) {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host") ?? process.env.NEXT_PUBLIC_APP_URL;
  const protocol = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");
  const base = host?.startsWith("http") ? host : `${protocol}://${host}`;
  const url = new URL("/auth/callback", base);
  if (next?.startsWith("/")) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

function authErrorMessage(error: { message?: string }, fallback: string) {
  const message = error.message ?? fallback;
  if (message.includes("provider is not enabled")) {
    return "Google sign-in is not set up in Supabase yet. Use email instead.";
  }
  if (
    message.toLowerCase().includes("expired") ||
    message.toLowerCase().includes("invalid")
  ) {
    return "That code expired or was already used. Tap Resend code and use the newest email.";
  }
  return message;
}

async function signInWithOAuth(provider: OAuthProvider, next?: string) {
  if (!isOAuthProviderEnabled(provider)) {
    throw new Error(
      "Google sign-in is not enabled. Use email below, or enable Google in Supabase Auth → Providers."
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: await authCallbackUrl(next),
    },
  });

  if (error) {
    throw new Error(authErrorMessage(error, "Could not start OAuth sign-in."));
  }
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

export async function sendEmailCode(
  email: string,
  next?: string
): Promise<{ success: true }> {
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    throw new Error(parsedEmail.error.issues[0]?.message ?? "Invalid email.");
  }

  const safeNext = next?.startsWith("/") ? next : undefined;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: parsedEmail.data,
    options: {
      redirectTo: await authCallbackUrl(safeNext),
    },
  });

  if (error) {
    throw new Error(authErrorMessage(error, "Could not create sign-in code."));
  }

  const code = normalizeOtpCode(data.properties?.email_otp ?? "");
  const tokenHash = data.properties?.hashed_token ?? "";
  const verificationType = data.properties?.verification_type ?? "email";

  if (!code || !tokenHash) {
    throw new Error("Could not generate sign-in code. Try again.");
  }

  await setOtpCookie({
    email: parsedEmail.data,
    type: verificationType,
    tokenHash,
    code,
    next: safeNext,
  });

  await sendAuthCodeEmail({ to: parsedEmail.data, code });
  return { success: true };
}
