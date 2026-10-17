# Requests

Every requirement for the kit that goes through the agent pipeline gets a folder `<NNN>-<slug>/` here: the requirement verbatim, then the spec, design, build report, review, release notes and a log of every handoff between the agents. How the pipeline works is described in [CLAUDE.md → Agent pipeline](../CLAUDE.md#agent-pipeline); the templates are in [`_templates/`](_templates/).

## Starting a request from another project

**One-time setup:** run `claude` once interactively in this repository and accept the trust dialog. Until then, Claude Code ignores the allow rules in `.claude/settings.json` in headless runs, and the pipeline stops at the first gate. The `gh` CLI must be logged in (`gh auth status`); to read the stage ID, `npm` must be too.

From the consuming project's directory, or from its Claude Code session through Bash:

```sh
# The requirement as text (the calling directory is readable for the run, so relative paths work)
../lc-design-system/scripts/lc-request.sh "lc-hero needs a media slot beside the text from 1024 px (G-13, see docs/ux/concepts/website-v0.md)"

# The requirement in a file, narrowed to one gap
../lc-design-system/scripts/lc-request.sh --file docs/ux/concepts/website-v0.md "G-13 only"

# Continue a request that stopped for the owner's answers
../lc-design-system/scripts/lc-request.sh --resume 004 "1: option A. 2: yes, as a major release."
```

The script runs Claude Code headless in this repository (`claude -p "/lc-request …"`). Its output is the pipeline's final message: the released version and how to use it, or the questions the owner has to answer. The requester is the name of the calling directory; `--from <name>` overrides it.

Nobody has to approve the release: once the review is approved and every gate is green, the release manager pushes `main` and triggers the publish pipeline, which stages the package on npm and tags the commit. The package is public once the npm stage is approved with 2FA. The pipeline stops for the owner only for decisions agents may not make: a breaking change, a new runtime dependency, an npm or GitHub failure.

Interactively, in this repository: `/lc-request <requirement or path> [--from <project>]`.

### For a consuming project's CLAUDE.md

> **Design-system gaps** are closed in the kit, never rebuilt locally: run `../lc-design-system/scripts/lc-request.sh --file <concept file> "<gap ID>: <what is missing>"`. The pipeline answers with the kit version that closes it, or with questions for the owner.

## Index

| Request | From | Gap IDs | Status | Version |
|---|---|---|---|---|
| [001](001-f1-app-shell-gaps/) F1 app-shell gaps | life-os | AS-12, AS-14, AS-15, AS-16 (AS-13 optional) | 3.5.1 | 3.5.1 |
| [002](002-f1-bundle-size-gaps/) F1 bundle-size and link-cue gaps | life-os | AS-17, AS-18, AS-19 | 3.6.0 | 3.6.0 |
| [003](003-code-block-trusted-types/) lc-code-block under Trusted Types | life-os | AS-20 | 3.6.1 | 3.6.1 |
| [004](004-code-block-scroll-region/) lc-code-block scroll region | life-os | AS-21 | 3.7.0 | |
