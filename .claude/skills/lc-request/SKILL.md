---
name: lc-request
description: Runs a requirement for the LifeCorner Design System through the agent pipeline (spec-writer → ui-ux-designer → web-developer → design review → release-manager) until the new version is released through the publish pipeline. The agents route among themselves through their handoffs, and nobody has to approve the release. Use when a consuming project (life-os, lc-apps, …) or the owner asks for a component, input, slot, token, fix or gap (G-xx) in @lifecorner/angular-ui-kit. Resume an open request with --resume <NNN>.
argument-hint: <requirement text | path to a file> [--from <project>] [--headless] | --resume <NNN> [answers]
---

# Running a request through the pipeline

You (the main session) are the dispatcher. The agents decide the route: each one ends with a HANDOFF block (format in `CLAUDE.md` → *Agent pipeline*) that names the next agent and its task. You carry out these handoffs and keep the log. Don't do the agents' work yourself, and don't rewrite their tasks. Pass them on. The release needs nobody's go: once the review is approved and every gate is green, the `release-manager` ships it through the pipeline.

Arguments: `$ARGUMENTS`

- `--from <project>`: the requester. Without it: the name of the directory a file path points into, else `owner`.
- `--headless`: nobody can answer questions (started by `scripts/lc-request.sh`). An owner question ends the run instead of asking.
- `--resume <NNN>`: continue `requests/<NNN>-*/` from the last handoff in its `log.md`. Skip step 1; switch to the request's branch (named in `build.md`) if it already has one. Any text after the number is the owner's answer to the open questions: record it under *Owner decisions* in `log.md` and pass it on.
- Everything else is the requirement. If it starts with a path to a readable file, the file is the requirement, and the path is recorded; text after the path narrows it (for example "G-13 only" for a concept with many gaps).

## 1. Start

1. **Working tree:** run `git status --short --branch`. Uncommitted changes in `libs/` or `tools/` are someone's work in progress: stop and ask (headless: stop with status `blocked`). The exception is `tools/infra/cdk-outputs.json`, a deploy artefact. Leave alone the folders of other open requests in `requests/` (they wait for the owner) and other local files such as drafts in the root. Switch to `main`, `git fetch origin`, and if `main` is behind, `git merge --ff-only origin/main`.
2. **Folder:** the next number is the highest `requests/NNN-*` plus 1, three digits. The slug is two to five kebab-case words from the requirement. Create `requests/<NNN>-<slug>/request.md` from `requests/_templates/request.md`: the requirement **verbatim**, the requester, the date, referenced files as absolute paths, and the gap IDs.
3. **Register it:** add a row to `requests/README.md` (status `new`), and start `log.md` from `requests/_templates/log.md`.

## 2. Dispatch loop

Start with `next: spec-writer`, task "Write the spec for this request". Then repeat:

1. **Call the agent** named in `next` with the Agent tool (`subagent_type` = that name), in the foreground. Each step builds on the one before. The prompt:

   ```
   Request: requests/<NNN>-<slug>/ (read request.md first, then what your role needs).
   Mode: <design | review — only for ui-ux-designer>
   Task: <the task from the last handoff, verbatim>
   From: <previous agent> — <its reason>
   Owner decisions: <from log.md, or "none">
   End your reply with the HANDOFF block from CLAUDE.md.
   ```

   The mode for `ui-ux-designer` is `review` once `build.md` exists and the handoff comes from `web-developer`; otherwise it is `design`.
2. **Read the HANDOFF.** If it is missing or incomplete, ask the same agent for it with SendMessage instead of guessing.
3. **Log it:** append a row to `log.md` (time, from → to, status, reason, task) and update the status in `requests/README.md` (`spec`, `design`, `build`, `review`, `release`, `needs-owner`, the version, `answered`).
4. **Route:**
   - `next: <agent>` → the next iteration.
   - `next: owner`: only for decisions agents may not make (a breaking change, a new runtime dependency, an infrastructure or npm failure in the pipeline). Ask them with AskUserQuestion (the agent's options, recommended first), write the answers under *Owner decisions* in `log.md`, and give them to the agent that asked, as its next task. In headless mode, stop with status `needs-owner`.
   - `next: none` → finish (step 3).
5. **Loop guard:** if two agents hand back and forth more than three times on the same point, or a request reaches 15 handoffs, stop and put the disagreement in front of the owner as a question. Never break a tie yourself.

## 3. Finish

Your final message is what the requester receives. In headless runs it is all the calling project gets, so it must stand on its own:

- **Released:** the version and its tag, the closed gap IDs, what the requester can use now (from *For the requester* in `release.md`: the install line, a snippet, the story IDs), and the pipeline results. Say that the package is public once the npm stage is approved with 2FA, and give the stage ID.
- **Already in the kit** (`next: none` from the spec): the resolution from `spec.md`, with a snippet.
- **Stopped** (`needs-owner`, `blocked`): the reason, the open questions with options, and the exact continuation: `/lc-request --resume <NNN> <answers>` in this repository, or `scripts/lc-request.sh --resume <NNN> "<answers>"` from outside.

Always name the folder `requests/<NNN>-<slug>/`. Don't paste the documents themselves.
