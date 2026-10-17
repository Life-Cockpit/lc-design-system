---
name: feedback-build-pitfalls
description: Traps hit while building kit changes (Trusted Types fakes in Jest, hydration and CSP in the compat fixture, lc-skeleton widths, literal BOM from \u escapes, Storybook story-level providers)
metadata:
  type: feedback
---

Traps from request 001 (2026-10-17), each cost a debugging round:

- **Fake `window.trustedTypes` in Jest:** Angular's JIT compiler creates its own `angular#unsafe-jit` policy through it and calls `createScript`. A fake factory must return pass-through rules for `angular*` names and count only the kit's policies.
- **`lc-icon` (or any kit component rendering a `<div>`) inside a `<p>`** breaks hydration of prerendered HTML (NG0502): the HTML parser closes the `<p>`. Use `<div>`/`<span>` wrappers in fixtures.
- **Strict CSP fixtures:** Angular 22's default incremental hydration writes an inline event-dispatch script, and critical-CSS inlining an inline `<script>`; `script-src 'self'` blocks both. Mirror life-os: `withNoIncrementalHydration()` (not in Angular 21.0, so look it up on the namespace) and `optimization.styles.inlineCritical: false`.
- **`ConfirmService`** mounts the dialog on a plain `<div>` host, so there is no `lc-confirm-dialog` element to query.
- **`lc-skeleton` with a percentage width** applies it to host and box, so it compounds (45 % → 20 %). Put the percentage on a wrapper.
- **Unicode escapes in written files:** writing `﻿` through the file tools produced a literal BOM, and eslint failed with `no-irregular-whitespace`. Grep for the escape after writing such code.
- **Storybook:** a story-level `applicationConfig` appends its providers after the global ones, so a story's `provideRouter(…, withHashLocation())` wins over preview's `provideRouter([])`.

**Why:** these are not visible in the code and each looked like a kit regression at first.
**How to apply:** check this list before debugging a failing fixture, browser check or story; add new traps here.

Related: [[reference-gates-and-measuring]]
