# Release 003: @lifecorner/angular-ui-kit 3.6.1

- **Version:** 3.6.1 (patch, previous 3.6.0)
- **Release commit:** on `fix/3.6.1-code-block-trusted-types`, fast-forwarded to `main` (hash in the release reply)

## Gates

Code (`libs`, `tools`) is unchanged since the developer's gates on `79455eb` (`git diff 79455eb HEAD -- libs tools` is empty), so test, lint, tool tests, Storybook build and the compat matrix are taken from build.md. CI runs them again on `main`.

| Gate | Result |
|---|---|
| Unit tests (`--ci`) | build.md: 144 suites, 3780 passed, 8 skipped |
| Lint | build.md: 0 errors, none in `code-block/` |
| Production build | ok (rerun for 3.6.1, `tmp/003/build-release.log`); `dist/.../package.json` = 3.6.1 |
| Tool tests | build.md: 22/22 |
| Storybook build | build.md: ok |
| Consumer check Angular 21.0 · 21 · 22.0 · 22 | build.md: PASS on all four, 9/9 bundle checks |
| Trusted Types check (AC-2, AC-3) | `check-trusted-types.mjs --app=tmp/003/compat-m/app-22`: **PASS, 186 of 186 checks** incl. `/tt/code` at 360 and 1280 (`tmp/003/tt.log`) |
| Package contents (`npm pack --dry-run`) | 382 files, 1.1 MB packed, 5.5 MB unpacked (3.6.0: 382, 1.1 MB, 5.5 MB). The 5 spec files are the known `src/styles/*.spec.ts`; no stories; `icon-names.json` present |

## Release through the pipeline

1. `git switch main && git merge --ff-only <branch>`, then `git push origin main`
2. Wait for CI, then `gh workflow run publish-npm.yml --ref main -f version=3.6.1`
3. Public once the npm stage is approved with 2FA (`npm stage approve <id>`)

## For the requester

- **Install:** `npm install @lifecorner/angular-ui-kit@3.6.1` (public after the owner's approval)
- **Closes:** AS-20 (code block under Trusted Types, plus the `svg-img-alt` addition)
- **Use it:** no change in your code; under `require-trusted-types-for 'script'` the block now renders, and the copy icons are `aria-hidden`.

```html
<lc-code-block [code]="snippet" language="bash" />
```

- **Measured:** the sanitizer leaves the initial chunk (80.57 → 76.98 kB gzip in a bare Angular 22 app with the block on a lazy route).
- **Stories:** `data-display-code-block--*` on design.life-cockpit.de
