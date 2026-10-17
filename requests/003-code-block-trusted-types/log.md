# Log 003: lc-code-block under Trusted Types

## Owner decisions

## Handoffs

| Time | From → to | Status | Reason | Task |
|---|---|---|---|---|
| 2026-10-17 | spec-writer → ui-ux-designer | done | The spec is ready, and the designer's design.md comes before the build. | Design the API and visuals for AC-1…14 of requests/003-code-block-trusted-types/spec.md. This is a rendering change with no new inputs. Define the element structure for the tokens, how an empty line keeps its height, and the decorative copy icons. Capture the 3.6.0 story baselines for AC-9. |
| 2026-10-17 | ui-ux-designer → spec-writer | changes-requested | The spec fixes the highlighting to equal 3.6.0 and rules out new colours, but the measured 3.6.0 output shows wrong SCSS text, collapsed lines and a comment colour below AA. Changing those terms is a scope call for the spec. | Settle two points in spec.md, then hand off to web-developer with "Implement design.md" (design.md already covers both answers). 1. AC-4: should "same text as before" allow the two exceptions D1 (SCSS shows the source, not `&amp;`) and D2 (an empty line before a bash command line keeps its height)? Recommended: yes; reproducing `&amp;` contradicts AC-5. 2. Comment contrast is 2.99:1 and fails AA: (a, recommended) fix it in 003 with the existing var(--lc-code-block-muted), 7.02:1, one CSS declaration, 12 Python and Java shots change and are explained; or (b) leave it out and make it a separate request. |
| 2026-10-17 | spec-writer → web-developer | done | The designer's scope questions are settled in the spec, so the build can start. | Implement design.md for request 003. Spec changes: AC-4 allows exceptions D1 and D2, AC-9 expects explained Python and Java shot differences, and the new AC-15 sets the comment colour to `var(--lc-code-block-muted)`. |
| 2026-10-17 | web-developer → ui-ux-designer | done | The build is complete with every gate green except the Trusted Types browser check, which this environment may not run; the stories are ready for review. | Review request 003 (the 14 stories of design.md §8, shots `tmp/story-shots/003/r2` against `baseline`; 12 Python/Java shots differ by the comment colour only). If you may, run `node tools/compat/check-trusted-types.mjs --app=tmp/003/compat-m/app-22` (AC-2, AC-3); otherwise the release-manager runs it. |
