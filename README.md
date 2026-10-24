# Shikhte Chai website

Static site for [shikhtechai.com](https://shikhtechai.com), built with Astro. Bangla is the default language (`/`), English lives under `/en/`.

```
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs dist/
```

## Content

- `src/data/videos.json`: all videos (`id`, topic `cat`, Bangla `bn` and English `en` titles).
- `src/data/meta.json`: views, upload date, duration and description per video. Generated, don't edit by hand.
- `src/data/categories.ts`: topics, their shelf (`mental` or `science`), colours and icons.
- `src/data/curated.ts`: hand-picked home page lists (feelings, start path, popular).
- `src/i18n/ui.ts`: all interface text in both languages.
- `src/config.ts`: YouTube link, Facebook link, helpline. Empty values are hidden.
- `src/data/professionals.ts` and `supabase/migrations`: the directory's lists and database rules.
- `src/data/synonyms.ts`: groups of Bangla, English and Banglish words that search treats as the same thing. Add a group when people search for words that find nothing.

## Keeping videos up to date

`npm run sync-videos` reads the channel feed and each video page (no API key needed). It removes videos that are now private or deleted, adds new uploads with a guessed topic and `"review": true`, and refreshes views, dates, durations and descriptions. After running it, check new entries: confirm the topic, write the English title, then delete the `review` flag.

A GitHub Action (`.github/workflows/sync-videos.yml`) runs this every Monday and opens a pull request. Merging it publishes the update. You can also run it by hand from the repository's Actions tab. If your repository blocks Actions from opening pull requests, allow it under Settings, Actions, General, Workflow permissions.

## Live views and comments

Watch pages fetch the current view count and the latest comments straight from YouTube in the visitor's browser, so they are always up to date. This needs a free YouTube Data API key:

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable **YouTube Data API v3**.
2. Create an **API key**. Under restrictions, set *Websites* to `https://shikhtechai.com/*` (and `http://localhost:4321/*` for local work), and *API restrictions* to YouTube Data API v3 only. The key is visible in the page source, so these restrictions are what protect it.
3. Locally: put `PUBLIC_YOUTUBE_API_KEY=your-key` in `.env`. On GitHub: add the repository secret `PUBLIC_YOUTUBE_API_KEY`.

Without a key, watch pages show the build-time view count and a "read comments on YouTube" note. The free quota (10,000 units a day) covers roughly 5,000 watch-page visits a day; each visit uses 2 units, and results are cached in the browser for 5 minutes. Comments are shown as YouTube returns them and are not moderated by the site.

## Professionals directory

`/professionals/` is a searchable, filterable directory of psychiatrists, psychologists and counsellors. Professionals ask to be listed at `/professionals/join/`; you review every request at `/admin/` before anything becomes public. Listings are stored in a free [Supabase](https://supabase.com) project, because GitHub Pages cannot store data.

**Automatic setup (about 5 minutes, one time)**

1. Create a free Supabase project (choose a database password and keep it) and create an access token at <https://supabase.com/dashboard/account/tokens>.
2. Copy [supabase/setup.env.example](supabase/setup.env.example) to `supabase/setup.env` and fill in the token, the project ref, the database password and your admin email.
3. Run `npm run setup:supabase` (needs Node 22 or newer). It does everything else, and is safe to run again:
   - creates the tables, access rules and email triggers (the files in `supabase/migrations`, via the Supabase CLI);
   - creates your admin login (with a strong generated password, shown once) and adds it to the `admins` table;
   - turns off public sign-ups;
   - writes `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to your `.env`.
4. Add `-- --github` to also store those values as GitHub secrets (needs the `gh` CLI), otherwise add them yourself: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and for automatic database updates `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.

After that, changes to files in `supabase/migrations` are applied to the live database automatically when you push to `main` (`.github/workflows/supabase.yml`). If the CLI step ever fails, paste the migration files, in order, into the Supabase SQL Editor and run `npm run setup:supabase -- --skip-migrate`.

**Automatic emails (optional)**

Set `RESEND_API_KEY` and `EMAIL_FROM` in `supabase/setup.env` and run `npm run setup:supabase` again.
- **You** get an email when someone asks to be listed (at most 5 per 10 minutes, so a spam burst cannot flood your inbox).
- **The professional** gets a bilingual email when you approve or reject their request (a rejection includes the reason you typed). Replies go to you.
- Emails are sent by the database through [Resend](https://resend.com), after the change is saved, so an email problem can never block a submission or an approval. Nothing is sent until the key is set.
- Resend only sends to people other than your own account after you verify your domain (shikhtechai.com) in Resend by adding the DNS records it shows you. Until then use your own address as the test recipient. Resend's free plan has daily and monthly sending limits.
- The email key is stored in a database table that visitors and admins cannot read; only the setup script and the database's own functions can.

**How verification works**

- **Psychiatrists** are doctors and the only profession here with a statutory register (the Bangladesh Medical and Dental Council, BM&DC). They must give their BM&DC number. After you match it on the BM&DC register, set the listing to "BM&DC registration checked" and the card shows a badge.
- **Psychologists, counsellors, psychotherapists and others** have no statutory register or licence in Bangladesh, and the titles are not legally protected. They describe their training instead (university, degree, supervised practice hours, association). When you have seen certificates or confirmed with the institution, set "Training and credentials checked".
- Cards you have not checked say so, and visitors can filter to checked listings only. The database enforces that every request carries a BM&DC number or a training description, and visitors cannot set the badge themselves.
- This reflects Bangladesh's Mental Health Act 2018 and secondary sources (e.g. TherapyRoute's guides, reviewed 2026). The law can change, so confirm with the Bangladesh Association of Psychiatrists or a lawyer if you rely on it.

**Good to know**

- Supabase free projects pause after a week with no activity. Visiting the directory counts as activity, but check it if the site is quiet for a long time.
- Anyone can send a request, so expect some junk: reject or delete it from `/admin/`. A hidden trap field blocks simple bots. If spam grows, turn on Supabase's CAPTCHA protection.
- Without these settings the site still works: the directory says it opens soon and the join form is switched off.

## Message form

The form posts to [Web3Forms](https://web3forms.com), which emails the inbox you register. Nothing is stored on the site.

1. Create a free access key at web3forms.com using the inbox address.
2. Locally: put `PUBLIC_WEB3FORMS_KEY=your-key` in a `.env` file.
3. On GitHub: repository Settings, Secrets and variables, Actions, add the secret `PUBLIC_WEB3FORMS_KEY`.

Until a key is set, the form shows a "not switched on yet" notice instead of sending.

## Deploy (GitHub Pages)

1. Push to a GitHub repository on the `main` branch.
2. Settings, Pages, Source: **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push.
3. Settings, Pages, Custom domain: `shikhtechai.com` (the `public/CNAME` file already holds it), and enable Enforce HTTPS.
4. At your domain registrar, add DNS records:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www`: `<your-github-username>.github.io`
