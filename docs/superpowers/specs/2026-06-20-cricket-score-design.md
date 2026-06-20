# Cricket Score — Design Spec

**Date:** 2026-06-20  
**Status:** Approved (pending final spec review)

## Summary

A mobile web app for scoring T20 cricket matches on the field. One designated scorer records ball-by-ball events on their phone (works offline); everyone else opens a shared link to watch the live scorecard. No user accounts — a PIN unlocks scoring on the shared match URL.

## Requirements

| Decision | Choice |
|---|---|
| Collaboration | One scorer; all others view-only |
| Scorecard depth | Standard — ball-by-ball, extras, fall of wickets, basic batsman/bowler stats |
| Join method | Single shared URL |
| Offline | Scorer works offline; syncs when online; viewers update when scorer has signal |
| Platform | Mobile web (browser, no app store) |
| Format | T20 only — 20 overs, 11 players per team |
| Auth | No accounts |
| Access control | One link; view-only by default; scorer unlocks with PIN set at creation |
| Scoring UI | Ball-by-ball tap buttons |
| Deployment | Next.js on Vercel + Neon Postgres |

## Architecture

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Scorer phone   │ ──────────────▶│  Next.js (Vercel)│
│  (offline OK)   │◀────────────── │  API routes      │
└────────┬────────┘                └────────┬─────────┘
         │ IndexedDB                         │
         │ (offline queue)                   │ SQL
         │                                   ▼
┌─────────────────┐                ┌──────────────────┐
│  Viewer phones  │ ── poll 2s ──▶│  Neon Postgres   │
│  (read-only)    │◀────────────── │                  │
└─────────────────┘                └──────────────────┘
```

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js App Router, mobile-first | Native Vercel deployment |
| Database | Neon Postgres (Vercel integration) | User preference; relational model fits scorecard |
| ORM | Drizzle | Lightweight; works with Neon serverless driver |
| Offline (scorer) | IndexedDB queue on device | Buffer events locally; flush to API when online |
| Live updates (viewers) | Poll `GET /api/matches/[id]` every ~2s | Reliable on Vercel serverless; 2s latency acceptable for cricket |
| Scorer auth | PIN hash in Neon; unlock via HTTP-only session cookie | No accounts; link stays view-only until PIN entered |

### Core flows

1. Scorer creates match → shareable URL + PIN → match row in Neon
2. Scorer taps balls → events saved to IndexedDB → synced to Neon when online
3. Viewers open same URL → live scorecard polling every ~2s
4. Score derived from append-only ball events (idempotent via `client_event_id`)

## Screens & User Flows

### Screen map

```
Home                    Match Setup              Live Match (shared URL)
┌──────────────┐       ┌──────────────┐         ┌──────────────────────┐
│ Create Match │  ──▶  │ Team names   │   ──▶   │ Scoreboard (default) │
│              │       │ 11 players   │         │ 87/3 (12.4 overs)  │
│              │       │ Toss + PIN   │         │ [Start Scoring 🔒]   │
└──────────────┘       └──────────────┘         └──────────┬───────────┘
                                                           │ PIN entered
                                                           ▼
                                                ┌──────────────────────┐
                                                │ Scorer panel         │
                                                │ Ball buttons + undo  │
                                                └──────────────────────┘
