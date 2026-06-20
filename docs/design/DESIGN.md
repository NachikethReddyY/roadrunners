---
version: 1.0
name: RoadRunners-design-system
description: |
  A learning-journey design language that treats the product like a living roadmap — Ollama's documentation-first clarity and line-drawn SVG iconography on a calm reading canvas, Cursor's warm dark mode and pastel skill-stage palette for gamification, Apple's typographic confidence (17px body, tight display tracking, single Path Blue accent), and Vercel's semantic color scale for states. One brand voltage (Trail Amber) carries primary CTAs and XP moments; everything else recedes so lesson content and branching choices stay in focus. Mobile-first with 44px touch targets on every journey choice.

colors:
  primary: "#d97706"
  primary-active: "#b45309"
  primary-soft: "#fef3c7"
  on-primary: "#ffffff"
  link: "#0066cc"
  link-on-dark: "#2997ff"
  link-focus: "#0071e3"
  ink: "#1d1d1f"
  ink-warm: "#26251e"
  body: "#525252"
  body-on-dark: "#ececec"
  mute: "#a3a3a3"
  mute-on-dark: "#807d72"
  canvas: "#ffffff"
  canvas-parchment: "#f5f5f7"
  canvas-warm: "#f7f7f4"
  surface-card: "#ffffff"
  surface-soft: "#fafafa"
  surface-elevated: "#ffffff"
  hairline: "#e5e5e5"
  hairline-warm: "#e6e5e0"
  hairline-strong: "#d4d4d4"
  canvas-dark: "#141413"
  surface-dark: "#1c1b19"
  surface-dark-elevated: "#26251e"
  surface-dark-soft: "#2a2926"
  on-dark: "#ececec"
  on-dark-mute: "rgba(236,236,236,0.72)"
  focus-ring: "rgba(0,102,204,0.45)"
  semantic-success: "#1f8a65"
  semantic-success-soft: "#d1fae5"
  semantic-error: "#cf2d56"
  semantic-error-soft: "#fce7f3"
  semantic-warning: "#d97706"
  semantic-warning-soft: "#fef3c7"
  semantic-info: "#0066cc"
  semantic-info-soft: "#dbeafe"
  xp-bar-fill: "#d97706"
  xp-bar-track: "#f5f5f7"
  xp-bar-track-dark: "#2a2926"
  streak-flame: "#ea580c"
  skill-web: "#9fbbe0"
  skill-mobile: "#9fc9a2"
  skill-data: "#c0a8dd"
  skill-ai: "#dfa88f"
  skill-devops: "#c08532"
  skill-explore: "#d4d4d4"
  node-complete: "#1f8a65"
  node-current: "#d97706"
  node-upcoming: "#e5e5e5"
  node-archived: "#a3a3a3"
  gradient-hero-start: "#007cf0"
  gradient-hero-mid: "#7928ca"
  gradient-hero-end: "#d97706"

typography:
  display-xl:
    fontFamily: "Nunito, SF Pro Rounded, system-ui, -apple-system, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.4px
  display-lg:
    fontFamily: "Nunito, SF Pro Rounded, system-ui, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.32px
  display-md:
    fontFamily: "Nunito, SF Pro Rounded, system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.24px
  heading-lg:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  heading-md:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.44
    letterSpacing: 0
  heading-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: -0.17px
  body-strong:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.47
    letterSpacing: -0.17px
  body-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  body-sm-strong:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.88px
    textTransform: uppercase
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  code-sm:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button-md:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  button-lg:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  stat-lg:
    fontFamily: "Nunito, SF Pro Rounded, system-ui, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.28px
  nav-link:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 80px
  touch-min: 44px

