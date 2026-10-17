---
name: lc-release
description: Releases @lifecorner/angular-ui-kit with the release-manager agent, without the rest of the pipeline. It sets the version, writes the changelog, runs every gate and makes the release commit; when everything is green, it pushes main and triggers the publish pipeline, which stages the package on npm and tags the commit. Use "/lc-release <NNN>" for a request whose review passed, "/lc-release" for changes made outside the pipeline (the current branch since the last tag), and "/lc-release --verify X.Y.Z" to check that a version is public.
argument-hint: [<NNN> | --verify <X.Y.Z>]
disable-model-invocation: true
---

# Releasing the kit

Arguments: `$ARGUMENTS`

- **`--verify X.Y.Z`:** call `release-manager` with the task "Verify that X.Y.Z is public with provenance". Report what it finds.
- **`<NNN>`:** the request `requests/<NNN>-*/`. Switch to its branch (named in `build.md`). Its `review.md` must have no open `must-fix`; if it has one, stop and say so.
- **Nothing:** the scope is the current branch since the last tag (`git log <last tag>..HEAD`). If that is empty, there is nothing to release.

Call `release-manager` (Agent tool, foreground) with the request folder or the scope and the task "Release it". It needs no go: when the gates are green, it ships. Its handoff:

- `next: none`: report the version, the tag, the pipeline runs, and the stage ID. The package is public once the stage is approved with 2FA (`npm stage approve <id>`), and `/lc-release --verify X.Y.Z` checks it afterwards.
- `next: web-developer`: a gate failed. With a request, continue with `/lc-request --resume <NNN>`. Without one, show the failure and stop.
- `next: owner`: ask with AskUserQuestion, then give the answer back to `release-manager`.

With a request, also append each handoff to its `log.md`, as `/lc-request` does.
