# Job Pipeline

A personal job-hunting dashboard. It pulls remote jobs from five public job
boards, scores each one against the kinds of work you do, and tracks every
application from shortlist to offer, with cover notes ready to copy.

No accounts, API keys or database: the job feed is built on the server, and
your pipeline is saved in your browser. Set it up for any career by editing
one file, `career.config.js`.

## What you get

- **Matches**: fresh remote jobs, best scores first, with a breakdown of why
  each one scored what it did.
- **Pipeline**: Saved → Applied → Interviewing → Offer / Rejected, with notes
  for each job.
- **Follow-ups**: a reminder and a ready-made message a set number of days
  after you apply.
- **Apply kit**: a cover note for each of your profiles, filled in with the
  company and job title, plus your details with copy buttons.
- **Startups to DM**: hiring Y Combinator startups ranked by how likely they
  are to need you (small team, recent batch, remote, your industries), with
  links to find the founders, a cold DM ready to copy, and follow-up tracking.
- **Backup**: export or import your whole pipeline as a JSON file.

## Quick start

You need [Node.js](https://nodejs.org) 18.17 or newer.

```bash
git clone <this repo>
cd <repo folder>
npm install
npm run dev        # open http://localhost:3000
```

It works straight away with the example setup, which looks for remote design
jobs. Then make it yours.

## Set it up for your career

Everything career-specific is in [`career.config.js`](career.config.js):

| Setting | What it does |
| --- | --- |
| `titles.include` / `titles.exclude` | Which job titles count at all. |
| `profiles` | The kinds of work you do. Each has title rules, skills and a cover note. Add as many as you like. |
| `penaliseTitles` | Titles that lose 10 points, such as roles more senior than you want. |
| `home` | Where you live. Jobs naming it get a boost; jobs naming only other places are hidden by default. |
| `sources` | What to search for on each job board. Use `[]` to switch a board off. |
| `kit` | Default details for the Apply kit. |
| `followUpDays` | Days after applying or sending a DM before the follow-up reminder appears. |
| `outreach` | The Startups tab: team size limit, industries and keywords to favour, and your cold DM and follow-up. Set `enabled: false` to hide it. |

For a different field, start from
[`examples/software-developer.config.js`](examples/software-developer.config.js).

**Keeping your details private.** Create `career.config.local.js` next to
`career.config.js`. When it exists, the app uses it instead, and it is
git-ignored. It can start from the shared config and change only what's yours:

```js
import base from "./career.config.js";

export default {
  ...base,
  home: { label: "Kenya", keywords: ["kenya", "nairobi", "africa", "emea"] },
  kit: { ...base.kit, name: "Your Name", portfolio: "https://your.site" },
};
```

Anyone using the app can also change the Apply kit in **Settings**. Those
changes are saved in their own browser.

Restart `npm run dev` after editing a config file.

## How scoring works

Each job is scored 0-100 against every profile and filed under its best one.

| Part | Points |
| --- | --- |
| Title matches a profile title rule | up to 50 (first matching rule) |
| Profile skills in the description | 5 each, up to 35 |
| Location | +15 names your home region, +12 worldwide, -25 names only other places |
| Freshness | +5 within 2 days, +2 within a week, -10 over a month |
| Title in `penaliseTitles` | -10 |

If `home` has no keywords, location only adds points for worldwide jobs and
nothing is hidden.

## Job boards

| Board | What `sources` takes |
| --- | --- |
| [Himalayas](https://himalayas.app) | search terms |
| [We Work Remotely](https://weworkremotely.com) | category feed names, e.g. `remote-design-jobs` |
| [Jobicy](https://jobicy.com) | `industries` and `tags` |
| [Remote OK](https://remoteok.com) | tags |
| [Remotive](https://remotive.com) | categories |

Responses are cached for an hour (six for Remote OK and Remotive), and every
job links back to its board, as the boards ask. Remotive's free API currently
ignores filters and returns only its latest few jobs.

## Startups to DM

The Startups tab lists active, hiring companies from the open
[Y Combinator directory](https://yc-oss.github.io/api/) (refreshed every six
hours), scored 0-100:

| Part | Points |
| --- | --- |
| Team size | +25 up to 10 people, +18 up to 25, +10 up to `maxTeamSize` |
| YC batch | +20 this year or last, +12 two years ago, +6 three |
| Location | +20 names your home region, +12 hires remotely |
| Industry in `outreach.industries` | +10 |
| `outreach.keywords` in the pitch or tags | 5 each, up to 20 |

Each startup links to its YC profile (which names the founders), a LinkedIn
and X search, and its website. The app never sends messages for you: copy the
DM, send it yourself, then click **Mark DM sent**.

## Deploy

Deploys to [Vercel](https://vercel.com) as a standard Next.js app:

```bash
npx vercel deploy --prod
```

Each visitor's pipeline stays in their own browser.

### Login (optional)

Without a login, anyone with the link can see the job feed and the default
Apply kit. To put it behind a sign-in screen, set these environment variables
(in Vercel: Project → Settings → Environment Variables, then redeploy):

| Variable | Value |
| --- | --- |
| `LOGIN_EMAIL` | the email to sign in with |
| `LOGIN_PASSWORD` | the password |
| `AUTH_SECRET` | a long random string, used to sign sessions |

Sessions last 30 days. Locally, put the same variables in `.env.local`
(git-ignored). Never put them in a config file.

## Project layout

| Path | What it does |
| --- | --- |
| `career.config.js` | Your career settings (see above). |
| `app/page.js` | Dashboard: stats, stages, filters. |
| `app/api/jobs/route.js` | The scored job feed. |
| `components/` | Job card, job view with Apply kit, Settings. |
| `lib/sources.js` | One fetcher per job board. |
| `lib/score.js` | Title filter, location check and scoring. |
| `lib/feed.js` | Fetch, filter, score, remove duplicates. |

## Limits

- Your pipeline lives in one browser. Export a backup in Settings to move it.
- Location checks read the posting's location text and can misjudge unusual
  wording. Read the posting before applying.
- Scoring is keyword-based: a first pass, not a judgement.