```

### Flow 1: Scorer creates a match

1. **Home** — tap "New T20 Match"
2. **Setup** — enter team A & B names, 11 player names per team, toss winner + bat/bowl choice, 4–6 digit scorer PIN
3. **Created** — match status set to `innings_1`; land on live match page with prominent share link (copy button)
4. Tap **Start Scoring** → enter PIN → scorer panel unlocks (session cookie on device)

### Flow 2: Scorer records balls

**Top strip:** `87/3` · over `12.4` · run rate · striker/non-striker (runs, balls) · current bowler (overs, runs, wickets)

**Ball pad (large tap targets):**
- Runs: `0` `1` `2` `3` `4` `6`
- Extras: `Wide` `No ball`
- Wicket: `W` → picker (bowled, caught, run out, LBW, stumped, other)
- **Undo** last delivery

App handles strike rotation, extras re-balls, and next-batsman picker from remaining squad.

**Innings break:** at 20 overs or all out → summary → "Start 2nd innings"

**Match end:** result screen (won by X runs/wickets) + full scorecard

### Flow 3: Spectators watch

1. Open shared link → view-only scoreboard
2. Same top strip + batsmen/bowler + fall of wickets + over summary
3. Auto-refreshes every ~2s; no ball buttons
4. "Start Scoring" visible but locked until PIN entered

### Match states

| State | Viewers see | Scorer sees |
|---|---|---|
| `innings_1` | Live 1st innings scorecard | Ball pad active |
| `innings_break` | 1st innings summary | "Start 2nd innings" button |
| `innings_2` | Live chase scorecard | Ball pad active |
| `completed` | Final result + full scorecard | Same (read-only) |

## Data Model

Event-sourced ball log — live scorecard derived from deliveries. Supports offline sync and undo.

### `matches`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | In share URL: `/m/[id]` |
| `team_a_name` | text | |
| `team_b_name` | text | |
| `toss_winner` | enum `a` \| `b` | |
| `elected_to` | enum `bat` \| `bowl` | |
| `scorer_pin_hash` | text | bcrypt hash |
| `status` | enum | `innings_1`, `innings_break`, `innings_2`, `completed` |
| `created_at` | timestamptz | |

### `players`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `match_id` | FK → matches | |
| `team` | enum `a` \| `b` | |
| `name` | text | |
| `batting_order` | int | 1–11 |

### `innings`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `match_id` | FK | |
| `batting_team` | enum `a` \| `b` | |
| `innings_number` | int | 1 or 2 |
| `target` | int nullable | Set at start of innings 2 |

### `deliveries` (append-only event log)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Server ID |
| `client_event_id` | UUID UNIQUE | Idempotency key from scorer device |
| `innings_id` | FK | |
| `sequence` | int | Monotonic per innings |
| `over_number` | int | 0-based |
| `ball_in_over` | int | 1–6 (legal balls only) |
| `runs_off_bat` | int | 0–6 |
| `extra_type` | enum nullable | `wide`, `noball` |
| `extra_runs` | int | Additional runs on extras |
| `is_wicket` | boolean | |
| `wicket_type` | enum nullable | `bowled`, `caught`, `lbw`, `run_out`, `stumped`, `other` |
| `dismissed_player_id` | FK nullable | |
| `striker_id` | FK | |
| `non_striker_id` | FK | |
| `bowler_id` | FK | |
| `is_undo` | boolean | Reverses delivery at `undoes_sequence` |
| `undoes_sequence` | int nullable | |
| `created_at` | timestamptz | |

### `scorer_sessions`

| Column | Type | Notes |
|---|---|---|
| `token` | UUID PK | HTTP-only cookie value |
| `match_id` | FK | |
| `expires_at` | timestamptz | ~24 hours |

### Score derivation

Replay non-undone deliveries in `sequence` order to compute:

- Total runs / wickets / overs (e.g. `12.4` = 12 overs + 4 legal balls)
- Striker, non-striker, current bowler
- Batsman figures (runs, balls, 4s, 6s)
- Bowler figures (overs, runs, wickets)
- Fall of wickets
- 2nd innings target = innings 1 total + 1

Computed per request in v1; no snapshot table.

### Undo model

Undo appends an event (`is_undo=true`, `undoes_sequence=N`); rows are never deleted. Offline-safe with its own `client_event_id`.

### Offline sync

Scorer IndexedDB queue:

```json
{ "client_event_id": "...", "innings_id": "...", "payload": { ... }, "synced": false }
```

On reconnect: `POST /api/matches/[id]/deliveries` with unsynced batch. Server deduplicates on `client_event_id` and assigns `sequence` atomically (`SELECT MAX(sequence) FOR UPDATE` in transaction).

### API (v1)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/matches` | none | Create match + players |
| `GET` | `/api/matches/[id]` | none | Full live state (polling) |
| `POST` | `/api/matches/[id]/unlock` | PIN in body | Returns scorer session cookie |
| `POST` | `/api/matches/[id]/deliveries` | session cookie | Submit ball events (single or batch) |
| `POST` | `/api/matches/[id]/advance` | session cookie | Start innings 2, mark completed |

## T20 Rules (v1)

| Rule | Behavior |
|---|---|
| Overs | Max 20 per innings |
| Wickets | 10 dismissals = all out |
| Legal balls | Wide and no-ball do not advance the over |
| Wide | 1 run minimum + runs ran; re-bowl |
| No-ball | 1 run + runs off bat; re-bowl; free hit on next legal delivery |
| Free hit | Wicket limited to run out / stumped only |
| Over completion | After 6 legal balls → bowler change required |
| Bowler limit | Max 4 overs per bowler; warn and force change at limit |
| Innings end | 20 overs OR all out |
| 2nd innings target | Innings 1 total + 1 |
| Match end | Target passed → immediate win; else higher score after both innings complete |

## Edge Cases & Error Handling

### Scoring edge cases

- **All out mid-over** — stop ball pad; offer "End innings"
- **Target reached mid-over** — auto-complete match
- **Run out** — picker for striker vs non-striker dismissed
- **Incomplete player list** — require all 11 names before starting
- **Duplicate player names** — allowed; disambiguated by batting order

### Sync & offline

- **Duplicate sync** — idempotent on `client_event_id`; return 200
- **Scorer loses session cookie** — re-enter PIN; no data loss
- **Out-of-order batch** — server assigns sequence in receive order

### Access

- **Wrong PIN** — 5 attempts, then 60s cooldown per match
- **URL security** — UUID v4 unguessable; view-only by default

### Error UX

| Situation | User sees | System does |
|---|---|---|
| No network (scorer) | "Offline — saving locally" badge | Queue to IndexedDB; retry with backoff |
| Sync fails | "Couldn't sync — retrying…" | Keep queue; auto-retry on reconnect |
| Invalid ball | Toast (e.g. "Innings complete") | Reject with 400 |
| Viewer poll fails | Stale score + "Reconnecting…" | Retry poll; show last known state |

**Principle:** scorer never loses a tap — local-first always wins; server is source of truth once synced.

## Testing (v1)

- **Unit tests** — score derivation (runs, overs, wickets, extras, undo, free hit, bowler limits)
- **Integration tests** — API routes against test Neon DB
- **Manual QA** — phone browser, airplane mode toggle while scoring, two phones on same match

No E2E browser automation for v1.

## Out of Scope (v1)

- User accounts and match history
- Formats other than T20
- DLS / rain rules
- Ball-by-ball commentary or photos
- Native mobile apps
- League / tournament management
- WebSocket push (polling only)

## Tech Stack Summary

- **Runtime:** Next.js 15 (App Router) on Vercel
- **Database:** Neon Postgres via Vercel integration
- **ORM:** Drizzle
- **Styling:** Tailwind CSS
- **Offline storage:** IndexedDB (via `idb` or similar)
- **PIN hashing:** bcrypt
