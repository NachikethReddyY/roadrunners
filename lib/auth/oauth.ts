export type OAuthProviders = {
  google: boolean;
};

export function getOAuthProviders(): OAuthProviders {
  return {
    google: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true",
  };
}

export function isOAuthProviderEnabled(
  provider: keyof OAuthProviders,
  providers: OAuthProviders = getOAuthProviders()
) {
  return providers[provider];
}

export function hasAnyOAuthProvider(
  providers: OAuthProviders = getOAuthProviders()
) {
  return providers.google;
}
