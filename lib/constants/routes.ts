export const ROUTES = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
  journey: "/journey",
  journeyDetail: (id: string) => `/journey/${id}`,
  journeyMap: (id: string) => `/journey/${id}/map`,
  health: "/api/health",
  aiNextNode: "/api/ai/next-node",
} as const;

export const PUBLIC_ROUTES = [ROUTES.home, ROUTES.login, ROUTES.health] as const;

export const AUTH_ROUTES = [
  ROUTES.onboarding,
  ROUTES.journey,
] as const;
