# Handoff: Implement Roadrunner Hackathon MVP

## Context

Preflight completed for **Roadrunner** — an AI-guided, gamified learning journey platform for hackathon challenge **B1 (broken bridge from learning to earning)**. Inspired by roadmap.sh but interactive: at each step the user picks from AI-generated choices, can pivot tracks (e.g. React → Swift), and earns XP/levels. Greenfield repo at `/Users/nr/Developer/roadrunner` (empty).

**Preflight decision: ⚠️ Human Review Required** — saved to `~/.temp/preflight-*.json` (latest run). All 4 agents recommend **revise** before coding. User confirmed foundation stack via preflight Q&A.

## Goals

Build a **48-hour hackathon MVP** that demos:

1. B1 narrative on landing page
2. Supabase auth → 2-step onboarding (goal + interests)
3. AI-generated journey nodes with 2–3 branching choices per step
4. Explicit "pivot track" to switch domains
5. XP / level / streak gamification
6. Visual journey map (completed + upcoming nodes)

**Win criteria:** Clear demo of guided exploration + career navigation, not curriculum depth.

## Constraints & Decisions

### Locked Foundations (user-confirmed)

| Area | Decision |
|------|----------|
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (magic link / Google OAuth) |
| Framework | Next.js App Router |
| Communication | Server Actions + `/api/ai/next-node` for LLM streaming |
| CSS | Tailwind CSS |
| UI | shadcn/ui + Radix |
| Types/Validation | Zod schemas in `lib/schemas/`, inferred types |
| Folders | Feature colocation: `app/journey/`, `app/onboarding/`, `lib/ai/` |

### Required Revisions (from preflight reviews)

**Security (must-fix before demo):**
- Sanitize AI markdown with `rehype-sanitize` or render as plain text in MVP
- Rate-limit `/api/ai/next-node` (per-user)
- LLM API key server-only; never `NEXT_PUBLIC_`
- Document nested RLS: `journey_nodes` / `journey_choices` policies join through `journeys.user_id`

**Engineering:**
- **Persistence contract:** `stream → Zod validate (complete response) → INSERT node + choices → UPDATE current_node_id → award XP` in one transactional flow
- **Pivot:** soft-archive orphaned subtree (`archived_at` on nodes) — do not hard-delete
- **Idempotency:** unique constraint on `decisions(journey_id, node_id)`; disable choice buttons after submit
- **Streak:** add `profiles.last_activity_at`; streak increments on node completion (UTC day boundary)
- **Completion:** node completes when user clicks a choice (choice nodes) or acknowledges lesson (simple "Continue" button)
- **JourneyMap:** prefer simple vertical SVG/list over react-flow for hackathon speed

**Design:**
- Define states: empty (no journey), loading (streaming skeleton), error (AI fail → show fallback badge "Suggested path"), success, auth expired
- Node view hierarchy: lesson content → primary choices → pivot as text link below
- Mobile-first; 44px touch targets on choices

**QA (minimum viable testing):**
- Manual matrix: user A cannot fetch user B's journey via Supabase client
- Smoke: auth → onboarding → first AI node renders
- AI fallback: force Zod parse failure → template node served
- Optional: 3-case LLM eval fixture for JSON shape

### Data Model

```
profiles (user_id, display_name, xp, level, streak_days, last_activity_at)
journeys (id, user_id, title, goal, status, current_node_id)
journey_nodes (id, journey_id, parent_id, skill_tag, title, content_md, node_type, xp_value, archived_at)
journey_choices (id, node_id, label, description, target_skill_tag)
decisions (id, journey_id, node_id, choice_id, decided_at) — UNIQUE(journey_id, node_id)
skill_catalog (slug, name, category, icon) — system seed, ~15-20 skills
```

### Routes

| Route | Auth |
|-------|------|
| `/` | public |
| `/login` | public |
| `/onboarding` | private |
| `/journey` | private |
| `/journey/[id]` | private |
| `/journey/[id]/map` | private |
| `/api/ai/next-node` | private |
| `/api/health` | public |

### AI

- Env: `OPENAI_API_KEY` or `GEMINI_API_KEY` (pick one for hackathon)
- Input: last 5 nodes, goal, interests, optional `pivot_skill`
- Output Zod schema: `{ title, content_md, skill_tag, choices: [{ label, description, target_skill_tag }] }` (1–3 choices)
- Fallback: predefined nodes from `skill_catalog` templates
- Use structured output / JSON mode — validate only after stream completes

### Out of Scope

Payments, leaderboards, employer matching, certificates, CMS, offline mode.

## Files & References

- Empty workspace: `/Users/nr/Developer/roadrunner`
- Preflight output: `docs/preflight-orchestrator.json`
- Challenge B1: [LinkedIn article](https://www.linkedin.com/pulse/fixing-gap-between-learning-earning-anthony-karanja-kabiru-j0bff)
- Similar hackathon stacks: [DEV — Supabase + OpenAI + Next.js hackathon winner](https://dev.to/asheeshh/creating-a-hackathon-winning-ai-based-app-in-a-weekend-using-supabase-openai-nextjs-2pe7)

## Suggested Skills

- `design-ui` — landing + journey node UI with gamification polish
- `preflight` — re-run if scope expands beyond MVP
- Supabase/Next.js docs for RLS + App Router middleware

## Next Steps

1. `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false`
2. `npx shadcn@latest init` + add button, card, progress, skeleton, dialog
3. `npm install @supabase/supabase-js @supabase/ssr zod openai` (+ `rehype-sanitize` if rendering markdown)
4. Create Supabase project; run SQL migration for tables + RLS policies (nested join policies)
5. Seed `skill_catalog` with 15–20 skills (web, mobile, data, AI categories)
6. Implement middleware auth + `/login` + `/onboarding`
7. Build `/api/ai/next-node` with Zod validation, rate limit, fallback
8. Build `/journey/[id]` node view + choice submission Server Action
9. Add XP/level update on node completion
10. Build `/journey/[id]/map` simple tree view
11. Polish landing page with B1 narrative
12. Deploy to Vercel; set env vars
13. Run manual QA matrix before demo

## Demo Script (for judges)

1. Show landing — "junior ladder is gone; breadth + AI scales learning to earning"
2. Sign in → pick goal "become hireable full-stack" + interests [web, mobile]
3. Start journey → AI presents first node with 3 choices
4. Pick "Learn React basics" → next node streams in
5. Hit "Pivot to Swift" → new branch, map shows fork
6. Show XP gained, level up, journey map visualization
