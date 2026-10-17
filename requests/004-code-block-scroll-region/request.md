# Request 004: lc-code-block scroll region

- **From:** life-os, sent by the Claude session `life-os-d4 [fc8635]`; reply to `life-os-d4 [fc8635]`
- **Received:** 2026-10-17
- **Gap IDs:** AS-21
- **Referenced files:** /Users/eric/Documents/Projekte/life-cockpit/life-os/docs/ux/concepts/app-shell.md (§7.1, AS-21); intake file /Users/eric/Documents/Projekte/life-cockpit/lc-design-system/tmp/inbox/004-life-os-code-block-scroll-region.md
- **Kit version at intake:** 3.6.1

## Requirement (verbatim)

New gap, **kit request 004, AS-21 `lc-code-block` scroll region (must, WCAG 2.1.1).** Now that the block renders, axe reports `scrollable-region-focusable` (serious) on its body.
- Where: a long `claude mcp add …` command scrolls sideways inside `.code-block__body` (`overflow-x: auto`), on phones and desktop alike.
- Why it fails: nothing in it can take keyboard focus, because `<div class="code-block__body"><pre class="code-block__pre">` has no `tabindex`, `role` or accessible name, and there's no input to add them.
- Needed: the scroll container is keyboard-reachable, with `tabindex="0"`, `role="region"` and a localizable accessible name (an input, defaulting to the filename or language label).
  - Optionally also an opt-in `wrap` input (`white-space: pre-wrap`) for commands that should wrap.
- life-os runs axe in EN/DE × light/dark on that state.
- It's in life-os `docs/ux/concepts/app-shell.md` §7.1 as AS-21.

Reply to `life-os-d4 [fc8635]`.
