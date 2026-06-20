# Dead Areas — Zero Inbound Imports

These files are not imported by any other source file in the `@/` graph. They are candidates to **ignore during most tasks**, not necessarily to delete.

| File | Why it exists |
|------|---------------|
| `components/ui/dialog.tsx` | shadcn primitive — installed for future modals |
| `components/ui/skeleton.tsx` | shadcn primitive — loading states not wired everywhere |
| `lib/ai/generate-node.ts` | Stub for OpenAI streaming — replace fallback when implementing LLM |
| `lib/schemas/index.ts` | Barrel re-export — consumers import schemas directly today |
| `lib/schemas/journey.ts` | Types/schemas for journey domain — used at API boundary later |
| `lib/schemas/profile.ts` | Profile schema — onboarding uses `onboarding.ts` instead |
| `lib/schemas/skill.ts` | Skill catalog schema — seed data not yet validated in code |
| `lib/supabase/client.ts` | Browser client — no client-side Supabase calls yet |
| `next.config.ts` | Next.js config — framework entry, not imported |
| `types/database.ts` | Supabase row types — not imported yet |

**Also low-connectivity (framework entry points, not dead):**

- All `app/**/page.tsx` and `app/**/route.ts` files — reached by URL, not imports
- `middleware.ts` — invoked by Next.js runtime
- `app/api/health/route.ts` — standalone health endpoint
