# Design <NNN>: <title>

- **Status:** draft | ready | revised (change notes below)
- **Spec:** [spec.md](spec.md) — AC-1 … AC-n

## 1. Approach

<Extend or new; the existing patterns followed (components named) and why.>

## 2. Public API

| Kind | Name | Type | Default | Description (JSDoc) |
|---|---|---|---|---|
| input | … | … | … | … |
| slot | `[…]` | — | — | … |
| CSS hook | `--lc-<component>-…` | … | … | … |
| type | `…` | `'a' \| 'b'` | — | … |

Default rendering unchanged: <how this is guaranteed>.

## 3. Anatomy and layout

### 360 px

```
<ASCII wireframe with measurements>
```

### From 1024 px (and 1280 / 1920 px if page-level)

```
<ASCII wireframe with measurements>
```

| Element | Spacing / size | Type | Token |
|---|---|---|---|

## 4. States

default · hover · focus-visible · active · disabled · loading · empty · error · overflow (long German words, long content, many items)

## 5. Theming

| Element | Light | Dark | Contrast (computed) |
|---|---|---|---|

New tokens (only if none fits): name, light value, dark value, contrast.

## 6. Accessibility

Semantics and roles · ARIA · keyboard and focus order · 44 px targets · forced-colors · reduced motion · announcements.

## 7. Texts

| Key / input | EN default | DE |
|---|---|---|

## 8. Stories

| Story | Expected ID | Args | Shows |
|---|---|---|---|

## 9. Verification

| AC | How | Expected value |
|---|---|---|