components:
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 56px
  top-nav-dark:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    height: 56px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 10px 20px
    height: 44px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 10px 20px
    height: 44px
  button-secondary-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 10px 20px
    height: 44px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.link}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 10px 16px
    height: 44px
  button-ghost-dark:
    backgroundColor: transparent
    textColor: "{colors.link-on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 10px 16px
    height: 44px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: 12px 16px
    height: 44px
  text-input-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: 12px 16px
    height: 44px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: "{spacing.section}"
  hero-band-parchment:
    backgroundColor: "{colors.canvas-parchment}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: "{spacing.section}"
  journey-node-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  journey-node-card-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  journey-node-card-loading:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.mute}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  choice-button:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
    minHeight: 44px
  choice-button-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  choice-button-disabled:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.mute}"
    rounded: "{rounded.lg}"
  choice-button-dark:
    backgroundColor: "{colors.surface-dark-soft}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
    minHeight: 44px
  pivot-link:
    backgroundColor: transparent
    textColor: "{colors.link}"
    typography: "{typography.body-sm}"
  pivot-link-dark:
    backgroundColor: transparent
    textColor: "{colors.link-on-dark}"
    typography: "{typography.body-sm}"
  skill-pill-web:
    backgroundColor: "{colors.skill-web}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  skill-pill-mobile:
    backgroundColor: "{colors.skill-mobile}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  skill-pill-data:
    backgroundColor: "{colors.skill-data}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  skill-pill-ai:
    backgroundColor: "{colors.skill-ai}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  skill-pill-devops:
    backgroundColor: "{colors.skill-devops}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  skill-pill-explore:
    backgroundColor: "{colors.skill-explore}"
    textColor: "{colors.ink-warm}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  xp-progress-bar:
    trackColor: "{colors.xp-bar-track}"
    fillColor: "{colors.xp-bar-fill}"
    rounded: "{rounded.pill}"
    height: 8px
  xp-progress-bar-dark:
    trackColor: "{colors.xp-bar-track-dark}"
    fillColor: "{colors.xp-bar-fill}"
    rounded: "{rounded.pill}"
    height: 8px
  level-badge:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-active}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  streak-badge:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.streak-flame}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  stat-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.stat-lg}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
  stat-card-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.stat-lg}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
  map-node-complete:
    fillColor: "{colors.node-complete}"
    strokeColor: "{colors.node-complete}"
    size: 12px
  map-node-current:
    fillColor: "{colors.node-current}"
    strokeColor: "{colors.node-current}"
    size: 16px
  map-node-upcoming:
    fillColor: "{colors.canvas}"
    strokeColor: "{colors.node-upcoming}"
    size: 12px
  map-node-archived:
    fillColor: "{colors.canvas}"
    strokeColor: "{colors.node-archived}"
    size: 10px
  map-edge:
    strokeColor: "{colors.hairline}"
    strokeWidth: 2px
  map-edge-active:
    strokeColor: "{colors.primary}"
    strokeWidth: 2px
  empty-state-card:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 48px 32px
  empty-state-card-dark:
    backgroundColor: "{colors.surface-dark-soft}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 48px 32px
  error-banner:
    backgroundColor: "{colors.semantic-error-soft}"
    textColor: "{colors.semantic-error}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
  fallback-badge:
    backgroundColor: "{colors.semantic-warning-soft}"
    textColor: "{colors.semantic-warning}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  onboarding-step-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 32px
  onboarding-step-card-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 32px
  interest-chip:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: 10px 16px
    minHeight: 44px
  interest-chip-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-active}"
    rounded: "{rounded.pill}"
  footer:
    backgroundColor: "{colors.canvas-parchment}"
    textColor: "{colors.body}"
    typography: "{typography.caption}"
    padding: 48px 24px
  footer-dark:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.caption}"
    padding: 48px 24px
  sticky-progress-bar:
    backgroundColor: "{colors.canvas-parchment}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    height: 56px
    padding: 8px 16px
  sticky-progress-bar-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm}"
    height: 56px
    padding: 8px 16px
---

## Overview

RoadRunners is an AI-guided learning journey — not a course catalog, not a static roadmap. The design system treats every screen like a **readable path**: lesson content first, branching choices second, gamification chrome third. The visual language borrows Ollama's restraint (paper canvas, pill CTAs, line-drawn SVG skill icons, documentation-column layout), Cursor's warmth (cream/parchment alternation in light mode, a full dark-mode counterpart, pastel skill-category pills scoped to tags and map nodes), Apple's typographic discipline (17px body, weight-600 display with negative tracking, single Path Blue for links, 44px touch targets), and Vercel's semantic palette (success/error/warning tokens for states, a hero-only mesh gradient on the landing page).

