---
name: project-kit-consumers
description: Known consumers of @lifecorner/angular-ui-kit and what they constrain (semver, CSP, prerender); check before calling a behaviour change minor
metadata:
  type: project
---

Known consumers (as of 2026-10-17):

- **life-os app (cockpit)**: Angular 22, prerendered static shell + hydration (`withNoIncrementalHydration`), strict CSP with Trusted Types (`trusted-types angular sw-registration`, plus `lc-icon` from kit 3.5), no Tabler assets served (inline icons only), budget 150 kB gzip initial JS. Pinned to the kit version it last adopted (3.3.1 at request 001).
- **life-os website**: prerendered, uses `lc-markdown` (legal pages), no Trusted Types directive found.
- **LC Factory**: external, not in the local workspace. Its prod incident (typo'd icon names, SPA index.html injected, CLS 0.66) drove 2.13.1's "fail loud in prod, never fetch unknown names". It used the old name `@life-cockpit/angular-ui-kit`, which stops at 3.2.x.

**Why:** semver calls ("is this a break for anyone?") and "unchanged defaults" ACs depend on who actually runs which configuration. Requesters sometimes describe a kit feature only by their own use, e.g. "ICON_NAMES is only a dev warning", while the changelog shows a deliberate guarantee for another consumer.

**How to apply:** before accepting a requester's proposed behaviour change, search CHANGELOG.md for the feature's history and check it against these consumers. Record the reasoning as an Assumption in the spec.

Related: [[reference-life-os-sources]]
