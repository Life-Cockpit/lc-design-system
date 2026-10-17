#!/usr/bin/env bash
# Starts the design-system agent pipeline (/lc-request) headless from any directory,
# typically from a consuming project or its Claude Code session:
#
#   ../lc-design-system/scripts/lc-request.sh "lc-hero needs a media slot (G-13), see docs/ux/concepts/website-v0.md"
#   ../lc-design-system/scripts/lc-request.sh --file docs/ux/gaps/g-40.md
#   ../lc-design-system/scripts/lc-request.sh --resume 004 "1: option A. 2: yes."
#
# Options:
#   --file <path>     the requirement is in this file (relative to the calling directory)
#   --from <name>     the requesting project (default: the calling directory's name)
#   --resume <NNN>    continue an open request; text after it answers its questions
#   --budget <usd>    stop the run at this estimated cost
#
# A request that passes review and every gate is released through the publish pipeline
# without asking; the npm stage still needs the owner's 2FA approval to become public.
# The calling directory is readable for the run (--add-dir), so referenced files resolve.
# Output: the pipeline's final message (released version and usage, or open questions).
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CALLER="$PWD"
from=""
file=""
resume=""
budget=""
text=()

while [ $# -gt 0 ]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    --from) from="$2"; shift 2 ;;
    --resume) resume="$2"; shift 2 ;;
    --budget) budget="$2"; shift 2 ;;
    -h | --help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) text+=("$1"); shift ;;
  esac
done

command -v claude >/dev/null || { echo "lc-request: Claude Code (claude) is not installed" >&2; exit 1; }

if [ -z "$from" ]; then
  if [ "$CALLER" = "$REPO" ] || [[ "$CALLER" == "$REPO"/* ]]; then from="owner"; else from="$(basename "$CALLER")"; fi
fi

if [ -n "$resume" ]; then
  args="--resume $resume"
  [ ${#text[@]} -gt 0 ] && args="$args ${text[*]}"
elif [ -n "$file" ]; then
  [ -r "$CALLER/$file" ] || [ -r "$file" ] || { echo "lc-request: cannot read $file" >&2; exit 1; }
  path="$(cd "$CALLER" && cd "$(dirname "$file")" && pwd)/$(basename "$file")"
  args="$path --from $from"
  [ ${#text[@]} -gt 0 ] && args="$args ${text[*]}"
elif [ ${#text[@]} -gt 0 ]; then
  args="${text[*]} --from $from"
else
  echo "lc-request: pass a requirement, --file <path> or --resume <NNN> (see --help)" >&2
  exit 1
fi
args="$args --headless"

# The Bash rules (gates, git, the push of main, the publish pipeline) come from .claude/settings.json.
allowed=(Read Grep Glob Edit Write Agent SendMessage)

flags=(-p "/lc-request $args" --permission-mode acceptEdits --allowedTools "${allowed[@]}")
[ "$CALLER" != "$REPO" ] && flags+=(--add-dir "$CALLER")
[ -n "$budget" ] && flags+=(--max-budget-usd "$budget")

cd "$REPO"
exec claude "${flags[@]}"
