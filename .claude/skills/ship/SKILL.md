---
name: ship
description: Verify the current changes and open a pull request for them (never pushes to main). Use when the user asks to ship, publish, release, or open a PR for the work.
---

# Ship changes

Pushing to `main` deploys the website and applies database migrations, so changes always go through a pull request
that CI checks (build, `check-site`, npm audit, browser audit and Lighthouse).

1. `git status` and `git diff --stat`. Show the user what will be included; leave out anything unrelated or generated (`dist/`, `.audit/`).
2. `npm run verify` must pass. If layout, CSS, scripts or images changed, `npm run audit` must pass too.
3. If `supabase/migrations/` changed, tell the user in plain words what the migration does to the live database once merged, and get a yes before continuing.
4. Create a branch named for the change (`git switch -c <type>/<short-name>`), commit with a clear message, and push the branch (ask the user: pushing is not pre-approved).
5. `gh pr create` with a summary of what changed for visitors, the Lighthouse table, and anything the reviewer must check by hand.
6. Give the user the PR link. Do not merge it.
