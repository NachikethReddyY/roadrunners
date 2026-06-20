import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/lib/constants/routes";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next =
    nextParam?.startsWith("/") ? nextParam : ROUTES.onboarding;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=auth`);
  }

  const redirectUrl = new URL(next, origin);
  redirectUrl.searchParams.delete("token_hash");
  redirectUrl.searchParams.delete("type");
  redirectUrl.searchParams.delete("next");

  const response = NextResponse.redirect(redirectUrl);
  const supabase = createRouteHandlerClient(request, response);
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=auth`);
  }

  return response;
}
