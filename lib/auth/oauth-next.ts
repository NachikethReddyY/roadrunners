import { type NextRequest, type NextResponse } from "next/server";

export const OAUTH_NEXT_COOKIE = "rr_oauth_next";
const OAUTH_NEXT_TTL_SECONDS = 10 * 60;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setOAuthNextOnResponse(response: NextResponse, next?: string) {
  if (next?.startsWith("/")) {
    response.cookies.set(OAUTH_NEXT_COOKIE, next, {
      ...cookieOptions,
      maxAge: OAUTH_NEXT_TTL_SECONDS,
    });
    return;
  }
  response.cookies.set(OAUTH_NEXT_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export function readOAuthNextFromRequest(
  request: NextRequest
): string | undefined {
  const next = request.cookies.get(OAUTH_NEXT_COOKIE)?.value;
  return next?.startsWith("/") ? next : undefined;
}

export function clearOAuthNextOnResponse(response: NextResponse) {
  response.cookies.set(OAUTH_NEXT_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
