# LifeCorner Design System

`@lifecorner/angular-ui-kit`: about 110 standalone Angular components, built with Angular 22 for apps on Angular 21 and 22 (peer range `^21.0.0 || ^22.0.0`), styled with SCSS and design tokens. The docs (Storybook) and an MCP endpoint run at `design.life-cockpit.de`. Consuming projects such as life-os (the LifeCorner app and website) report what they miss as **gaps** with IDs from their UX concepts (G-13, LK-7, SI-8). The kit closes a gap; a consumer never rebuilds it locally.

Everything in this repository is written in English: code, docs, commits, changelog and the request documents.

## Commands

| What | Command |
|---|---|
| Unit tests (Jest) | `npx nx run angular-ui-kit:test` (one file: `--testFile=hero.component.spec.ts`) |
| Lint | `npx nx run angular-ui-kit:lint` |
| Build the library | `npx nx run angular-ui-kit:build` (production; runs `build:tokens` first) → `dist/libs/angular-ui-kit` |
| Storybook | `npx nx run angular-ui-kit:storybook` (port 4400) · static: `npx nx run angular-ui-kit:build-storybook` → `dist/storybook/angular-ui-kit` |
| Story screenshots and measurements | `node tools/agents/story-shots.mjs --list=<filter>` · `--stories=<id>[,…] [--widths=360,1024,1280] [--themes=light,dark] [--full] [--measure='<JS>'] [--out=<dir>]` (after the static Storybook build) |
| Tool tests (MCP manifest extractor) | `npm run test:tools` |
| Consumer check on Angular 21 and 22 (AOT, strictTemplates, prerender) | `node tools/compat/check-angular-majors.mjs [--only=22]` (after the library build; several minutes, needs the network) |
| Design tokens | `npm run build:tokens` (`libs/angular-ui-kit/tokens.json` → `src/styles/tokens/`, `src/lib/tokens/`) |

Use the `npx nx run angular-ui-kit:<target>` form: the project settings allow exactly that.

## Layout

- `libs/angular-ui-kit/src/lib/<component>/`: `<name>.component.{ts,html,scss,spec.ts}` and `<name>.stories.ts`. Shared helpers are in `lib/shared/`, and the theme service is in `lib/theme/`.
- `libs/angular-ui-kit/src/index.ts`: the public API. Every component, directive and exported type goes there.
- `libs/angular-ui-kit/src/styles/`: the global styles. The semantic colour tokens for both themes are in `_theme-light.scss` and `_theme-dark.scss`, and their contrast is asserted in `theme-contrast.spec.ts`. The other global files are `_typography.scss`, `_utilities.scss` and `_horizon.scss`.
- `libs/angular-ui-kit/src/docs/*.mdx`: the token and guideline pages in Storybook.
- `libs/angular-ui-kit/CHANGELOG.md`: the consumers' changelog, also served by the MCP (`get_changelog`).
- `README.md` (root) and `libs/angular-ui-kit/README.md`: both list the components.
- `tools/compat/`: the consumer app (`template/`) and the expected prerendered HTML (`EXPECT_IN_HTML` in `check-angular-majors.mjs`).
- `tools/generate-components-manifest.mjs` and `tools/mcp-lambda/`: the MCP manifest and server. They read the inputs and their JSDoc from the component source and the descriptions from the stories.
- `requests/`: one folder per request that goes through the agent pipeline (see below).

## Conventions

