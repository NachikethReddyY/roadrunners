import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_OTP_COOKIE,
  type StoredOtpMeta,
  clearOtpCookieOnResponse,
} from "@/lib/auth/otp";
import { ROUTES } from "@/lib/constants/routes";
import { emailSchema, otpCodeSchema } from "@/lib/schemas/auth";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

function loginErrorRedirect(origin: string, message: string) {
  const url = new URL(ROUTES.login, origin);
  url.searchParams.set("error", "auth");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

function readOtpCookieFromRequest(
  request: NextRequest,
  email: string
): StoredOtpMeta {
  const raw = request.cookies.get(AUTH_OTP_COOKIE)?.value;
  if (!raw) {
    throw new Error("Your code expired. Tap Resend code to get a new one.");
  }

  let meta: StoredOtpMeta;
  try {
    meta = JSON.parse(raw) as StoredOtpMeta;
  } catch {
    throw new Error("Your code expired. Tap Resend code to get a new one.");
  }

  if (meta.email !== email) {
    throw new Error("Use the same email address you requested the code for.");
  }

  if (!meta.tokenHash || !meta.code) {
    throw new Error("Your code expired. Tap Resend code to get a new one.");
  }

  return meta;
}

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const formData = await request.formData();

  const parsedEmail = emailSchema.safeParse(
    String(formData.get("email") ?? "")
  );
  const parsedCode = otpCodeSchema.safeParse(String(formData.get("code") ?? ""));

  if (!parsedEmail.success) {
    return loginErrorRedirect(
      origin,
      parsedEmail.error.issues[0]?.message ?? "Invalid email."
    );
  }

  if (!parsedCode.success) {
    return loginErrorRedirect(
      origin,
      parsedCode.error.issues[0]?.message ?? "Invalid code."
    );
  }

  let meta: StoredOtpMeta;
  try {
    meta = readOtpCookieFromRequest(request, parsedEmail.data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not verify your code.";
    return loginErrorRedirect(origin, message);
  }

  if (parsedCode.data !== meta.code) {
    return loginErrorRedirect(
      origin,
      "That code does not match the latest email we sent. Tap Resend code and use the new code."
    );
  }

  const destination = meta.next ?? ROUTES.onboarding;
  const response = NextResponse.redirect(new URL(destination, origin));
  const supabase = createRouteHandlerClient(request, response);
  const { error } = await supabase.auth.verifyOtp({
    token_hash: meta.tokenHash,
    type: meta.type,
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes("expired") ||
      error.message.toLowerCase().includes("invalid")
        ? "That code expired or was already used. Tap Resend code and use the newest email."
        : error.message;
    return loginErrorRedirect(origin, message);
  }

  clearOtpCookieOnResponse(response);
  return response;
}
