# AGENTS.md

This file is the authoritative guide for AI agents (Claude, Cursor, Copilot, etc.) working in the `obnofi` repository. Read this file first. Follow all rules below without exception.

---

## What is obnofi?

`obnofi` is a productivity workspace that combines Notion-style page editing, Obsidian-style graph view, and FigJam-style canvas — plus additional productivity features — in a single product.

This is **not a simple app**. The repository contains three separate runtimes:

- **Root** — Next.js 15 App Router (frontend)
- **`server/`** — Fastify + Prisma + WebSocket (backend)
- **`ai/`** — Python orchestration layer

Do not treat this as a monorepo with shared configs. Each runtime has its own `package.json`, `tsconfig.json`, and environment variables.

---

## Before You Write Any Code

Read these files **in this order** before starting any task:

1. **`DB.md`** — Database notes and schema overview. Required before any feature that touches data.
2. **`server/prisma/schema.prisma`** — Source of truth for the actual schema. Cross-reference with `DB.md`.
3. **`DESIGN.md`** — Design system, Jungle System naming conventions, and visual rules.
4. **`docs/architecture.md`** — Data model and architecture notes.
5. **`docs/implementation-plan.md`** — Current implementation status and planned work.

For design or UI tasks, also check:

- **`figma_design_context.txt`** — Design reference context exported from Figma.
- **`figma_screenshot.png`** — Visual reference.

---

## Next.js Version Warning

<!-- BEGIN:nextjs-agent-rules -->
This version has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Jungle System Naming Convention

All features, components, and code variables follow the **Jungle System** metaphor. This is not optional — use these names consistently across UI labels, function names, variable names, and comments.

| Jungle term | Meaning |
|---|---|
| `plantSeed` | Create a new note/page |
| `fossilize` | Snapshot / version history |
| `Grove` | Editor area |
| `Clearing` | Canvas area |

When adding new features, extend this metaphor. Do not use generic names (`create`, `save`, `editor`) where a Jungle System equivalent exists or can be defined. If unsure, propose a name and document it in `DESIGN.md`.

---

## Design System Rules

1. **Always use existing design tokens and components first.** Before writing new styles or components, check `DESIGN.md` and the existing `components/` directory.
2. **If a token or component doesn't exist, create it** — do not hardcode values inline.
3. **Never hardcode colors, spacing, or font sizes** outside of design token definitions.
4. **Component location**: feature-specific components go in their feature folder under `components/`. Shared primitives go at the top level of `components/`.

---

## Feature Addition Checklist

Before implementing any new feature:

- [ ] Read `DB.md` and `server/prisma/schema.prisma`
- [ ] Confirm whether a schema migration is needed
- [ ] Check `DESIGN.md` for relevant tokens and components
- [ ] Apply Jungle System naming to all new identifiers
- [ ] Identify which runtime the feature touches (frontend / backend / AI layer)

---

## Navigation Guide

| Task type | Start here |
|---|---|
| Page editing, workspace UX | `app/workspace/`, `components/editor/`, `components/sidebar/`, `store/` |
| Database or views | `components/database/`, `lib/database/`, `app/api/databases/`, `server/prisma/schema.prisma` |
| Collaboration / realtime | `server/src/ws/`, `lib/collaboration/` |
| Crawlers / scheduled jobs | `server/src/jobs/`, `server/src/jobs/crawlers/` |
| AI prompting / orchestration | `ai/`, `app/api/ai/generate/route.ts` |
| Public sharing | `app/share/`, `components/share/` |
| Graph view | `components/graph/`, `lib/graph/` |
| Canvas | `components/canvas/` |

---

## Do Not Touch

- `node_modules/`, `server/node_modules/`, `.next/`, `.venv/` — generated, do not edit
- `test-results/` — generated Playwright output
- `pnpm-lock.yaml` / `package-lock.json` — do not modify manually; the repo has both npm and pnpm lockfiles at root, treat with care
- `.git/`, `.idea/`, `.claude/` — local tooling, do not modify

---

## Environment Variables

- Frontend: see `.env.local.example` at root
- Backend: see `server/.env.example`

Never commit actual secrets. Never hardcode env values in source files.

---

## Testing

- E2E tests live in `tests/` and use Playwright (`playwright.config.ts`)
- Run tests before submitting any change that touches routing, auth, or collaboration

---

## README Warning

`README.md` is mostly boilerplate and is **not a reliable source of truth**. Use this file (`AGENTS.md`), `docs/architecture.md`, and `docs/implementation-plan.md` instead.