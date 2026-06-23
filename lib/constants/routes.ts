export const ROUTES = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
  roadmapNew: "/roadmap/new",
  journey: "/journey",
  journeyDetail: (id: string) => `/journey/${id}`,
  journeyMap: (id: string) => `/journey/${id}/map`,
  journeyScrim: (journeyId: string, scrimId: string) =>
    `/journey/${journeyId}/scrim/${scrimId}`,
  health: "/api/health",
  aiNextNode: "/api/ai/next-node",
  runnerExec: "/api/runner/exec",
} as const;

export const PUBLIC_ROUTES = [ROUTES.home, ROUTES.login, ROUTES.health] as const;

export const AUTH_ROUTES = [
  ROUTES.onboarding,
  ROUTES.roadmapNew,
  ROUTES.journey,
] as const;
