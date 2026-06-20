import { type NextRequest, NextResponse } from "next/server";
import { setOAuthNextOnResponse } from "@/lib/auth/oauth-next";
import { isOAuthProviderEnabled } from "@/lib/auth/oauth";
import { ROUTES } from "@/lib/constants/routes";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

function authCallbackUrl() {
  return new URL("/auth/callback", process.env.NEXT_PUBLIC_APP_URL!).toString();
}

function loginErrorRedirect(origin: string, message: string) {
  const url = new URL(ROUTES.login, origin);
  url.searchParams.set("error", "auth");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await context.params;
  const origin = new URL(request.url).origin;

  if (providerParam !== "google") {
    return loginErrorRedirect(origin, "Unknown sign-in provider.");
  }

  if (!isOAuthProviderEnabled("google")) {
    return loginErrorRedirect(
      origin,
      "Google sign-in is not enabled. Use email below, or enable Google in Supabase Auth → Providers."
    );
  }

  const nextParam = request.nextUrl.searchParams.get("next");
  const safeNext = nextParam?.startsWith("/") ? nextParam : undefined;

  const oauthResponse = NextResponse.redirect(new URL(ROUTES.login, origin));
  oauthResponse.headers.set("Cache-Control", "no-store");

  const supabase = createRouteHandlerClient(request, oauthResponse);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authCallbackUrl(),
      queryParams: { prompt: "select_account", access_type: "online" },
    },
  });

  if (error) {
    const message = error.message.includes("provider is not enabled")
      ? "Google sign-in is not set up in Supabase yet. Use email instead."
      : error.message;
    return loginErrorRedirect(origin, message);
  }

  if (!data.url) {
    return loginErrorRedirect(origin, "Could not start OAuth sign-in.");
  }

  oauthResponse.headers.set("Location", data.url);
  setOAuthNextOnResponse(oauthResponse, safeNext);
  return oauthResponse;
}
