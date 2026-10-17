---
name: reference-life-os-sources
description: Where life-os (main requester) keeps gap registers, owner decisions (B-numbers), ADRs, CSP constants and the tests that pin kit APIs
metadata:
  type: reference
---

life-os (`/Users/eric/Documents/Projekte/life-cockpit/life-os`) is the main requester. Where its context lives:

- Gap register: `docs/ux/concepts/app-shell.md` §7 (component mapping) and §7.1 (F1 gap register, all concepts, one ID per gap, "Blocks F1" column). Other concepts: `today.md`, `sign-in.md`, `household-setup.md`, `account-settings.md`, `website-v0.md`.
- Owner decisions "B1…Bn": `specs/001-sign-in-household/plan.md`, table "Owner decisions (build, 2026-10-16)". Requests cite them as "owner approved (B12, B26, B27)". Read them: they sometimes widen the scope (B12 coupled the optional AS-13 to the release).
- Task that consumes a kit release: `specs/001-sign-in-household/tasks.md` (e.g. T319).
- ADRs: `docs/adr/` — 0012 mobile first (bundle budget 150 kB gzip / 500 kB raw initial), 0034 CSP with Trusted Types (policy allow-list; `angular#unsafe-bypass` banned).
- CSP constants: `infra/lib/edge/viewer-response.js`, `tools/local/src/server/security-headers.mts`, `apps/cockpit-e2e/src/support/security-headers.mts`. The e2e violation listener (`apps/cockpit-e2e/src/support/security-listeners.ts`) also fails on console text matching CSP/Trusted Types, so the kit must log nothing like that on success.
- life-os writes failing tests against kit API names before the release (e.g. `libs/ui/shell/src/shell.component.spec.ts` reads `AppPageComponent.busy`), so treat names in a request as fixed. Grep `libs/ui`, `apps/cockpit*` for `lc-` usage and icon names.
- Builder notes with measured bundle numbers: `docs/dev/agent-notes/frontend-builder.md`.

Related: [[project-kit-consumers]]
