# Brand assets

The LifeCorner logo: Edu, the emblem, and the LifeCorner lockup. `lc-logo` loads them from `LC_LOGO_BASE_PATH` (default `/assets`).

| File | Use |
|---|---|
| `lifecorner-logo.svg` | lockup on light: emblem and "Life" `#111827`, "Corner" `#1A6A79` (`variant="full"`) |
| `lifecorner-logo-on-dark.svg` | lockup on dark: "Life" `#F1F6F8`, "Corner" and emblem `#84C7D4`; the eyes are cut out |
| `lifecorner-emblem.svg` | emblem on light, from 33 px up (`variant="emblem"`, sizes `md` to `xl`) |
| `lifecorner-emblem-on-dark.svg` | emblem on dark, from 33 px up |
| `lifecorner-emblem-small.svg` | emblem on light at 32 px and below (sizes `xs`, `sm`): heavier arms, filled points |
| `lifecorner-emblem-small-on-dark.svg` | emblem on dark at 32 px and below; small geometry in the on-dark palette |
| `lifecorner-emblem-mono.svg` | single colour (`#111827`), for print and one-colour uses; not a default |
| `icon-names.json` | the icon catalogue (generated) |

## Rules

- The logo is flat and fixed: never animate, rotate, pose, recolour or distort it. Scale it only proportionally.
- The lockup always uses the filled emblem. In running text the name is plain text.
- Source: the LifeCorner brand files (`life-os/docs/brand/logo/`, ADR-0035). The `-small-on-dark` emblem and the dark lockup are derived from them in the brand-core colours.

## Font in the lockup

The words "Life" and "Corner" are **outlined to paths**, so the lockup looks the same inside `<img>`, where web fonts never load.

| | |
|---|---|
| Typeface | Plus Jakarta Sans Bold (variable font instanced at `wght` 700) |
| Source | Google Fonts, [github.com/google/fonts `ofl/plusjakartasans`](https://github.com/google/fonts/tree/main/ofl/plusjakartasans) (`PlusJakartaSans[wght].ttf`; upstream [tokotype/PlusJakartaSans](https://github.com/tokotype/PlusJakartaSans)) |
| Licence | SIL Open Font License 1.1, Copyright 2020 The Plus Jakarta Sans Project Authors |
| Layout | x 118, baseline 74, size 72, letter-spacing −1.4, kerning on, no ligatures (as a browser sets it) |

The font file itself is not shipped. Outlined glyphs in a logo are artwork made with the font, which the OFL allows.
