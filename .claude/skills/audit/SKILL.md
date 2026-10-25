---
name: audit
description: Full quality audit of the Shikhte Chai site - build, static SEO/security checks, real-browser checks at 360-1440px and Lighthouse on the key pages - with a short report. Use when the user asks to audit, check scores, check speed/SEO/accessibility, or before a release.
---

# Audit the site

1. `npm run verify`. If it fails, report the errors and stop: the rest is meaningless on a broken build.
2. `npm run audit` (takes 2–4 minutes; Lighthouse downloads through npx on the first run).
3. Read `.audit/report.json` for details of anything that failed or scored below 100.
4. If the user asked for a deeper review, run the `ux-reviewer`, `seo-auditor` and `security-reviewer` subagents in parallel, each on its own area.

Report to the user:
- The Lighthouse table (page, performance, accessibility, best practices, SEO, LCP, CLS).
- Each failure in one line: what a visitor experiences, and the file to fix.
- Anything that cannot be fixed in code (for example GitHub Pages' fixed 10-minute cache), said once.

Do not change files during an audit unless the user asks you to fix what you found.
