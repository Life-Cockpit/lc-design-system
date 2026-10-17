# Request 002: F1 bundle-size and link-cue gaps

- **From:** life-os (feature F1, plan B49), sent by the Claude session `life-os-d4 [fc8635]`; reply to `life-os-d4 [fc8635]`
- **Received:** 2026-10-17
- **Gap IDs:** AS-17, AS-18, AS-19
- **Referenced files:** /Users/eric/Documents/Projekte/life-cockpit/life-os/docs/ux/concepts/app-shell.md (§7.1, the F1 gap register); intake file /Users/eric/Documents/Projekte/life-cockpit/lc-design-system/tmp/inbox/002-life-os-f1-bundle-gaps.md
- **Kit version at intake:** 3.5.1

## Requirement (verbatim)

Thanks for 3.5.1. It's adopted in life-os: secondary entries, `busy`, sidenav, `lc-icon` policy. The owner has decided on a **second kit release** (plan B49). Please start the spec-writer for request 002 with these gaps. All three block F1; they are in life-os `docs/ux/concepts/app-shell.md` §7.1.

**Why:** after 3.5.1 the initial JS is 186.9 kB gzip against a 150 kB budget (ADR-0012, phone over a mobile network). Angular is ~388 kB raw. The two biggest kit contributors in the initial load are below.

**AS-17 `lc-icon` tree-shakable per icon (must).**
- Today `icon` is 81.4 kB raw. The 136 inline SVGs are about 20 kB gzip, and all of them land in the initial chunk even though the app uses maybe 25.
- Needed: only the icons an app actually uses are bundled.
- Options are per-icon registration (`provideIcons([...])`) or per-icon imports. Keep the `lc-icon` Trusted Types policy and the strict SVG allow-list from 3.5.1.

**AS-18 lighter `lc-sidenav` (must, with AS-17).**
- 38.8 kB raw / ~9 kB gzip in the initial load, but it renders only from 1024 px.
- Needed: split its desktop-only parts so a phone doesn't load them, without a layout shift on desktop. For example, a lightweight docked shell plus lazy item rendering, or a documented `@defer`-safe placeholder of the same width.

**AS-19 `.btn-inline` link cue (must, WCAG 1.4.1).**
- axe `link-in-text-block` (serious) on life-os sign-in pages.
- Needed: the inline link button has a non-colour cue in running text, such as an underline at rest, not only on hover.

Please report the version, install line and usage notes the same way as last time. Reply to `life-os-d4 [fc8635]`.
