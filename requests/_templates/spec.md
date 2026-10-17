# Spec <NNN>: <title>

- **Status:** draft | ready | resolved (already in the kit)
- **Type:** new component | extension of `lc-…` | token / global style | bug fix | docs only
- **Affected:** <components, files>
- **Semver impact:** patch | minor | major — <reason>

## Need

<The page or screen in the consuming project, what fails today (width, language, measured), and what the requester tried. The problem, not the proposed solution.>

## What the kit has today

<The existing components, inputs, slots, hooks and tokens that come close, and why they don't suffice (or do: then *Resolution*).>

## Scope

- In: …
- Not in (non-goals): …

## Acceptance criteria

| ID | Criterion (observable) | Verified by |
|---|---|---|
| AC-1 | … | unit test / story + width + measurement / contrast / prerendered HTML |

Always covered unless not applicable: 360 px and desktop widths · light and dark · keyboard and screen reader · EN and DE lengths · prerendered HTML before JavaScript · unchanged defaults.

## Constraints

- Peer range `^21.0.0 || ^22.0.0` unchanged, no new runtime dependency, no API break (unless major and decided by the owner).

## Assumptions

- Assumption: …

## Open questions

<Only questions whose answer changes what gets built: options, recommended first. Empty when none.>

## Resolution

<Only when the kit already covers it: how to use it, with a snippet.>
