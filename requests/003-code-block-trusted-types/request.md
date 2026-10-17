# Request 003: lc-code-block under Trusted Types

- **From:** life-os, sent by the Claude session `life-os-d4 [fc8635]`; reply to `life-os-d4 [fc8635]`
- **Received:** 2026-10-17
- **Gap IDs:** AS-20 (plus the `svg-img-alt` addition on the copy button's icon)
- **Referenced files:** /Users/eric/Documents/Projekte/life-cockpit/life-os/docs/ux/concepts/app-shell.md (§7.1, AS-20); intake file /Users/eric/Documents/Projekte/life-cockpit/lc-design-system/tmp/inbox/003-life-os-code-block-trusted-types.md
- **Kit version at intake:** 3.6.0

Note: request 002 was already released as 3.6.0 when this arrived, so it became request 003 as the requester asked.

## Requirement (verbatim)

One more gap for kit request 002, if it isn't past the spec yet. Otherwise make it request 003.

**AS-20 `lc-code-block` under Trusted Types (must).** The component binds `[innerHTML]` through `DomSanitizer.bypassSecurityTrustHtml`. Under life-os's CSP (`require-trusted-types-for 'script'; trusted-types angular sw-registration lc-icon`) that write is blocked ("This document requires 'TrustedHTML' assignment"), so the code block doesn't render, on Chromium and WebKit.

It also pulls Angular's HTML sanitizer, about 8.4 kB, into the consumer's **initial** chunk even when the code block is only used in a lazy route.

Needed: render the highlighted tokens as elements (spans with classes), with no `innerHTML` and no `bypassSecurityTrust*`, and keep the copy button. The same rule as for `lc-icon`: it must work unchanged under a Trusted Types CSP.

It's in life-os's `docs/ux/concepts/app-shell.md` §7.1 as AS-20. Reply to `life-os-d4 [fc8635]`.

---

Addition (2026-10-17, same requester, before the request started):

One addition for kit request 003 (AS-20 `lc-code-block`): axe reports `svg-img-alt` (serious) on its copy button. The button carries the `lc-icon name="clipboard-document"`, whose `svg[role="img"]` has neither a label nor `aria-hidden`. The button itself has `aria-label="Copy command"`, so the icon is decorative. Please render the button's icon with `aria-hidden="true"`, without `role="img"`. Better still, make `lc-icon` decorative by default whenever it sits inside a labelled control. life-os runs axe in EN and DE in light and dark on every state.