One brand voltage — **Trail Amber** (`{colors.primary}` — #d97706) — carries primary CTAs, XP fill, current-map-node emphasis, and streak warmth. Path Blue (`{colors.link}` — #0066cc) handles links, pivot affordances, and focus rings. Skill categories get Cursor-style pastel pills (`{colors.skill-web}` through `{colors.skill-devops}`) — chromatic but never loud. The roadrunner mascot and skill icons are **stroke-only SVG line art** (Ollama llama grammar): no fills, no gradients on icons, no photography in product chrome.

Dark mode is first-class, not an afterthought. Light mode reads like a focused README; dark mode reads like a quiet evening study session — warm near-black surfaces (`{colors.canvas-dark}` / `{colors.surface-dark-elevated}`), not cold IDE gray.

**Key Characteristics:**
- Documentation-first reading column (~720px for lesson content, wider for map)
- Pill CTAs (`{rounded.pill}`) for every primary action; `{rounded.lg}` (12px) for choice cards and journey nodes
- Line-drawn SVG icons for skills, mascot, empty states — the only illustration grammar
- Pastel skill pills scoped to category tags and map-node labels — never primary button fills
- Trail Amber reserved for conversion + XP; Path Blue for navigation + pivot links
- Full light/dark token pairs for every surface and interactive component
- 44px minimum touch targets on all journey choices (hackathon requirement)
- Hairline-only depth in product UI; hero gradient allowed once on landing only
- Five explicit UI states: empty, loading, error, success, auth-expired

## Design Lineage

| Source | What RoadRunners takes | What RoadRunners rejects |
|---|---|---|
| **Ollama** | Paper canvas, pill buttons, README-column layout, stroke SVG mascot/icons, mono for code snippets, hairline cards | Pure black-only palette, no semantic color, no dark mode |
| **Cursor** | Warm cream/parchment surfaces, pastel stage palette → skill categories, dark-mode warmth, 44px CTAs, semantic success/error | Cursor Orange as primary, IDE mockup chrome, timeline pills as action colors |
| **Apple** | 17px body, display weight 600 + negative tracking, single blue accent, alternating light/parchment sections, scale(0.95) press, backdrop-blur sticky bars | Product photography tiles, full-bleed marketing bands, store configurator patterns |
| **Vercel** | Semantic error/warning/success scale, hero mesh gradient (landing only), stacked subtle shadow on elevated cards | Ink-black primary, 100px marketing pills, dark-band polarity flips in app chrome |

## Colors

### Brand & Accent
- **Trail Amber** (`{colors.primary}` — #d97706): Primary CTA fill, XP bar, current journey node, streak accent. The single conversion color — use at most one amber pill per viewport fold.
- **Trail Amber Active** (`{colors.primary-active}` — #b45309): Pressed primary button, level badge text.
- **Trail Amber Soft** (`{colors.primary-soft}` — #fef3c7): Selected choice background, level badge fill, interest chip selected state.
- **Path Blue** (`{colors.link}` — #0066cc): Inline links, pivot-track text link, focus ring root. Apple's Action Blue — the "navigate elsewhere" signal.
- **Path Blue On Dark** (`{colors.link-on-dark}` — #2997ff): Links and pivot affordances on dark surfaces.
- **Focus Blue** (`{colors.link-focus}` — #0071e3): 2px keyboard focus outline on interactive elements.

### Surface — Light Mode
- **Canvas** (`{colors.canvas}` — #ffffff): Default page floor. Lesson reading surfaces.
- **Parchment** (`{colors.canvas-parchment}` — #f5f5f7): Alternating landing sections, sticky progress bar, footer. Apple off-white rhythm.
- **Warm Canvas** (`{colors.canvas-warm}` — #f7f7f4): Optional onboarding background — Cursor cream, used sparingly.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Journey node cards, choice buttons, stat cards.
- **Surface Soft** (`{colors.surface-soft}` — #fafafa): Skeleton loading, interest chips default, empty states.
- **Hairline** (`{colors.hairline}` — #e5e5e5): 1px card borders, map edges, dividers.
- **Hairline Warm** (`{colors.hairline-warm}` — #e6e5e0): Subtle warm divider on cream backgrounds.

### Surface — Dark Mode
- **Canvas Dark** (`{colors.canvas-dark}` — #141413): Page floor in dark mode. Warm void, not pure black.
- **Surface Dark** (`{colors.surface-dark}` — #1c1b19): Sticky bars, nav background.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #26251e): Journey node cards, choice buttons — Cursor warm ink.
- **Surface Dark Soft** (`{colors.surface-dark-soft}` — #2a2926): Empty states, disabled choice backgrounds.
- **On Dark** (`{colors.on-dark}` — #ececec): Primary text on dark surfaces.
- **On Dark Mute** (`{colors.on-dark-mute}` — rgba(236,236,236,0.72)): Secondary copy, captions in dark mode.

### Text
- **Ink** (`{colors.ink}` — #1d1d1f): Headlines and body on light surfaces. Apple near-black, not pure #000.
- **Ink Warm** (`{colors.ink-warm}` — #26251e): Text on pastel skill pills.
- **Body** (`{colors.body}` — #525252): Secondary prose, choice descriptions, footer links.
- **Mute** (`{colors.mute}` — #a3a3a3): Placeholders, archived nodes, disabled choice labels.

### Skill Category (pastel pills — Cursor timeline grammar)
Scoped to `{component.skill-pill-*}` tags and map node labels only. Never used for buttons.

| Category | Token | Hex | Use |
|---|---|---|---|
| Web | `{colors.skill-web}` | #9fbbe0 | React, HTML/CSS, frontend tags |
| Mobile | `{colors.skill-mobile}` | #9fc9a2 | Swift, React Native, mobile tags |
| Data | `{colors.skill-data}` | #c0a8dd | SQL, analytics, data engineering tags |
| AI | `{colors.skill-ai}` | #dfa88f | ML, LLM, prompt engineering tags |
| DevOps | `{colors.skill-devops}` | #c08532 | Deploy, CI/CD, infra tags |
| Explore | `{colors.skill-explore}` | #d4d4d4 | Exploratory / uncatalogued skills |

### Journey Map Node States
- **Complete** (`{colors.node-complete}` — #1f8a65): Filled circle, solid edge to parent.
- **Current** (`{colors.node-current}` — #d97706): Larger filled circle with amber ring.
- **Upcoming** (`{colors.node-upcoming}` — #e5e5e5): Hollow circle, dashed edge optional.
- **Archived** (`{colors.node-archived}` — #a3a3a3): Smaller hollow circle after pivot — orphaned subtree.

### Semantic (Vercel scale, product-scoped)
- **Success** (`{colors.semantic-success}` — #1f8a65): Node completion toast, level-up confirmation.
- **Success Soft** (`{colors.semantic-success-soft}` — #d1fae5): Success banner background.
- **Error** (`{colors.semantic-error}` — #cf2d56): Auth expired, AI hard failure (non-fallback).
- **Error Soft** (`{colors.semantic-error-soft}` — #fce7f3): Error banner background.
- **Warning** (`{colors.semantic-warning}` — #d97706): Fallback badge "Suggested path" when AI parse fails.
- **Info** (`{colors.semantic-info}` — #0066cc): Informational callouts, onboarding tips.

### Brand Gradient (landing hero only)
- **Hero Mesh** (`{colors.gradient-hero-start}` #007cf0 → `{colors.gradient-hero-mid}` #7928ca → `{colors.gradient-hero-end}` #d97706): Atmospheric backdrop behind the landing hero headline only. Vercel mesh grammar with Trail Amber terminus. Never used in authenticated app surfaces, never miniaturised to an icon.

## Typography

### Font Family
- **Display**: Nunito (open-source SF Pro Rounded substitute) for headlines, XP stat numbers, level display. Weights 600–700. Ollama's rounded warmth without Apple licensing.
- **Body / UI**: Inter (Apple SF Pro Text substitute) for all body, buttons, nav, captions. Weights 400 / 500 / 600.
- **Code**: JetBrains Mono for inline code in lesson content, terminal-style snippets, skill slug labels.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 40px | 600 | 1.1 | -0.4px | Landing hero, level-up modal headline |
| `{typography.display-lg}` | 32px | 600 | 1.15 | -0.32px | Journey title, map page headline |
| `{typography.display-md}` | 24px | 600 | 1.25 | -0.24px | Node card title |
| `{typography.heading-lg}` | 20px | 600 | 1.4 | 0 | Onboarding step title |
| `{typography.heading-md}` | 18px | 600 | 1.44 | 0 | Choice panel section label |
| `{typography.heading-sm}` | 16px | 600 | 1.5 | 0 | Stat card label ("Level", "Streak") |
| `{typography.body}` | 17px | 400 | 1.47 | -0.17px | Lesson content, default prose (Apple 17px rule) |
| `{typography.body-strong}` | 17px | 600 | 1.47 | -0.17px | Inline emphasis in lessons |
| `{typography.body-sm}` | 14px | 400 | 1.43 | 0 | Choice descriptions, pivot link context |
| `{typography.body-sm-strong}` | 14px | 500 | 1.43 | 0 | Choice button labels |
| `{typography.caption}` | 12px | 400 | 1.33 | 0 | Footer, timestamps, fine print |
| `{typography.caption-uppercase}` | 11px | 600 | 1.4 | 0.88px | Skill pills, fallback badge, level badge |
| `{typography.code}` | 14px | 400 | 1.43 | 0 | Inline code in lesson markdown |
| `{typography.code-sm}` | 13px | 400 | 1.5 | 0 | Compact code snippets |
| `{typography.button-md}` | 14px | 500 | 1 | 0 | Standard button labels |
| `{typography.button-lg}` | 16px | 500 | 1 | 0 | Landing hero CTA |
| `{typography.stat-lg}` | 28px | 700 | 1.1 | -0.28px | XP count, level number, streak days |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top nav links |

### Principles
- **17px body, not 16px.** Lesson content is meant to be read, not scanned. Apple reading pace.
- **Display at weight 600 with negative tracking.** Never 700 on headlines; `{typography.stat-lg}` is the one 700 exception for numerals.
- **Rounded display + neutral body.** Nunito carries personality; Inter carries legibility. Same Ollama pairing logic.
- **Mono for code only.** Skill slugs in the catalog admin view use `{typography.code-sm}`; lesson body stays Inter.

## Layout

### Spacing System
- **Base unit:** 8px (4px for tight inline gaps).
- **Tokens:** `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.section}` 80px · `{spacing.touch-min}` 44px.
- **Section rhythm:** `{spacing.section}` (80px) between landing page blocks; `{spacing.xxl}` (32px) between journey node sections.
- **Node card padding:** 24px all sides.
- **Choice stack gap:** `{spacing.md}` (12px) between choice buttons.

### Grid & Container
- **Lesson column:** max-width ~720px centered (Ollama README width).
- **Journey map:** max-width ~960px; vertical tree/list layout (hackathon: no react-flow).
- **Onboarding wizard:** max-width ~480px centered.
- **Landing hero:** max-width ~800px centered over full-bleed gradient backdrop.
- **Sticky progress bar:** full-width, content capped at 960px centered.

### Whitespace Philosophy
Content is the hero — not gamification chrome. The hierarchy inside a journey node view:

1. Skill pill + node title (`{spacing.sm}` gap)
2. Lesson markdown body (generous `{typography.body}` leading)
3. Reflection prompt or "Continue" acknowledgment (`{spacing.xl}` above)
4. Choice panel — 2–3 stacked `{component.choice-button}` rows (`{spacing.md}` gap)
5. Pivot link — `{component.pivot-link}` below choices, `{spacing.lg}` separation

XP bar and level badge live in `{component.sticky-progress-bar}` — always visible, never competing with lesson content for vertical space.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No border, no shadow | Page canvas, landing prose sections |
| 1 — Hairline | 1px `{colors.hairline}` | Journey node cards, choice buttons, stat cards |
| 2 — Soft stack | `0 1px 1px #00000005, 0 2px 2px #0000000a` + hairline | Onboarding card, modal dialogs (Vercel Level 2) |
| 3 — Sticky blur | `{colors.canvas-parchment}` 80% + `backdrop-filter: blur(20px)` | Sticky XP bar (Apple frosted grammar) |

No drop shadows on buttons. No gradients in app chrome. The landing hero mesh gradient is the only atmospheric decoration in the system.

### Dark Mode Elevation
Dark surfaces use **color step** instead of shadow: `{colors.canvas-dark}` → `{colors.surface-dark}` → `{colors.surface-dark-elevated}`. Hairlines become `{colors.surface-dark-soft}` at 1px.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed landing bands |
| `{rounded.sm}` | 6px | Inline code chips |
| `{rounded.md}` | 8px | Compact tags (rare) |
| `{rounded.lg}` | 12px | Journey node cards, choice buttons, stat cards, error banners |
| `{rounded.pill}` | 9999px | Primary/secondary CTAs, text inputs, XP bar, skill pills, interest chips |
| `{rounded.full}` | 9999px | Map node dots, avatar placeholders |

**Grammar:** Pills for actions and inputs (Ollama). `{rounded.lg}` for content containers. Never `{rounded.full}` on cards.

### Iconography (SVG line art — Ollama grammar)
All icons are **stroke-only**, 1.5px stroke, `{colors.ink}` on light / `{colors.on-dark}` on dark. No fills except map-node state dots.

| Icon | Description | Size |
|---|---|---|
| `icon-roadrunner` | Hand-drawn roadrunner mascot — brand mark, empty states | 48–80px hero, 24px nav |
| `icon-skill-*` | Line icons per skill category (globe, phone, chart, brain, server) | 16px inline with skill pill |
| `icon-map-fork` | Branch/fork glyph for pivot points on journey map | 12px |
| `icon-streak` | Flame outline for streak badge | 14px |
| `icon-level` | Star outline for level badge | 14px |
| `icon-empty-journey` | Dotted path with question mark — no journey yet | 64px empty state |
| `icon-loading` | Three pulsing dots (CSS animation, no SVG animation) | inline |

## Components

> **No hover states documented** per system policy. Each spec covers Default and Active/Pressed only.

### Navigation

**`top-nav`** — Light mode app chrome.
- Background `{colors.canvas}`, text `{colors.ink}`, height 56px, type `{typography.nav-link}`.
- Layout: `{icon-roadrunner}` (24px) + "RoadRunners" wordmark left; "Journey · Map" links center-right; avatar/sign-out right.
- 1px bottom border `{colors.hairline}`.

**`top-nav-dark`** — Dark mode equivalent on `{colors.canvas-dark}` with `{colors.on-dark}` text.

### Buttons

**`button-primary`** — Trail Amber pill. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}`, padding 10×20px, height 44px, rounded `{rounded.pill}`. Used for "Start journey", "Continue", "Sign in".
- Active: `{component.button-primary-active}` — background `{colors.primary-active}`, `transform: scale(0.97)`.

**`button-secondary`** — Ghost pill on light canvas. Background `{colors.canvas}`, text `{colors.ink}`, 1px `{colors.hairline-strong}` border, same dimensions as primary.

**`button-secondary-dark`** — Dark mode secondary on `{colors.surface-dark-elevated}`.

**`button-ghost`** / **`button-ghost-dark`** — Text-only actions. Text `{colors.link}` / `{colors.link-on-dark}`, no border.

### Journey Node View (core product surface)

**`journey-node-card`** — The lesson container.
- Background `{colors.surface-card}`, 1px `{colors.hairline}` border, rounded `{rounded.lg}`, padding 24px.
- Header row: `{component.skill-pill-*}` + node title in `{typography.display-md}`.
- Body: sanitized markdown in `{typography.body}`.
- Footer: `{component.button-primary}` "Continue" for acknowledgment nodes, or `{component.choice-button}` stack for branching nodes.

**`journey-node-card-dark`** — Dark mode variant on `{colors.surface-dark-elevated}`.

**`journey-node-card-loading`** — AI streaming skeleton.
- Background `{colors.surface-soft}`, pulsing placeholder lines (shadcn Skeleton), rounded `{rounded.lg}`, padding 24px.
- No fake content — three gray bars approximating title + paragraph.

**`choice-button`** — Branching path option. Minimum hackathon touch target.
- Background `{colors.surface-card}`, text `{colors.ink}`, 1px `{colors.hairline}` border, rounded `{rounded.lg}`, padding 16×20px, **min-height 44px**.
- Label: `{typography.body-sm-strong}`. Description below in `{typography.body-sm}` `{colors.body}`.
- Selected (pre-submit highlight): `{component.choice-button-selected}` — background `{colors.primary-soft}`, 2px `{colors.primary}` border.
- Disabled (after submit): `{component.choice-button-disabled}` — `{colors.mute}` text, no pointer events.

**`choice-button-dark`** — Dark mode on `{colors.surface-dark-soft}`.

**`pivot-link`** / **`pivot-link-dark`** — "Pivot to a different track →" below choice panel.
- Text link in `{colors.link}` / `{colors.link-on-dark}`, type `{typography.body-sm}`. Never a button — de-emphasized escape hatch.

### Gamification

**`xp-progress-bar`** / **`xp-progress-bar-dark`** — Sticky header progress.
- Track: `{colors.xp-bar-track}` / `{colors.xp-bar-track-dark}`, height 8px, rounded `{rounded.pill}`.
- Fill: `{colors.xp-bar-fill}` (Trail Amber), animated width transition 300ms ease-out on XP gain.

**`level-badge`** — "LEVEL 4" pill. Background `{colors.primary-soft}`, text `{colors.primary-active}`, type `{typography.caption-uppercase}`.

**`streak-badge`** — "🔥 7 DAY STREAK" pill. Background `{colors.primary-soft}`, text `{colors.streak-flame}`, `{icon-streak}` prefix.

**`stat-card`** / **`stat-card-dark`** — XP / level / nodes completed summary.
- Number in `{typography.stat-lg}`, label in `{typography.heading-sm}` `{colors.body}`.

**`sticky-progress-bar`** / **`sticky-progress-bar-dark`** — Pinned below nav during journey.
- Contains: level badge + XP bar + streak badge. Background parchment 80% blur (light) or `{colors.surface-dark}` (dark). Height 56px.

### Journey Map

**`map-node-complete`** — 12px filled circle `{colors.node-complete}`. Label: node title in `{typography.body-sm}`.

**`map-node-current`** — 16px filled circle `{colors.node-current}` with 2px amber outer ring.

**`map-node-upcoming`** — 12px hollow circle, stroke `{colors.node-upcoming}`.

**`map-node-archived`** — 10px hollow circle, stroke `{colors.node-archived}`, title struck-through or `{colors.mute}`.

**`map-edge`** / **`map-edge-active`** — Vertical/horizontal connector. Default `{colors.hairline}`; active path to current node `{colors.primary}`.

Layout: simple vertical SVG tree or indented list — parent → child with `{spacing.lg}` row gap. Forks render `{icon-map-fork}` at branch points.

### Skill Pills

**`skill-pill-web`** · **`skill-pill-mobile`** · **`skill-pill-data`** · **`skill-pill-ai`** · **`skill-pill-devops`** · **`skill-pill-explore`**
- Background: respective `{colors.skill-*}`, text `{colors.ink-warm}`, type `{typography.caption-uppercase}`, rounded `{rounded.pill}`, padding 4×10px.
- Optional `{icon-skill-*}` at 16px inline left.

### Onboarding

**`onboarding-step-card`** / **`onboarding-step-card-dark`** — Wizard step container. Padding 32px, rounded `{rounded.lg}`, hairline border.

**`interest-chip`** / **`interest-chip-selected`** — Multi-select interest toggles.
- Default: `{colors.surface-soft}` background, `{rounded.pill}`, min-height 44px.
- Selected: `{colors.primary-soft}` background, `{colors.primary-active}` text.

**`text-input`** / **`text-input-dark`** — Goal text field. Pill-shaped, height 44px.

### States

**`empty-state-card`** / **`empty-state-card-dark`** — No journey yet.
- Centered `{icon-empty-journey}` (64px) + headline `{typography.heading-lg}` + body `{typography.body}` + `{component.button-primary}`.

**`error-banner`** — AI hard failure or auth error. Background `{colors.semantic-error-soft}`, text `{colors.semantic-error}`, rounded `{rounded.lg}`.

**`fallback-badge`** — AI parse failure with template fallback. Background `{colors.semantic-warning-soft}`, text `{colors.semantic-warning}`, type `{typography.caption-uppercase}`. Sits top-right of `{component.journey-node-card}`: "Suggested path".

### Landing Page

**`hero-band`** — White canvas over `{colors.gradient-hero-*}` mesh backdrop.
- Headline: `{typography.display-xl}` — "The junior ladder is gone. Learn breadth-first."
- Subhead: `{typography.body}` `{colors.body}`.
- CTA row: `{component.button-primary}` "Start your journey" + `{component.button-secondary}` "See how it works".
- Optional: `{icon-roadrunner}` 80px centered above headline (Ollama llama placement).

**`hero-band-parchment`** — Alternating value-prop section on `{colors.canvas-parchment}`.

### Footer

**`footer`** / **`footer-dark`** — Background `{colors.canvas-parchment}` / `{colors.canvas-dark}`, text `{colors.body}`, type `{typography.caption}`.

## UI States (MVP requirement)

| State | Surface | Treatment |
|---|---|---|
| **Empty** | `/journey` with no active journey | `{component.empty-state-card}` + primary CTA to onboarding |
| **Loading** | AI streaming next node | `{component.journey-node-card-loading}` skeleton; choice buttons hidden |
| **Success** | Node completed, XP awarded | Brief `{colors.semantic-success}` toast; XP bar animates; choices unlock next node |
| **Error** | AI hard failure (no fallback) | `{component.error-banner}` + retry button |
| **Fallback** | Zod parse fail → template node | `{component.fallback-badge}` on node card; content still renders |
| **Auth expired** | Session timeout mid-journey | `{component.error-banner}` "Session expired" + redirect to `/login` |

## Dark Mode

Dark mode follows Cursor's warm-dark grammar, not Ollama's single inverted pricing card.

| Light Token | Dark Equivalent |
|---|---|
| `{colors.canvas}` | `{colors.canvas-dark}` |
| `{colors.surface-card}` | `{colors.surface-dark-elevated}` |
| `{colors.surface-soft}` | `{colors.surface-dark-soft}` |
| `{colors.ink}` | `{colors.on-dark}` |
| `{colors.body}` | `{colors.on-dark-mute}` |
| `{colors.hairline}` | `#3a3936` (implicit, not tokenized) |
| `{colors.link}` | `{colors.link-on-dark}` |

Toggle: system preference default + manual override in nav (sun/moon `{rounded.full}` icon button, 44×44px).

Implementation: `class="dark"` on `<html>`, CSS variables mapped in `tailwind.config.ts`.

## Do's and Don'ts

### Do
- Treat lesson content as the hero — gamification chrome stays in the sticky bar.
- Use `{component.button-primary}` (Trail Amber pill) for one primary action per view.
- Default to `{rounded.pill}` for CTAs/inputs, `{rounded.lg}` for content cards.
- Render all skill/mascot icons as stroke-only SVG line art — 1.5px stroke, no fills.
- Scope pastel `{colors.skill-*}` to pills and map labels only — never choice button backgrounds.
- Run body copy at `{typography.body}` (17px). Lesson markdown is meant to be read.
- Provide `{component.*-dark}` variants for every elevated surface.
- Enforce 44px min-height on `{component.choice-button}` and `{component.interest-chip}`.
- Show `{component.fallback-badge}` when AI returns template content — transparency builds trust.
- Use Path Blue (`{colors.link}`) for pivot links and inline navigation — amber is for commitment actions.

### Don't
- Don't add photography, avatars, or gradient fills to product chrome.
- Don't use the hero mesh gradient outside the landing page.
- Don't use skill pastels as primary CTA colors — they are taxonomy labels, not actions.
- Don't drop display weight to 400 on headlines — 600 is the floor (except editorial landing subheads).
- Don't use pure `#000000` or pure `#ffffff` text — warm ink/on-dark tokens only.
- Don't add drop shadows to buttons or choice cards — hairlines carry depth.
- Don't render hover states in specs — default + active/pressed only.
- Don't put pivot track as a button — it's always `{component.pivot-link}` text below choices.
- Don't use react-flow or heavy graph libraries for MVP map — vertical SVG/list only.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| mobile | < 640px | Single column; hero `{typography.display-xl}` → 28px; map list indent reduces |
| tablet | 640–1024px | Lesson column stays 720px max; sticky bar compact (hide streak text, show icon) |
| desktop | ≥ 1024px | Full sticky bar with labels; map can show wider tree |

### Touch Targets
All `{component.choice-button}`, `{component.button-primary}`, `{component.interest-chip}`, and nav icon buttons: **minimum 44×44px** (Apple/WCAG AAA). Choice buttons achieve this via `min-height: 44px` + vertical padding.

### Collapsing Strategy
- **Nav:** wordmark + hamburger below 640px; journey links in drawer.
- **Sticky progress bar:** streak label hides below 640px → `{icon-streak}` only.
- **Choice panel:** always full-width stack — never side-by-side choices on mobile.
- **Journey map:** vertical list on mobile; optional wider SVG tree on desktop.
- **Landing hero:** mesh gradient scales fluidly; headline stacks above CTA row.

## Tailwind Integration

Map tokens to CSS variables in `globals.css`:

```css
:root {
  --primary: 32 95% 44%;        /* #d97706 */
  --background: 0 0% 100%;
  --foreground: 240 3% 12%;     /* #1d1d1f */
  --muted: 0 0% 64%;            /* #a3a3a3 */
  --border: 0 0% 90%;           /* #e5e5e5 */
  --radius: 0.75rem;            /* 12px default card */
}
.dark {
  --background: 60 2% 8%;       /* #141413 */
  --foreground: 60 6% 93%;     /* #ececec */
  --border: 60 3% 22%;
}
```

shadcn/ui overrides: Button default variant → `{component.button-primary}`; Card → `{component.journey-node-card}`; Skeleton → loading state.

## Iteration Guide

1. Focus on ONE component at a time. Pull its YAML entry from front matter and verify every property resolves.
2. Reference tokens directly (`{colors.primary}`, `{component.choice-button}`) — never inline hex in component code.
3. Add `-dark` variants as separate component entries, not conditional prose.
4. New skill categories get a `{colors.skill-*}` + `{component.skill-pill-*}` pair — follow the pastel Cursor grammar.
5. Trail Amber should appear at most once per viewport fold as a filled pill.
6. Run `npx @google/design.md lint DESIGN.md` after edits if available.
7. When adding a new surface, ask: can it be expressed with pill + lg-card + line-icon vocabulary before adding tokens?

## Known Gaps

- **Level-up modal** animation timing not specified — use 300ms ease-out scale + fade.
- **Map layout algorithm** for deep trees (>20 nodes) — MVP uses simple vertical list; layout engine deferred.
- **Font loading strategy** — Nunito + Inter via `next/font`; JetBrains Mono subset for code glyphs only.
- **Reduced motion** — respect `prefers-reduced-motion`; disable XP bar animation and skeleton pulse.
- **i18n** — copy widths assume English; German headline overflow not tested.
