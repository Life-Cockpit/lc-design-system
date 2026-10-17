---
name: reference-measured-values
description: Measured 3.4.1 reference values (sidenav current item, lc-app-page geometry, lc-icon DOM) and where the baseline shots/IDs/manifest live; use for "unchanged look" checks
metadata:
  type: reference
---

Measured on 3.4.1 (lib at 315a8a0, 2026-10-17) with story-shots; files in `tmp/story-shots/001/baseline/` (shots, `story-ids-3.4.1.json` = 824 IDs, `components-manifest-3.4.1.json` = 112 components / 1178 inputs).

- **Sidenav current item.** Light: ink rgb(20,79,91) on rgb(224,241,244) = 7.85:1. Dark: ink rgb(163,213,223) on rgba(32,132,151,.24) over #0a121b (composite rgb(15,45,57)) = 9.03:1. Other links: text-secondary, 7.56 (light) / 12.17 (dark).
  - Transparent variant at 1280 (app shell): 48 px pills, radius 9999, 16 px / 600 (others 500); x 24, width 192, rows y 112 / 164, padding 0 16, gap 12.
  - Default variant and drawer at 360: 44 px, radius 12, 14 px / 600; x 8, width 264.
- **lc-app-page `<main>`** (Today story).
  - 360: x 0, padding 24 / 24 / 16, content 312, gap 24.
  - 1024: x 240, width 784, padding 48, content 688, gap 40.
  - 1280 with aside: main 680 wide, padding 56, content 568; aside x 920, width 360.
- **lc-icon DOM.** `div.icon-container.icon-<size>.icon-<variant>[style=width/height px] > svg`. Attributes in order: source attributes, then `width`, `height`, `role`, `style="color: currentcolor;"`.
- **Storybook router.** In Storybook, `routerLinkActive` never matches anything (global `provideRouter([])`), so a router-matched state needs its own story router (hash location).
- **3.5 (request 001, reviewed at 3a46591).**
  - The busy page `layout-app-shell--today-loading` without an aside: main x 0 / 240 / 240, width 360 / 784 / 1040, padding 24·24·16 / 48·48·32 / 56·56·32, content 312 / 688 / 880.
  - Skeleton at 360: 140.4×17, 218.4×42, 156×42, 34 px circles, 312×96 r 24, 3 × 98.7×74 r 18.
  - `navigation-sidenav--router-matched` (width 248): pills x 41, width 200, 48 high, rows 52 apart.
  - Shots: `tmp/story-shots/001/r1/` (`base341/` = a real 3.4.1 build of 33 stories × 6, plus All Icons).

Related: [[feedback-design-pitfalls]]
