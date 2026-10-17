# Log 004: lc-code-block scroll region

## Owner decisions

<Date: question → answer. Empty when none.>

## Handoffs

| Time | From → to | Status | Reason | Task |
|---|---|---|---|---|
| 2026-10-17 | spec-writer → ui-ux-designer | done | The spec is ready and no owner decision is needed, so the designer is next. | Design the API and visuals for AC-1…11 in requests/004-code-block-scroll-region/spec.md. That means the `regionLabel` and `wrap` inputs, the focus ring inside the clipped body, the wrapped line-number alignment, and stories at 360 and 1280 px in light and dark with German text. |
| 2026-10-17 | ui-ux-designer → web-developer | done | The API, anatomy, tokens, contrast and verification are fixed and the baseline is captured, so the code can be built. | Implement design.md for request 004: the `regionLabel` and `wrap` inputs, the region attributes on the body, `.code-block__pre { overflow: visible }`, the inset `mix.focus-ring(-4px)` with the focus-only radius and the forced-colors rule, the three stories with argTypes, the tests for AC-1/2/7, and the compat `tt/code` expectations for AC-9; draft the changelog for AC-11. |
| 2026-10-17 | web-developer → ui-ux-designer | done | The build is complete and every gate is green, so the stories are ready for review. | Review request 004 (stories `data-display-code-block--long-command`, `--long-command-german`, `--wrapped`); shots in `tmp/story-shots/004/build/`, the baseline compare is 84/84 identical. |
| 2026-10-17 | ui-ux-designer → release-manager | done | Every AC passed with measured evidence and there is no must-fix finding, so the request goes to release. | Prepare the release for request 004 (minor 3.7.0, branch feat/3.7-code-block-scroll-region, changelog draft in build.md); review.md round 1 is approved with one nit, already fixed in design.md. |
| 2026-10-17 | release-manager → none | done | 3.7.0 is prepared, gates green, review approved; released through the pipeline. | none |
