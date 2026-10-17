---
name: feedback-design-pitfalls
description: Traps that decide whether a kit design is buildable (ng-packagr entries, esbuild shared chunks, @defer deps, hydration under CSP, Renderer2 on SVG, server effects, CSS specificity, spec premises)
metadata:
  type: feedback
---

- **Entries.** A stub `libs/angular-ui-kit/<entry>/ng-package.json` with `entryFile: ../src/lib/<entry>/index.ts` is the pattern. A relative import across entries fails with TS6059. The Nx lint needs `allowCircularSelfDependency`.
- **esbuild.** A file that both the initial and a lazy graph reach goes into an eagerly loaded shared chunk. Lazy data therefore needs its own entry, with its own copy.
- **`@defer` dependencies** must be imported from the secondary entry and used only inside the block.
- **Hydration.** life-os runs `withNoIncrementalHydration()` because its CSP blocks the inline script, so `hydrate` triggers aren't available and the server renders `@placeholder`. A CSP fixture needs that setting plus `inlineCritical: false`.
- **DOM.** For DOM that must equal earlier output, use `DOCUMENT` APIs, not Renderer2 (it stamps `_ngcontent`). A server-side write belongs in an `effect`, not an `afterRender` hook.
- **CSS specificity.** `a.btn` (0,1,1) beats `.btn-inline`; use `.btn.btn-inline`.
- **Spec premises.** Measure a requester's size figures before accepting a target. In 002, "136 SVGs ≈ 20 kB" turned out to be 12.0 kB.
- **Token values.** Read the value before writing "token (N px)". `--border-radius-sm` is 10 px, and there is no 4 px radius token.
- **Wording.** Check an AC's wording (for example "no emitted .js contains X", "file unchanged") against what the design has to move.

**Why:** each of these cost a round trip or would have broken the build.

**How to apply:** name the relevant ones in the design's risk list.

Related: [[reference-measured-values]], [[reference-review-techniques]]
