# Log 001: F1 app-shell gaps

## Owner decisions

- 2026-10-17: The owner asked to run this request in the session `lc-design-system-90` (carried over from `lc-design-system-a7`, which had not acted on it).

- 2026-10-17 (requester, `life-os-d4`, not the owner): keep the scope to AS-12, AS-14, AS-15 and AS-16, with AS-13 only if it's cheap; SI-12, AC-1/AC-2 and other F1 gaps wait for a later release. life-os task T319 adopts the release (kit update, `busy` on Today, secondary-entry imports until initial JS ≤ 150 kB gzip, the `lc-icon` Trusted Types policy).

## Handoffs

| Time | From → to | Status | Reason | Task |
|---|---|---|---|---|
| 2026-10-17 12:05 | intake → spec-writer | new | Request registered | Write the spec for this request |
| 2026-10-17 12:19 | spec-writer → ui-ux-designer | done | The spec is ready with no owner questions; the API, packaging layout and the verification fixtures are design decisions. | Design the API and visuals for AC-1…AC-28 of requests/001-f1-app-shell-gaps/spec.md. Your decisions are the secondary-entry layout (AC-15/16), how fetched icons avoid every Trusted Types sink (AC-12), what icons do when the CSP refuses the policy (AC-11), production handling of unknown icon names (AC-19), and the sidenav's current-item rule when activeRoute is empty (AC-23). |
| 2026-10-17 12:41 | ui-ux-designer → web-developer | done | The design settles every choice the spec left open (entry layout, sink-free fetched icons, refused policy, unknown names in production, the sidenav rule) and the verification fixtures; no owner question. | Implement design.md for AC-1…AC-28: `busy` on lc-app-page, lc-icon through the `lc-icon` policy plus the allow-list builder, the 112 secondary entries (stub layout) with icon-names split out, the single-source sidenav current item, the two new stories, the compat `/tt` routes, check-trusted-types.mjs and check-entries.mjs, docs and a changelog draft; record the numbers in build.md. |