- **Angular:** standalone components, `ChangeDetectionStrategy.OnPush`, signal APIs (`input()`, `input.required()`, `model()`, `output()`, `computed()`), selector `lc-<name>`, class `<Name>Component`. Value sets are exported union types (`HeroSize`). Every input has JSDoc with `@default`, because the MCP shows it to consumers.
- **Styles:** use tokens, never raw colours (`var(--color-…)`, the spacing, radius and typography tokens). Class names follow BEM (`hero__body`, `hero--lg`). A public CSS hook is named `--lc-<component>-<property>` and has a documented default. Both themes, `forced-colors` and `prefers-reduced-motion` must work. A layout should hold in prerendered HTML before JavaScript runs.
- **Accessibility:** WCAG 2.2 AA. Contrast is computed, not estimated (4.5:1 for text, 3:1 for large text and UI boundaries). Touch targets are at least 44 px, with `:focus-visible` and correct semantics.
- **Mobile first:** design at 360 px first, then check 1024 and 1280 px (and 1920 px for page-level layouts). German strings are long, so check them.
- **Texts:** every built-in text can be changed through a `locale` or label input, with English defaults and German verified.
- **Compatibility:** a minor or patch release has no API breaks. A new input is optional, and its default renders exactly as before. Add no runtime dependency and don't change the peer range unless the request says so and the owner agreed.
- **Stories:** `title: '<Category>/<Name>'`, and each argType has a `description` and a `table.defaultValue`. Every new input, slot or variant gets a story, because stories are what the design review looks at.
- **Tests:** a Jest spec sits next to the component. Change an existing assertion only for a stated reason; it describes behaviour consumers rely on.
- **Git:** linear `main`. Branches are named `feat/<major.minor>-<slug>` or `fix/<major.minor.patch>-<slug>`. Commit messages use Conventional Commits in English (`feat(hero): …`); the body says why, what changed and what was measured (widths, contrast, test counts). Release commits are `release: X.Y.Z — <summary>`, with an annotated tag `vX.Y.Z` and the message `vX.Y.Z – <summary>`. **Stage files by name, never `git add -A`**: the working tree often holds unrelated local files (`tools/infra/cdk-outputs.json`, drafts).
- **Changelog:** Keep a Changelog sections (Added, Changed, Fixed, Compatibility, Migration). Entries are written for consumers: what they can do now, why (the gap ID and the consumer's page), the measured values, and whether there is an API break.

## Releases

The version lives in `libs/angular-ui-kit/package.json`. Releases run only through `.github/workflows/publish-npm.yml`:

- **The normal path (release-manager):** push the release commit to `main`, then `gh workflow run publish-npm.yml --ref main -f version=X.Y.Z`. The *publish* job checks the version against `package.json`, the changelog section and the existing tags, runs the tests and the production build, and runs `npm stage publish` through npm trusted publishing (OIDC, with provenance). Only then does the *tag* job tag the commit `vX.Y.Z – <summary>`, so a failed run leaves no tag behind.
- **By hand:** pushing a tag `vX.Y.Z` runs the same publish job, without the tag job.

The staged version becomes public once it is approved with 2FA (`npm stage approve <id>`). A push to `main` also runs CI and `deploy-docs.yml` (Storybook and the MCP on `design.life-cockpit.de`). **Never run `npm publish` or `npm stage approve` locally, never push a release tag by hand from an agent, and never deploy the docs stack by hand.**

## Agent pipeline

A requirement, usually from a consuming project, goes through four agents (`.claude/agents/`). The skill `/lc-request` dispatches between them, but the agents choose the route themselves: each one ends its reply with a handoff that names the next agent and gives it a task.

| Agent | Role | Writes |
|---|---|---|
| `spec-writer` | Takes the requirement, checks what the kit already has, and makes it testable | `spec.md` |
| `ui-ux-designer` | Designs the API, anatomy, states, tokens and accessibility. After the build, reviews the stories in the browser | `design.md`, `review.md` |
| `web-developer` | Implements on a branch until all gates are green, and drafts the changelog entry | code, `build.md` |
| `release-manager` | Sets the version, writes the changelog, runs all gates and makes the release commit. When everything is green, without asking: pushes `main`, triggers the publish pipeline and watches it until the package is staged and the commit tagged | `release.md` |

- **Start:** `/lc-request <requirement or file> [--from <project>]` in this repository. From another project: `<path>/lc-design-system/scripts/lc-request.sh "<requirement>"` (headless; see `requests/README.md`). Release on its own: `/lc-release`.
- **Request folder** `requests/<NNN>-<slug>/` holds `request.md` (the requirement verbatim), `spec.md`, `design.md`, `build.md`, `review.md`, `release.md` and `log.md` (every handoff). The templates are in `requests/_templates/`.
- **Handoff:** every agent ends its reply with exactly this block:

  ```
  HANDOFF
  status: done | changes-requested | blocked | needs-owner
  next: spec-writer | ui-ux-designer | web-developer | release-manager | owner | none
  task: <one or two sentences: what the next agent should do; for owner, the questions as a numbered list with options, recommended first>
  reason: <one sentence: why this route>
  ```

  `next: owner` is only for decisions agents may not make: a breaking change (major version), a new runtime dependency, a scope or brand decision the requester's documents don't settle, and failures of the npm or GitHub infrastructure. Everything else the agents decide themselves and record as assumptions. `next: none` ends the request, either because it was released or because the kit already covers it and the requester has the answer.
- **No release gate:** a request whose review is approved and whose gates are all green is released by the `release-manager` without asking anyone. The npm stage still has to be approved with 2FA before the package is public.
