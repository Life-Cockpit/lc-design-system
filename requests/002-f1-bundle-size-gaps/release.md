# Release 002: @lifecorner/angular-ui-kit 3.6.0

- **Version:** 3.6.0 (minor, previous 3.5.1)
- **Release commit:** `release: 3.6.0` on `feat/3.6-f1-bundle-size-gaps` (feature commit f6f3ca8, based on `main` 079fae5; `origin/main` has not moved)

## Gates

Code unchanged since the developer's gates (`git diff 10aab3d f6f3ca8 -- libs tools` is empty), so results are taken from build.md. CI runs tests, build, compat matrix, Trusted Types and entry checks again on `main`.

| Gate | Result |
|---|---|
| Unit tests (`--ci`) | 143 suites, 3744 passed, 8 skipped (build.md) |
| Lint | 0 errors, 162 warnings, none in new files (build.md) |
| Production build | green, rerun for the release; `dist` package.json is 3.6.0 (`tmp/002/rel-build.log`) |
| Tool tests | 22/22 (build.md) |
| Storybook build | green (build.md) |
| Consumer check | Angular 22 PASS, 33 HTML checks (build.md); Angular 21, Trusted Types and entry checks run in CI |
| Package contents (`npm pack --dry-run`) | 382 files, 1.1 MB packed, 5.5 MB unpacked; previous 370 files, 1.1 MB, 5.3 MB. New: `icons` and `sidenav-placeholder` entries. No component specs or stories; only the 5 known `src/styles/*.spec.ts`. Assets, styles and `icon-names.json` are in (`tmp/002/pack.log`) |

Bundle (F1-shaped fixture, gzip): 3.5.1 137.28 kB, 25 glyphs registered 129.00 kB (-8.27), sidenav deferred 122.94 kB (-6.06).

## Open review findings (not must-fix, do not block)

| # | Severity | Open |
|---|---|---|
| 1 | should-fix | Placeholder style spec checks only placeholder within sidenav; add the reverse direction for box declarations |
| 3 | nit | `registered-icons` story at 1280: glyphs sit about 800 px from their names |
| 4 | nit | `bundle-size--docs`: add the trade-off table (127.08 kB vs 129.00 kB) |

Finding 2 is closed by the changelog. The others go to the next patch.

## Release through the pipeline

1. `git switch main && git merge --ff-only feat/3.6-f1-bundle-size-gaps`, then `git push origin main`
2. Wait for CI green, then `gh workflow run publish-npm.yml --ref main -f version=3.6.0`
3. Public once the npm stage is approved with 2FA (`npm stage approve <id>`)

## For the requester

- **Install:** `npm install @lifecorner/angular-ui-kit@3.6.0` (public after the owner's approval)
- **Closes:** AS-17, AS-18, AS-19
- **Use it:**

```ts
// provideLcIcons from '@lifecorner/angular-ui-kit/icon', ICON_* from '@lifecorner/angular-ui-kit/icons'
provideLcIcons([ICON_HOME, ICON_MAIL, ICON_X_MARK], { unregistered: 'placeholder' })
```

```html
@defer (on viewport) {
  <lc-sidenav mode="docked" [isOpen]="true" width="100%" [mobileBreakpoint]="0" variant="transparent" [items]="nav" [activeRoute]="url()" />
} @placeholder {
  <lc-sidenav-placeholder [isOpen]="true" width="100%" variant="transparent" [items]="nav" [activeRoute]="url()" />
}
```

Inline links (`lc-button` with `inline`) are underlined at rest; `--lc-btn-inline-text-decoration: none` turns it off.

- **Stories:** `components-icon--registered-icons`, `components-icon--unregistered-name`, `bundle-size--docs`, the four `navigation-sidenav-placeholder` stories and `inline-link-wrapping` on design.life-cockpit.de
