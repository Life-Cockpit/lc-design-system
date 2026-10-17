---
name: feedback-build-pitfalls
description: Traps hit while building kit changes (Trusted Types fakes in Jest, hydration and CSP in the compat fixture, lc-skeleton widths, literal BOM from \u escapes, Storybook story-level providers)
metadata:
  type: feedback
---

Traps from request 001 (2026-10-17), each cost a debugging round:

- **Fake `window.trustedTypes` in Jest:** Angular's JIT compiler creates its own `angular#unsafe-jit` policy through it and calls `createScript`. A fake factory must return pass-through rules for `angular*` names and count only the kit's policies.
- **`lc-icon` (or any kit component rendering a `<div>`) inside a `<p>`** breaks hydration of prerendered HTML (NG0502): the HTML parser closes the `<p>`. Use `<div>`/`<span>` wrappers in fixtures.
- **Strict CSP fixtures:** Angular 22's default incremental hydration writes an inline event-dispatch script, and critical-CSS inlining an inline `<script>` / `onload`; `script-src 'self'` blocks both. The life-os settings (`withNoIncrementalHydration()`, `inlineCritical: false`) live only in the compat template's `csp` configuration (`app.config.csp.ts` via `fileReplacements`, built for Angular 22 by `check-angular-majors.mjs`); the matrix build keeps Angular's defaults (review finding in 3.5.0, fixed in 3.5.1).
- **Chrome in CI:** GitHub's Ubuntu runners block Chrome's sandbox (AppArmor userns). Any headless-Chrome tool that runs in CI needs `--no-sandbox` when `CI` is set; local runs keep the sandbox.
- **`ConfirmService`** mounts the dialog on a plain `<div>` host, so there is no `lc-confirm-dialog` element to query.
- **`lc-skeleton` with a percentage width** applies it to host and box, so it compounds (45 % → 20 %). Put the percentage on a wrapper.
- **Unicode escapes in written files:** writing `﻿` through the file tools produced a literal BOM, and eslint failed with `no-irregular-whitespace`. Grep for the escape after writing such code.
- **Storybook:** a story-level `applicationConfig` appends its providers after the global ones, so a story's `provideRouter(…, withHashLocation())` wins over preview's `provideRouter([])`. `@defer (on timer(…))` works in the JIT stories.
- **Entry graph (request 002):** ng-packagr finds entry dependencies with `ts.preProcessFile`, which counts `import type` and dynamic `import()`; a type-only import back from a lazily imported entry is a cycle. Comments with `from '@lifecorner/…'` trip `entries.spec.ts` (cycle/self-import regex).
- **Specs that read SCSS source text** (`sidenav.app-shell.spec.ts`) break when rules move to a partial; inline the partial's mixins in the spec setup instead of touching assertions. `--border-radius-sm` is 10 px in DS 2.0 (designs sometimes say 4 px).

**Why:** these are not visible in the code and each looked like a kit regression at first.
**How to apply:** check this list before debugging a failing fixture, browser check or story; add new traps here.

Related: [[reference-gates-and-measuring]]
