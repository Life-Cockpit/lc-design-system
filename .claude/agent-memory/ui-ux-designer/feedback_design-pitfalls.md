---
name: feedback-design-pitfalls
description: Non-obvious traps in kit designs (ng-packagr entry IDs, Nx self-import lint, Renderer2 _ngcontent on built SVG, AC wording, 'untouched' lines vs own packaging rules, string route matching, Angular 22 hydration under CSP)
metadata:
  type: feedback
---

Traps to check before fixing a design (found in request 001, 2026-10-17):

- **ng-packagr entry IDs.** ng-packagr derives a secondary entry's module ID from the folder of its `ng-package.json`, relative to the primary root. So `src/lib/icon/ng-package.json` would become `…/src/lib/icon`.
  - A stub `libs/angular-ui-kit/<entry>/ng-package.json` with `entryFile: ../src/lib/<entry>/index.ts` works (prototyped with 22.2.4).
  - A relative import across entries then fails with TS6059 (rootDir). That error is the duplicate-module guard.
- **Nx self-import lint.** Nx `enforce-module-boundaries` only recognises secondary entries when `ng-package.json` sits next to the sources. With stubs, the lint needs `allowCircularSelfDependency`.
- **Building DOM inside a component.** A component's `Renderer2` stamps `_ngcontent-*` onto every element it creates (emulated encapsulation). For DOM that must equal earlier output (icons), build with `DOCUMENT` APIs instead.
- **Server-side DOM writes.** `afterRender*` hooks don't run on the server. DOM writes that must be in prerendered HTML belong in a component `effect`.
- **Spec wording.** An AC like "no emitted .js contains X" also rules out lazy chunks. Check the alternatives the spec offers against such wording before choosing.
- **Verification lines against your own rules** (found in the 001 review). "0 changed files under `lib/bottom-nav/`" contradicted the design's rule that every cross-folder import uses a package path. Write "template, styles, logic and spec unchanged" instead, and check each "untouched" expectation against the packaging rules.
- **Replacing `routerLinkActive` with string matching.** `routerLinkActive` resolves relative routes; comparing `route` strings doesn't. State "absolute routes" in the API docs.
- **Angular 22 hydration under a CSP.** Since 22.0 incremental hydration is on by default, and it writes an inline event-dispatch script; critical-CSS inlining writes one too. A `script-src 'self'` fixture needs `withNoIncrementalHydration()` + `inlineCritical: false`, but only in that fixture. Compat builds that stand for existing consumers keep the defaults.

**Why:** these decide whether a design is buildable at all, and they cost a round trip when found during the build.

**How to apply:** for packaging or DOM-insertion designs, prototype in the scratchpad (with ng-packagr from the repo's node_modules) before fixing the layout, and name these pitfalls in the design's risk list.

Related: [[reference-measured-values]]
