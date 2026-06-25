import { type NextRequest, NextResponse } from "next/server";
import {
  clearOAuthNextOnResponse,
  readOAuthNextFromRequest,
} from "@/lib/auth/oauth-next";
import { ROUTES } from "@/lib/constants/routes";
import { createRouteHandlerClientWithCookies } from "@/lib/supabase/route-handler";

function loginErrorRedirect(origin: string, message?: string) {
  const url = new URL(ROUTES.login, origin);
  url.searchParams.set("error", "auth");
  if (message) {
    url.searchParams.set("message", message);
  }
  return NextResponse.redirect(url);
}

function oauthErrorMessage(raw?: string | null) {
  if (!raw) return undefined;

  const lower = raw.toLowerCase();

  if (lower.includes("unable to exchange external code")) {
    return [
      "Google sign-in could not be verified with Google.",
      "In Google Cloud → Credentials → Web OAuth client, set redirect URI to",
      "https://rlrnzopqpacnwrmvanif.supabase.co/auth/v1/callback",
      "Then paste the matching Client ID and Client Secret into Supabase → Auth → Google.",
    ].join(" ");
  }

  if (
    lower.includes("state parameter missing") ||
    lower.includes("code verifier") ||
    lower.includes("bad_oauth_callback")
  ) {
    return "Sign-in session expired. Click the provider button once and complete the flow in the same browser tab.";
  }

  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextFromQuery = searchParams.get("next");
  const nextFromCookie = readOAuthNextFromRequest(request);
  const safeNext =
    nextFromQuery?.startsWith("/") ? nextFromQuery : nextFromCookie;
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    return loginErrorRedirect(origin, oauthErrorMessage(oauthError));
  }

  if (!code) {
    return loginErrorRedirect(origin);
  }

  const supabase = await createRouteHandlerClientWithCookies();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginErrorRedirect(origin, oauthErrorMessage(error.message));
  }

  let destination = safeNext ?? ROUTES.onboarding;

  if (!safeNext) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle();

      destination = profile?.onboarding_complete
        ? ROUTES.journey
        : ROUTES.onboarding;
    }
  }

  const response = NextResponse.redirect(new URL(destination, origin));
  clearOAuthNextOnResponse(response);
  return response;
}
