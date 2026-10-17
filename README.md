# LifeCorner Design System

A standalone Angular component library (`@lifecorner/angular-ui-kit`, formerly `@life-cockpit/angular-ui-kit`) with 110 accessible, themeable components built with Angular 22 (apps on Angular 21 and 22 are supported), TailwindCSS, and design tokens.

Docs and Storybook: https://design.life-cockpit.de (MCP endpoint `/mcp`). The site moves to `design.lifecorner.de` once the owner registers `lifecorner.de`; until then the domain and the CDK stack keep the old name.

## Structure

| Project | Path | Description |
|---------|------|-------------|
| `ui-kit` | `libs/angular-ui-kit/` | Publishable Angular component library |

## Quick Start

```sh
npm install

# Start Storybook
npx nx storybook angular-ui-kit

# Build the library for publishing
npx nx build angular-ui-kit
```

## Components

accordion, accordion-group, alert, app-page, app-shell, area-chart, avatar, avatar-group, badge, bar-chart, bottom-nav, breadcrumbs, button, button-link (`a[lcButton]`), calendar, callout, card, chat, checkbox, chip, choice-prompt, code-block, color-picker, combobox, confirm-dialog, container, copy-field, date-range-picker, datepicker, dependency-viewer, description-list, diff-viewer, divider, document-viewer, donut-chart, drawer, email-input, empty-state, error-display, field-group, file-upload, filter-bar, footer, funnel-chart, gallery, gantt-chart, gauge, header, heatmap, hero, icon, input, kanban-board, line-chart, list, log-viewer, logo, markdown, menu, modal, next-step-card, notification-center, number-input, page-header, page-layout, pagination, password-input, pie-chart, pipeline, popover, progress-bar, progress-ring, provider-button, radar-chart, radio, radio-group, rating, rich-text-editor, scatter-plot, search-input, section, select, sidenav, skeleton, slider, spacer, sparkline, spinner, split-pane, stack, stacked-bar-chart, stage-list, stat-trend, status-dot, stepper, switch, tab, table, tabs, tag-input, textarea, timeline, toast, toast-outlet, toggle-group, toolbar, tooltip, tree-view, typography, verification-code-input, waterfall-chart

New in 3.3: app-shell, app-page, bottom-nav, provider-button, radio-group, copy-field. Plus theme (`ThemeService`), design tokens and global classes (`.lc-horizon`, `.lc-display`, `.lc-title`, `.lc-overline`).

## Design Tokens

Design tokens are managed via [Style Dictionary](https://amzn.github.io/style-dictionary/) and generate both TypeScript constants and SCSS variables from `libs/angular-ui-kit/tokens.json`.

```sh
cd libs/angular-ui-kit && npx style-dictionary build
```

## Requesting a change (agent pipeline)

A consuming project hands a requirement or gap to four Claude Code agents in this repository: spec, UI/UX design, development, release. They take it all the way to a staged npm release:

```sh
../lc-design-system/scripts/lc-request.sh "lc-hero needs a media slot beside the text (G-13)"
```

In this repository: `/lc-request <requirement>`. How it works: [CLAUDE.md](CLAUDE.md#agent-pipeline) and [requests/](requests/README.md).

## Publishing

Releases go through `.github/workflows/publish-npm.yml`. It tests, builds and **stages** the package with npm trusted publishing (OIDC, no npm token, with provenance). There are two ways to start it:

- `gh workflow run publish-npm.yml --ref main -f version=<version>`, after the release commit is on `main`. The workflow tags the commit `v<version>` once staging succeeded. The `release-manager` agent uses this path (see [CLAUDE.md](CLAUDE.md#agent-pipeline)).
- Pushing a tag `v<version>` by hand.

In both cases `<version>` is the version in `libs/angular-ui-kit/package.json`. It becomes public only after a maintainer approves it with 2FA:

```sh
npm stage list @lifecorner/angular-ui-kit
npm stage approve <stage-id>   # asks for 2FA
```

## Tech Stack

- **Angular** 22 (standalone components, signals, OnPush); peer range `^21.0.0 || ^22.0.0`
- **TailwindCSS** 3.4 with custom theme
- **Nx** 23 monorepo tooling (Node.js 24)
- **ng-packagr** for library builds

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app <app-name>
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
