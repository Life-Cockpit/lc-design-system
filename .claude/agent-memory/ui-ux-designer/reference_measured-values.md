---
name: reference-measured-values
description: Measured kit reference values (3.4.1/3.5 sidenav, app page, icon DOM; 3.5.1 icon data size, docked sidenav geometry, inline-link contrast) and where the baseline shots live; use for "unchanged look" checks and size targets
metadata:
  type: reference
---

- **3.4.1 / 3.5 (request 001).** Sidenav current item: 7.85:1 light, 9.03:1 dark. Transparent pills at 1280: x 24, 192×48, r 9999, 16 px/600. Default and drawer items: 44 px, r 12. `lc-app-page` main: at 360 x 0, padding 24/24/16, content 312; at 1024 x 240, width 784, padding 48. lc-icon `<svg>` attributes in order: source attributes, width, height, role, style.
- **3.5.1 (request 002, main 079fae5).** The 136 bundled SVG strings are 58.7 kB raw / **12.0 kB gzip**; the whole icon entry is about 20 kB gzip. Docked sidenav:
  - default: nav padding 16/8, rows 303×44, gap 0;
  - transparent: padding 48/24/24, pills 48, gap 4;
  - collapsed: rail 56, padding 8, rows 39×44, gap 2, icon 22;
  - content div: 32 px.
- **3.6 (request 002, f6f3ca8).**
  - Compat initial JS (gzip): 3.5.1 137.28, opt-in to nothing 127.08, 25 registered 129.00, plus a deferred sidenav 122.94 kB.
  - App-shell nav column: at 1024 and 1280 it is 240 wide, with pills x 24, 192×48 and the first one at y 112; at 1920 it is 280 wide with 232 px pills. `lc-sidenav-placeholder` matches every box of `lc-sidenav`, except the section title width (84 vs 90.9 px).
  - The `.btn-inline` underline is 1 px with a 0.15em offset. A 312 px paragraph is 72 px (EN) and 96 px (DE), with or without the line.
- **Inline link colours (3.5.1).** Light rgb(26,106,121): 6.21:1 on white, 2.86:1 against the text. Dark rgb(163,213,223): 11.78:1, 1.47:1 against the text.
- **lc-code-block 3.6.0 (request 003).** Code text is 12.25 px mono with a 13.475 px line height. The header is 45 px, the copy button 76.8×44 and its icon 20 px. The number box is x 33, w 40; the content starts at x 73. A 2,000-line block (10k spans) renders in 66 ms and re-renders in 59 ms. Token contrast on #0c1722 is ≥ 5.66, **except comment #5c6370 at 2.99**. Golden output: `requests/003-…/golden-3.6.0.json`. 3.6.1: every line rect 13.469 px (empty lines too), comment #93a4ad 7.02:1, Python/Java shots differ from 3.6.0, the other 72 are identical.
- **Baselines.** `tmp/story-shots/001/{baseline,r1}`; `002/baseline` (66 stories, 700 ms wait); `003/baseline` (14 code-block stories, `--full`, 84 shots, re-run 84/84 identical).
- **Storybook router.** `routerLinkActive` never matches anything in Storybook, so a router-matched state needs its own story router.

Related: [[feedback-design-pitfalls]]
