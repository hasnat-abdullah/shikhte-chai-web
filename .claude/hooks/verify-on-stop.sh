#!/bin/bash
# Stop hook: before an agent says it is done, build the site and run the checks if any source file changed.
# Exit code 2 sends the errors back to the agent so it fixes them instead of stopping.
input=$(cat)
# Already sent back once in this turn: let it stop, to avoid an endless loop.
if echo "$input" | grep -q '"stop_hook_active": *true'; then exit 0; fi
cd "$CLAUDE_PROJECT_DIR" || exit 0
changed=$(git status --porcelain -- src public integrations astro.config.mjs scripts package.json 2>/dev/null)
[ -z "$changed" ] && exit 0
out=$(npm run --silent verify 2>&1)
if [ $? -ne 0 ]; then
  echo "npm run verify failed. Fix these before finishing:" >&2
  echo "$out" | grep -E "ERROR|error|Error" | head -30 >&2
  exit 2
fi
exit 0
