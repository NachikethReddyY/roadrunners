# Hotspots — Most Connected Files

Ranked by total inbound + outbound `@/` import edges. Change these carefully.

| Rank | File | Inbound | Outbound | Total |
|------|------|---------|----------|-------|
| 1 | `lib/utils.ts` | 15 | 0 | 15 |
| 2 | `lib/constants/routes.ts` | 12 | 0 | 12 |
| 3 | `components/ui/button.tsx` | 10 | 1 | 11 |
| 4 | `components/journey/journey-node-card.tsx` | 3 | 6 | 9 |
| 5 | `components/layout/top-nav.tsx` | 3 | 6 | 9 |
| 6 | `lib/supabase/server.ts` | 9 | 0 | 9 |
| 7 | `components/onboarding/onboarding-wizard.tsx` | 1 | 7 | 8 |
| 8 | `app/journey/[id]/page.tsx` | 0 | 6 | 6 |
| 9 | `components/auth/login-form.tsx` | 1 | 5 | 6 |
| 10 | `components/layout/app-shell.tsx` | 4 | 2 | 6 |
| 11 | `app/journey/[id]/map/page.tsx` | 0 | 5 | 5 |
| 12 | `app/journey/page.tsx` | 0 | 5 | 5 |
| 13 | `components/layout/sticky-progress-bar.tsx` | 1 | 4 | 5 |
| 14 | `lib/actions/journey.ts` | 1 | 4 | 5 |
| 15 | `lib/actions/onboarding.ts` | 0 | 4 | 4 |

**Interpretation:** `lib/utils.ts` and `lib/constants/routes.ts` are hub nodes — almost every feature touches them. `lib/supabase/server.ts` is the single database/auth gateway on the server.
