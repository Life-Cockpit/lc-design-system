# Log 002: F1 bundle-size and link-cue gaps

## Owner decisions

2026-10-17 (from the requester): the owner decided on a second kit release for these gaps (life-os plan B49).

## Handoffs

| Time | From → to | Status | Reason | Task |
|---|---|---|---|---|
| 2026-10-17 15:52 | dispatcher → spec-writer | new | Request received from life-os (headless) | Write the spec for this request |
| 2026-10-17 15:55 | spec-writer → ui-ux-designer | done | The spec is ready, and the API and visual decisions belong to the designer. | Design the API and visuals for AC-1…16 in requests/002-f1-bundle-size-gaps/spec.md. Choose how icons are registered, plus the kit's internal icon set, so unregistered 3.5.1 names keep working (spec assumption 3). Design the lazy sidenav part with a placeholder of identical size, and the `.btn-inline` underline with the `--lc-btn-inline-text-decoration` hook. If tree-shaking can't be done without breaking defaults, hand back to the spec-writer. |
| 2026-10-17 16:32 | ui-ux-designer → spec-writer | changes-requested | AC-1's target rests on a size premise that measurement disproves, and AC-2/AC-4/AC-11 contradict the design the spec asks for, so the spec needs amending before the build. | Settle design.md §10 Q1–Q3 in spec.md: (1) AC-1 target — measured 136 SVGs = 12.0 kB gzip, proposal "≥ 7 kB gzip smaller, and no glyph that nobody registered in the initial JS"; (2) AC-2/AC-4 "assertions unchanged; imports and setup may change"; (3) AC-11 read as in design §6 (inert placeholder; landmark, aria-current and tab order as in 3.5.1 after load). If you accept, hand off to web-developer with "Implement design.md"; otherwise hand back to ui-ux-designer. |
| 2026-10-17 16:34 | spec-writer → web-developer | done | The spec-writer accepted design.md §10 Q1-Q3, so design.md is consistent with the spec and the build can start. | Implement design.md. The spec is amended: AC-1 is now at least 7 kB gzip smaller plus no unregistered glyph in the initial JS. AC-2 and AC-4 keep their assertions, and imports and setup may change. AC-11 follows design §6. |
| 2026-10-17 17:45 | web-developer → ui-ux-designer | done | Built on feat/3.6-f1-bundle-size-gaps (10aab3d), all gates green; the design review and four small deviations (build.md) need the designer. | Review request 002: stories components-icon--registered-icons, --unregistered-name, --icon-constants; navigation-sidenav-placeholder--next-to-the-sidenav, --transparent, --collapsed, --sections-groups-and-logo; layout-app-shell--lazy-side-navigation(-german); components-button-link--inline-link-wrapping, components-button--inline-without-underline, --inline-link, components-button-link--inline-in-text (shots in tmp/story-shots/002/build); decide build.md deviations 1–4. |
