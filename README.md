# The Progress Club — Lyla Schilling's platform

Marketing site + members' training room + Lyla's HQ, one Next.js repo.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind (brand tokens) · framer-motion + Lenis · Drizzle ORM
- **Database:** Ryder's Neon Postgres (project "Lyla's website", db `neondb`) over the serverless HTTPS driver
- **Auth:** email/password with bcrypt + signed HTTP-only JWT cookies (no third-party auth service). Lyla creates every login in HQ.
- **Fonts:** Fraunces + Manrope + Fragment Mono, **self-hosted** via fontsource (first-party, `font-display: swap`). Same families as the Google Fonts spec, minus the third-party request.
- **AI coach:** `/api/coach` → Claude (streaming), locked to today's workout, Lyla's voice + guardrails.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run db:migrate           # already applied to the live DB — safe to re-run
npm run db:seed              # already seeded — skips itself if data exists
npm run dev                  # http://localhost:3000
```

`.env.local` (the one in this folder already has real values):

| Var | What |
| --- | --- |
| `DATABASE_URL` | Neon connection string (Neon console → Connect). Already filled in. |
| `AUTH_SECRET` | Random string sessions are signed with. Already generated. Rotate it and everyone gets logged out (harmless). |
| `ANTHROPIC_API_KEY` | **← PASTE HERE to turn the AI coach on.** console.anthropic.com → API keys. Until then the coach shows a warm "message Lyla instead" state — nothing breaks. |
| `COACH_MODEL` | Leave as-is unless you have a reason. |

## Logins (seeded — change these)

| Who | Email | Password | Lands on |
| --- | --- | --- | --- |
| Lyla (admin) | `lyla@lylaschilling.com` | `sunrise-2026` | `/hq` |
| Test client | `brooklyn@progress.club` | `progress-2026` | `/club` |
| Test client | `ezra@progress.club` | `progress-2026` | `/club` |

Change Lyla's password on first login: **Club → Account → Change password** (admins can use the club too). Deactivate or delete the two test clients from **HQ → Clients** before real launch.

## How Lyla runs it (the 3-minute tour)

1. **Someone Venmos her** → HQ → **Clients** → Create client login (GENERATE makes a friendly password) → **Copy welcome text** → send it to them. Done — that's onboarding.
2. **Workouts** → HQ → **Workout builder**. Rows that share a group label become a superset (A1/A2). Attach a demo video per movement. Pick launch date + time (defaults tomorrow 5:00 AM CT) → **Schedule**. It drops itself.
3. **Launch calendar** shows the month — dot = a drop, tap an empty day to build that day's workout. Build Sundays, coast all week.
4. **This week** dashboard: show-up %, streaks, fading flags (no check-in 3+ days → coral CHECK IN chip → jumps to messages).
5. **Reviews inbox** + **Messages**: the feedback loop. Contact-form messages from non-members show in their own thread (reply by email).
6. **The Locker**: add/edit referral codes — they're live on the public page instantly. The 4 seeded codes are **samples — replace with her real ones.**

## Photos + reels (zero-code drop-in)

Drop files into `public/photos/` with the exact names in `public/photos/README.md`
(`hero-main.jpg`, `about-01..03`, `club-01..04`, `locker-01..06`, `reel-01..20.mp4` + `reel-XX-poster.jpg`).
Every page picks them up automatically; until then styled placeholders hold each slot.
Crop baked-in letterbox bars off IG downloads first (`ffmpeg cropdetect`) or tiles will show black bars.

## Things to swap before launch

- **Venmo handle:** `@LylaSchilling` is a placeholder in `src/app/(marketing)/the-club/page.tsx` (link + button). Put her real handle in.
- **Instagram/email links:** footer + contact page use `instagram.com/lyla_schilling` and `hello@lylaschilling.com` — confirm both.
- **Testimonials:** the 3 on Home are placeholders written in-voice — swap in real ones as founders land.
- **Free-week emails:** captures write to the `leads` table (see HQ dashboard "THE LIST"). Actually *sending* the 7 workouts needs an email tool later — list is safe in the meantime.

## Architecture map

- `(marketing)` — `/` home, `/watch`, `/locker`, `/the-club` (pitch + live demo room), `/contact`, `/login`
- `(club)` — dark Focus Mode, session required: `/club` today's WOD + timer + AI coach, `/club/past`, `/club/progress`, `/club/messages`, `/club/review`, `/club/locker`, `/club/account`
- `(hq)` — admin only: `/hq` analytics, `/hq/clients`, `/hq/builder`, `/hq/calendar`, `/hq/reviews`, `/hq/messages`, `/hq/locker`
- API: `/api/coach` (streaming AI), `/api/upload` (admin media)
- Tables: `users, workouts, movements, completions, reviews, messages, referral_codes, leads` (`drizzle/0000_init.sql`)
- "Today's WOD" = latest published workout with `launch_at <= now()`. Streaks = consecutive **America/Chicago** days with a completion (unfinished today doesn't break it until midnight CT).

## Deploy notes (when Ryder says go)

- Vercel works: set the three env vars, framework auto-detects. All pages are dynamic (DB-backed).
- **Uploads caveat:** `/api/upload` writes to local disk (`public/uploads/`) — fine on a normal server, **not persistent on Vercel serverless**. Swap the write in `src/app/api/upload/route.ts` for Vercel Blob (~20 lines, the seam is isolated). Movement media URLs in the DB stay valid either way.
- Domains per brand plan: `lylaschilling.com` (+ `club.` subdomain can just route to `/club`).

## Dev utilities

- `npm run db:migrate` / `npm run db:seed` — idempotent.
- `node scripts/screenshot.mjs` — full-site screenshot pass (needs Playwright Chromium + the dev server running).
- `scripts/make_icons.py` — regenerates PWA icons (4× render + Lanczos, solid backgrounds).
