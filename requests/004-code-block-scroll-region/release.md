# Release 004: @lifecorner/angular-ui-kit 3.7.0

- **Version:** 3.7.0 (minor, previous 3.6.1)
- **Release commit:** `release: 3.7.0` on `feat/3.7-code-block-scroll-region`, then fast-forward to `main`

## Gates

Code unchanged since the developer's gates (`git diff --quiet 2bf9f34 HEAD -- libs tools` holds), so their results from build.md apply.

| Gate | Result |
|---|---|
| Unit tests (`--ci`) | 145/145 suites, 3797 passed, 8 skipped (build.md) |
| Lint | 0 errors, 162 warnings, none in `code-block/` (build.md) |
| Production build | green, 9.0 s, `dist/.../package.json` is 3.7.0 (rerun here) |
| Tool tests | 22/22 (build.md) |
| Storybook build | green (build.md) |
| Consumer check Angular 22 | PASS 22.2.3, incl. AS-21 line (build.md); full matrix runs in CI on `main` |
| Package contents (`npm pack --dry-run`) | 382 files, 1.1 MB packed, 5.5 MB unpacked; 3.6.1 had 382 files, 1.1 MB, 5.5 MB. No component specs or stories; only the known five `src/styles/*.spec.ts`; `icon-names.json` present |

## Release through the pipeline

1. `git switch main && git merge --ff-only feat/3.7-code-block-scroll-region`, then `git push origin main`
2. Wait for CI, then `gh workflow run publish-npm.yml --ref main -f version=3.7.0`
3. Public once the npm stage is approved with 2FA (`npm stage approve <id>`)

## For the requester

- **Install:** `npm install @lifecorner/angular-ui-kit@3.7.0` (public after the owner's approval)
- **Closes:** AS-21
- **Use it:**

```html
<lc-code-block
  language="bash"
  [code]="command"
  regionLabel="Befehl für Claude Code" />

<!-- or wrap long lines instead of scrolling -->
<lc-code-block language="bash" [code]="command" [wrap]="true" />
```

- **Stories:** the LongCommand, LongCommandGerman and Wrapped stories under Code Block on design.life-cockpit.de
