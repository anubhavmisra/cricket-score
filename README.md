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
- A [Neon](https://neon.tech) PostgreSQL database

## Local setup

### 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string (pooled or direct works).

### 2. Configure environment

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 3. Install dependencies and migrate

```bash
npm install
npm run db:migrate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a match at `/matches/new`, then open the share link (`/m/[id]`) on another device to watch live updates.

## Deploy to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. In the Vercel project, go to **Storage** → **Connect Database** → choose **Neon** (or add `DATABASE_URL` manually under **Settings → Environment Variables**).
3. Set `DATABASE_URL` for Production (and Preview if you use preview deploys).
4. Deploy. After the first deploy, run migrations against the production database:

   ```bash
   DATABASE_URL="your-production-url" npm run db:migrate
   ```

   Or use Neon's SQL console / CI to apply migrations from the `drizzle/` folder.

5. Visit your Vercel URL and create a test match.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:generate` | Generate migrations after schema changes |
| `npm run db:studio` | Open Drizzle Studio |

## Manual QA checklist

- [ ] Create match on phone browser
- [ ] Copy share link → open on second phone → see live updates
- [ ] Unlock scorer with PIN → score a full over
- [ ] Toggle airplane mode → score 3 balls → reconnect → verify sync
- [ ] Undo last ball
- [ ] Complete innings 1 → start innings 2 → complete match

## Tech stack

- **Next.js** (App Router) on **Vercel**
- **Neon** PostgreSQL with **Drizzle ORM**
- Event-sourced ball log; live score derived in application code
