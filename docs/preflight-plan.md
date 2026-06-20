# Roadrunner — Preflight Plan

## Goal

Build an AI-guided, gamified learning journey platform that fixes the **broken bridge from learning to earning** (Challenge B1). Unlike static roadmaps (roadmap.sh), Roadrunner offers interactive branching at every step — users choose paths based on interest ("feels"), can pivot between domains (React → Swift), and use AI to scale breadth-first learning for a compressed junior-dev market.

## Origin (Team Chat)

> "Something interactive like roadmap.sh with AI — every step the system gives you options to choose from, gamifying the learning journey. You can go completely off track from one field to another, like doing React and suddenly ending up in Swift based on their feels."

> "The ladder is basically disappearing for junior devs — we have to know everything from the get go. The best is to know literally everything as much as possible and use AI to scale them."

## MVP Scope (48hr hackathon)

| In scope | Out of scope |
|----------|--------------|
| Landing (B1 pitch) | Payments |
| Auth + 2-step onboarding | Leaderboards |
| AI nodes with 2–3 choices | Employer matching |
| Pivot track action | Certificates / CMS |
| XP / level / streak | Offline mode |
| Journey map visualization | |

## Core User Flow

```
Landing → Sign in (Supabase) → Onboarding (goal + interests) →
Start Journey → [Node: learn snippet + reflection] → Choose next path →
Repeat → View progress map → Pivot optional
```

## Foundations

| Area | Decision | Notes |
|------|----------|-------|
| Database Schema | Supabase PostgreSQL | Normalized relational; RLS on all user tables |
| TypeScript Types | Zod-inferred in `lib/schemas/` | Single source of truth |
| Validation Strategy | Zod everywhere | API boundary + forms |
| Routing Structure | Next.js App Router | Public: /, /login; Private: /onboarding, /journey/* |
| Auth Flow | Supabase Auth | Magic link or Google OAuth; middleware + RLS |
| CSS Methodology | Tailwind CSS | Utility-first; design tokens via config |
| UI Framework | shadcn/ui + Radix | Cards, buttons, dialogs, progress |
| Client–Server Communication | Server Actions + API route for AI streaming | LLM via /api/ai/next-node |
| Folder Structure | Feature colocation under `app/` | `app/journey/`, `app/onboarding/`, `lib/ai/` |

## AI Architecture

- **Provider:** OpenAI or Gemini (env-configurable)
- **Endpoint:** `POST /api/ai/next-node`
- **Input:** journey context (last 5 nodes, goal, interests, optional pivot_skill)
- **Output:** streamed JSON `{ node, choices[] }` validated by Zod
- **Guardrails:** structured output only, max 3 choices, skill must exist in catalog or flagged exploratory
- **Fallback:** predefined skill_catalog template node on failure

## Key Components

- `JourneyNodeCard` — content + reflection prompt
- `ChoicePanel` — 2–3 branching buttons + pivot link
- `ProgressBar` — XP/level
- `JourneyMap` — vertical tree (SVG/list, not react-flow)
- `OnboardingWizard` — 2-step form

## Tradeoffs

- Breadth vs depth: MVP optimizes branching demo, not curriculum quality
- AI cost: cap context to last 5 nodes
- Pre-seeded catalog: 15–20 skills to anchor AI suggestions
