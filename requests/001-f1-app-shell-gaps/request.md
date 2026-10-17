# Request 001: F1 app-shell gaps (AS-12, AS-14, AS-15, AS-16; AS-13 optional)

- **From:** life-os (feature F1), sent by the Claude session `life-os-d4 [fc8635]` on 2026-10-17 10:40 to the session `lc-design-system-a7`, which did not act on it; carried over by the owner's request
- **Received:** 2026-10-17
- **Gap IDs:** AS-12, AS-14, AS-15, AS-16 (must); AS-13 (should, optional)
- **Referenced files:** /Users/eric/Documents/Projekte/life-cockpit/life-os/docs/ux/concepts/app-shell.md (§7.1, the F1 gap register)
- **Kit version at intake:** 3.4.1 (life-os uses 3.3.1)
- **Reply to:** the session `life-os-d4 [fc8635]` (SendMessage with the ref; another session has the same name): questions, and the published version

## Requirement (verbatim)

Request from life-os (feature F1): please start the spec-writer for one kit release that closes gaps AS-12, AS-14, AS-15 and AS-16; AS-13 is optional.

Gaps AS-12, AS-14, AS-15 and AS-16 block F1. life-os is on @lifecorner/angular-ui-kit 3.3.1. 3.4.0/3.4.1 contain none of these. The owner approved the approach (life-os plan decisions B12, B26, B27). The source of each gap is the life-os gap register in docs/ux/concepts/app-shell.md §7.1.

**AS-12 `lc-app-page` busy state (must)**
- Add a `busy` input (boolean) that sets `aria-busy="true"` on the `<main>` that `lc-app-page` renders, and drops it when false.
- Why: Today's skeleton must be announced as loading. 3.3.1 has no input and no attribute pass-through.

**AS-14 `lc-icon` under Trusted Types (must)**
- life-os runs a strict CSP: `require-trusted-types-for 'script'; trusted-types angular sw-registration lc-icon`.
- `lc-icon` in 3.3.1 uses `DOMParser.parseFromString` with a plain string and `bypassSecurityTrust*`. So no page with an icon renders, and every e2e test fails with a TT violation.
- Required:
  - `lc-icon` builds its SVGs through exactly one named Trusted Types policy, `lc-icon` (that exact name; the app's CSP allows it);
  - the policy accepts only the kit's bundled icons;
  - no `parseFromString` with a plain string;
  - no `bypassSecurityTrust*`;
  - it still works without Trusted Types (feature-detect `window.trustedTypes`).
- Please add a test that runs under a TT-enforcing CSP.

**AS-15 bundle size (must)**
- Initial JS in life-os is 198 kB gzip against a 150 kB budget (ADR-0012, mobile first). The kit is one FESM module, so every used part lands in the initial load.
- Required:
  - secondary entry points per component (or per small component group), so consumers import only what they use and lazy routes can split kit parts;
  - `ICON_NAMES` (18.7 kB gzip, used only for a dev warning) only in development builds;
  - the primary entry point keeps working, with no API break.

**AS-16 `lc-sidenav` `aria-current` (must)**
- In 3.3.1 the sidenav links carry `routerLinkActive` without `ariaCurrentWhenActive`, next to the kit's own `[attr.aria-current]="isItemActive(item) ? 'page' : null"`.
- Angular's `RouterLinkActive` removes `aria-current` on every update. The kit binding rewrites it only when its value changes. Result: the first destination (`/`) has the active class but never `aria-current="page"`, while `/household` keeps it.
- Fix: `ariaCurrentWhenActive="page"` on those links, or keep only one mechanism.
- Exactly one item has `aria-current="page"`. `lc-bottom-nav` is not affected.

**AS-13 (should, optional)**
- The FESM file imports `mermaid` lazily with a literal specifier, so every consumer must resolve `mermaid`. life-os works around it with `externalDependencies: ["mermaid"]`.
- Fix: a non-literal import or its own secondary entry point.

**Please:**
- update the MCP docs and the changelog;
- tell me the published version when it's on npm.

Reply to session `life-os-d4 [fc8635]`. There is another session with the same name, so please use the ref. Run any questions back the same way.
