# Cricket Score

A mobile-first web app for live T20 cricket scoring. Create a match, share the link with spectators, and score ball-by-ball with a scorer PIN. Viewers see the scoreboard update every ~2 seconds; the scorer can work offline and sync deliveries when back online.

## Features

- **One scorer, many viewers** — shared match URL; PIN unlocks ball-by-ball scoring
- **Standard T20 scorecard** — runs, wickets, overs, run rate, batsmen, bowler, fall of wickets
- **Innings break & match result** — start 2nd innings with opening lineup; automatic result when chase completes
- **Offline scoring** — deliveries queue locally and sync on reconnect
- **Undo** — reverse the last recorded ball

## Prerequisites

- Node.js 20+

For production deploys, a [Neon](https://neon.tech) PostgreSQL database is optional — **local dev uses SQLite by default** with zero external services.

## Local setup (SQLite — default)

No database account or `.env.local` required.

```bash
npm install   # or: pnpm install
npm run dev   # or: pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). On first API call, the app creates `./data/cricket-score.db` and applies migrations automatically.

Optional overrides in `.env.local`:

```env
DB_DRIVER=sqlite
SQLITE_PATH=./data/cricket-score.db
```

### Manual SQLite migrations (optional)

```bash
npm run db:migrate:local
npm run db:studio:local
```

## Local setup (Neon Postgres — optional)

Use this if you want to mirror production locally.

### 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string.

### 2. Configure environment

Create `.env.local`:

```env
DB_DRIVER=postgres
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 3. Migrate and run

```bash
npm install
npm run db:migrate:prod
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. In the Vercel project, go to **Storage** → **Connect Database** → choose **Neon** (or add `DATABASE_URL` manually under **Settings → Environment Variables**).
3. Set `DB_DRIVER=postgres` and `DATABASE_URL` for Production (and Preview if you use preview deploys).
4. Deploy. After the first deploy, run migrations against the production database:

   ```bash
   npm run db:migrate:prod
   ```

5. Visit your Vercel URL and create a test match.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run db:migrate:local` | Apply SQLite migrations (`./data/cricket-score.db`) |
| `npm run db:migrate:prod` | Apply Postgres migrations (Neon) |
| `npm run db:generate:local` | Generate SQLite migrations after schema changes |
| `npm run db:studio:local` | Open Drizzle Studio for local SQLite |

## Manual QA checklist

- [ ] Create match on phone browser
- [ ] Copy share link → open on second phone → see live updates
- [ ] Unlock scorer with PIN → score a full over
- [ ] Toggle airplane mode → score 3 balls → reconnect → verify sync
- [ ] Undo last ball
- [ ] Complete innings 1 → start innings 2 → complete match

## Tech stack

- **Next.js** (App Router) on **Vercel**
- **SQLite** (local default) or **Neon** PostgreSQL (production) with **Drizzle ORM**
- Event-sourced ball log; live score derived in application code
