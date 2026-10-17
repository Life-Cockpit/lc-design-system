# Release <NNN>: @lifecorner/angular-ui-kit <X.Y.Z>

- **Version:** <X.Y.Z> (<patch | minor | major>, previous <A.B.C>)
- **Release commit:** <short hash> on `<branch>`

## Gates

| Gate | Result |
|---|---|
| Unit tests (`--ci`) | <suites / tests> |
| Lint | |
| Production build | |
| Tool tests | |
| Storybook build | |
| Consumer check Angular 21.0 · 21 · 22.0 · 22 | |
| Package contents (`npm pack --dry-run`) | <files, size; previous size> |

## Release through the pipeline

1. `git switch main && git merge --ff-only <branch>`, then `git push origin main`
2. `gh workflow run publish-npm.yml --ref main -f version=<X.Y.Z>`: tests, build, `npm stage publish` (OIDC, provenance), then the tag `v<X.Y.Z>` on the release commit
3. Public once the npm stage is approved with 2FA (`npm stage approve <id>`)

## For the requester

- **Install:** `npm install @lifecorner/angular-ui-kit@<X.Y.Z>` (public after the owner's approval)
- **Closes:** <gap IDs>
- **Use it:**

```html
<snippet>
```

- **Stories:** <story IDs on design.life-cockpit.de>
