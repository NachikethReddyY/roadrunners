import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextResponse } from "next/server";
import { cookies } from "next/headers";

export const AUTH_OTP_COOKIE = "rr_auth_otp";
export const AUTH_OTP_TTL_SECONDS = 4 * 60;
export const AUTH_OTP_TTL_MINUTES = 4;

export type StoredOtpMeta = {
  email: string;
  type: EmailOtpType;
  tokenHash: string;
  code: string;
  next?: string;
};

export async function setOtpCookie(meta: StoredOtpMeta) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_OTP_COOKIE, JSON.stringify(meta), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_OTP_TTL_SECONDS,
    path: "/",
  });
}

export async function readOtpCookie(email: string): Promise<StoredOtpMeta> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_OTP_COOKIE)?.value;
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

export async function clearOtpCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_OTP_COOKIE);
}

export function clearOtpCookieOnResponse(response: NextResponse) {
  response.cookies.set(AUTH_OTP_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
