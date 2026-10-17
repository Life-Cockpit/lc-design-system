---
name: release-pitfalls
description: Durable facts for running a kit release (pack contents, shell limits, gate shortcuts)
metadata:
  type: project
---

- Since 3.5.0 `npm pack` has about 370 files (one FESM, map and types per entry; 3.4.1 had 36). Unpacked 5.3 MB, packed 1.1 MB. The five `src/styles/*.spec.ts` files are packed on purpose-by-accident since before 3.4.1 (assets glob `src/styles/**/*`); don't flag them as new.
- Production build takes about 55 s (3.5.0, 113 entries).
- Shell: compound commands (`a && python3 ...`, `;` chains with scripts) can hit an approval prompt in headless runs. Use Edit for changelog and version, and run one command per Bash call.
- Code-changed check: `git diff --quiet <build commit> -- libs tools` also fails for `tools/agents/*` changes (screenshot helpers). Those are not in the package or any gate; say so in release.md instead of rerunning the compat matrix.
- The changelog draft sits in build.md as a fenced block; replace the `2026-10-XX` date with the release day.
- 3.6.0: pack 382 files, 1.1 MB packed, 5.5 MB unpacked; production build rerun took ~10 s with nx cache. Bash approval prompts also fire for `;` chains with `sed -i` or `git show`/`git log` after greps: one command per call, Write/Edit for files.
- 3.5.1: publish run ~3 min, CI ~5 min. CI Angular 22 job steps "Check the /tt pages under a Trusted Types CSP" and "Check the secondary entries" now pass (Chrome needs --no-sandbox when CI is set). `git rev-list`/`show-ref` on tags and `gh api` can hit approval prompts headless; check the tag job result via `gh run view --json jobs`.
