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
