# RoadRunners Product Roadmap

Living spec for the MVP: bubble-canvas roadmap creation, AI-guided steps, progress dashboard, and interactive journey loop.

## Vision

Users land on a **blank canvas** when they have no roadmaps. They express a goal ("I want to **become** a full-stack developer"), pick inspiration from **floating skill bubbles**, and AI builds their first step. A **dashboard** shows all roadmaps with progress. Inside a roadmap, choices branch the path, pivots fork tracks, and XP/streak gamification rewards progress.

**User-facing term:** roadmap · **Database:** `journeys` / `journey_nodes` (unchanged)

## User flows

```
Sign in
  ├─ No roadmaps → Bubble creator (/roadmap/new)
  └─ Has roadmaps → Dashboard (/journey)
        ├─ Create roadmap → Bubble creator
        └─ Open roadmap → Current step (/journey/[id])
              ├─ Pick choice → AI next node
              ├─ Continue (lesson) → AI next node
              ├─ Pivot track → archive branch + new node
              └─ View map (/journey/[id]/map)
```

## Phase 0 — Roadmap creation + dashboard

### Bubble creator (`/roadmap/new`)

Full viewport, minimal chrome. Center goal composer:

```
I want to  [ learn | become ]  [ outline-only text field ]  [ Next ]
```

| Mode | Rotating placeholders |
|------|------------------------|
| **learn** | React, SQL, Swift, prompt engineering, Docker |
| **become** | a full-stack developer, a data analyst, hireable in tech, an iOS developer |

- Input: outline only (`border`, transparent background)
- **Next** disabled until text ≥ 3 characters
- Composed goal: `"I want to ${mode} ${text}"`

**Floating bubbles** from `skill_catalog` (~20 skills):

- Random positions in viewport margins; slow float animation
- Category tint from design tokens (`skill-web`, `skill-mobile`, etc.)
- **Click:** pop animation → label flies to input → mode switches to **learn**

### AI generation (on submit)

Scope: **title + first interactive node** (map grows as user progresses).

1. Upsert profile (`goal`, inferred `interests`, `onboarding_complete: true`)
2. Generate roadmap title (AI or heuristic fallback)
3. Insert `journeys` row
4. Call `createAndPersistNextNode` for first node
5. Full-screen loading → redirect to dashboard

### Dashboard (`/journey`)

- List all active roadmaps (no auto-redirect to single journey)
- Each card: title, goal, **progress bar** (`decisions / active nodes`)
- Empty state → redirect to `/roadmap/new`
- CTA: "Create roadmap"

## Phase 1 — Interactive loop

After opening a roadmap:

1. `submitChoice` → decision + XP → `createAndPersistNextNode(target_skill_tag)`
2. `acknowledgeNode` (Continue) → decision + XP → next node
3. Loading skeleton while generating; disable choices after submit
4. Retry if first node generation failed

## Phase 2 — Pivot

- Skill picker in choice panel
- `pivotTrackAction`: soft-archive old nodes + `createAndPersistNextNode(pivotSkill)`

## Phase 3 — Polish

- Map states from `decisions` table (not heuristic)
- Sanitized markdown in node cards (`react-markdown` + `rehype-sanitize`)
- XP feedback after choice
- Skill category from `skill_catalog`

## Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | public | Landing |
| `/login` | public | Sign in |
| `/roadmap/new` | private | Bubble creator |
| `/onboarding` | private | Redirect → `/roadmap/new` |
| `/journey` | private | Dashboard |
| `/journey/[id]` | private | Current step |
| `/journey/[id]/map` | private | Timeline map |
| `/api/ai/next-node` | private | AI node API |

## Demo script

1. Landing — B1 narrative
2. Sign in → blank bubble screen
3. Click **React** bubble → fills input → **Next**
4. Loading → dashboard shows roadmap at 0%
5. Open roadmap → first AI node + choices
6. Pick choice → next node; dashboard progress updates
7. Pivot to Swift → map shows fork
8. Dashboard shows progress across roadmaps

## Out of scope

Payments, leaderboards, employer matching, certificates, CMS, offline mode, upfront full milestone outline (5–8 steps generated at once).

## References

- [handoff-roadrunner-hackathon.md](./handoff-roadrunner-hackathon.md) — original MVP spec
- [design/DESIGN.md](./design/DESIGN.md) — tokens and components
- [preflight-plan.md](./preflight-plan.md) — locked stack decisions
