# Cricket Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile web T20 cricket scoring app — one scorer records ball-by-ball events (offline-capable), spectators watch via a shared link with 2s polling.

**Architecture:** Next.js App Router on Vercel serves UI + API routes. Neon Postgres stores matches, players, innings, and an append-only deliveries log. Score state is derived by replaying deliveries. Scorer device queues unsynced events in IndexedDB; viewers poll `GET /api/matches/[id]`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Drizzle ORM, Neon (`@neondatabase/serverless`), Vitest, bcryptjs, idb

**Spec:** `docs/superpowers/specs/2026-06-20-cricket-score-design.md`

---

## File Structure

```
cricket-score/
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── vitest.config.ts
├── .env.local.example
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx                         # Home
│   │   ├── matches/new/page.tsx             # Create match form
│   │   ├── m/[id]/page.tsx                  # Live match (client component wrapper)
│   │   └── api/matches/
│   │       ├── route.ts                     # POST create
│   │       └── [id]/
│   │           ├── route.ts                   # GET live state
│   │           ├── unlock/route.ts
│   │           ├── deliveries/route.ts
│   │           └── advance/route.ts
│   ├── db/
│   │   ├── index.ts                         # Drizzle + Neon client
│   │   └── schema.ts                        # Tables + enums
│   ├── lib/
│   │   ├── cricket/
│   │   │   ├── types.ts                     # Delivery, InningsState, MatchState
│   │   │   ├── derive-score.ts              # Pure score engine
│   │   │   └── derive-score.test.ts
│   │   ├── match/
│   │   │   ├── build-match-state.ts         # DB rows → MatchState
│   │   │   └── validate-delivery.ts         # Server-side ball validation
│   │   ├── auth/
│   │   │   └── scorer-session.ts            # Cookie helpers + PIN verify
│   │   └── offline/
│   │       └── delivery-queue.ts            # IndexedDB queue (client-only)
│   └── components/
│       ├── create-match-form.tsx
│       ├── match-view.tsx                   # Orchestrates scoreboard + scorer
│       ├── scoreboard.tsx
│       ├── ball-pad.tsx
│       ├── wicket-picker.tsx
│       ├── player-picker.tsx
│       ├── pin-unlock-modal.tsx
│       └── share-link-bar.tsx
└── drizzle/
    └── 0000_init.sql                        # Generated migration
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.local.example`, `.gitignore`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize git and Next.js project**

Run:
```bash
cd /Users/anubhavmisra/code/cricket-score
git init
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Expected: Next.js scaffold in current directory (may prompt to confirm `.` — say yes).

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install drizzle-orm @neondatabase/serverless bcryptjs idb zod
npm install -D drizzle-kit vitest @vitejs/plugin-react @types/bcryptjs
```

- [ ] **Step 3: Add scripts to `package.json`**

Modify `package.json` scripts section:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 5: Create `.env.local.example`**

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

- [ ] **Step 6: Replace home page with app entry**

`src/app/page.tsx`:
```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Cricket Score</h1>
      <p className="text-center text-gray-600">Score T20 matches on the field. Share a link. Everyone watches live.</p>
      <Link
        href="/matches/new"
        className="rounded-xl bg-green-600 px-8 py-4 text-lg font-semibold text-white"
      >
        New T20 Match
      </Link>
    </main>
  );
}
```

- [ ] **Step 7: Run tests (empty suite) and dev server**

Run:
```bash
npm test
npm run dev
```

Expected: `Tests: 0` (pass), dev server starts on `:3000`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Vitest and Drizzle deps"
```

---

### Task 2: Database schema

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Create `src/db/schema.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const teamEnum = pgEnum("team", ["a", "b"]);
export const electedToEnum = pgEnum("elected_to", ["bat", "bowl"]);
export const matchStatusEnum = pgEnum("match_status", [
  "innings_1",
  "innings_break",
  "innings_2",
  "completed",
]);
export const extraTypeEnum = pgEnum("extra_type", ["wide", "noball"]);
export const wicketTypeEnum = pgEnum("wicket_type", [
  "bowled",
  "caught",
  "lbw",
  "run_out",
  "stumped",
  "other",
]);

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamAName: text("team_a_name").notNull(),
  teamBName: text("team_b_name").notNull(),
  tossWinner: teamEnum("toss_winner").notNull(),
  electedTo: electedToEnum("elected_to").notNull(),
  scorerPinHash: text("scorer_pin_hash").notNull(),
  status: matchStatusEnum("status").notNull().default("innings_1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  team: teamEnum("team").notNull(),
  name: text("name").notNull(),
  battingOrder: integer("batting_order").notNull(),
});

export const innings = pgTable("innings", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  battingTeam: teamEnum("batting_team").notNull(),
  inningsNumber: integer("innings_number").notNull(),
  target: integer("target"),
});

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientEventId: uuid("client_event_id").notNull(),
    inningsId: uuid("innings_id")
      .notNull()
      .references(() => innings.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    overNumber: integer("over_number").notNull(),
    ballInOver: integer("ball_in_over").notNull(),
    runsOffBat: integer("runs_off_bat").notNull().default(0),
    extraType: extraTypeEnum("extra_type"),
    extraRuns: integer("extra_runs").notNull().default(0),
    isWicket: boolean("is_wicket").notNull().default(false),
    wicketType: wicketTypeEnum("wicket_type"),
    dismissedPlayerId: uuid("dismissed_player_id").references(() => players.id),
    strikerId: uuid("striker_id")
      .notNull()
      .references(() => players.id),
    nonStrikerId: uuid("non_striker_id")
      .notNull()
      .references(() => players.id),
    bowlerId: uuid("bowler_id")
      .notNull()
      .references(() => players.id),
    isUndo: boolean("is_undo").notNull().default(false),
    undoesSequence: integer("undoes_sequence"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("deliveries_client_event_id_idx").on(table.clientEventId)]
);

export const scorerSessions = pgTable("scorer_sessions", {
  token: uuid("token").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
```

- [ ] **Step 3: Create `src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof getDb>;
```

- [ ] **Step 4: Generate migration**

Run (requires `DATABASE_URL` in `.env.local` pointing to Neon):
```bash
npm run db:generate
npm run db:migrate
```

Expected: `drizzle/0000_*.sql` created and applied.

- [ ] **Step 5: Commit**

```bash
git add src/db drizzle.config.ts drizzle/
git commit -m "feat: add Drizzle schema for matches, players, deliveries"
```

---

### Task 3: Score derivation — basic runs and overs

**Files:**
- Create: `src/lib/cricket/types.ts`, `src/lib/cricket/derive-score.ts`, `src/lib/cricket/derive-score.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/cricket/types.ts`:
```typescript
export type ExtraType = "wide" | "noball";
export type WicketType = "bowled" | "caught" | "lbw" | "run_out" | "stumped" | "other";

export interface DeliveryInput {
  sequence: number;
  overNumber: number;
  ballInOver: number;
  runsOffBat: number;
  extraType?: ExtraType | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType | null;
  dismissedPlayerId?: string | null;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isUndo?: boolean;
  undoesSequence?: number | null;
}

export interface InningsConfig {
  maxOvers: number;
  maxWickets: number;
  openingStrikerId: string;
  openingNonStrikerId: string;
  openingBowlerId: string;
}

export interface PlayerStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
}

export interface BowlerStats {
  playerId: string;
  legalBalls: number;
  runsConceded: number;
  wickets: number;
}

export interface FallOfWicket {
  wicket: number;
  runs: number;
  over: number;
  ball: number;
  playerId: string;
}

export interface InningsState {
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  oversDisplay: string;
  runRate: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isFreeHit: boolean;
  isComplete: boolean;
  batsmanStats: Record<string, PlayerStats>;
  bowlerStats: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  undoneSequences: Set<number>;
}
```

`src/lib/cricket/derive-score.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { deriveInningsState } from "./derive-score";
import type { DeliveryInput, InningsConfig } from "./types";

const config: InningsConfig = {
  maxOvers: 20,
  maxWickets: 10,
  openingStrikerId: "s1",
  openingNonStrikerId: "s2",
  openingBowlerId: "b1",
};

function delivery(partial: Partial<DeliveryInput> & Pick<DeliveryInput, "sequence">): DeliveryInput {
  return {
    overNumber: 0,
    ballInOver: 1,
    runsOffBat: 0,
    extraRuns: 0,
    isWicket: false,
    strikerId: "s1",
    nonStrikerId: "s2",
    bowlerId: "b1",
    ...partial,
  };
}

describe("deriveInningsState", () => {
  it("computes runs and legal balls for a simple over", () => {
    const deliveries: DeliveryInput[] = [
      delivery({ sequence: 1, runsOffBat: 1, ballInOver: 1 }),
      delivery({ sequence: 2, runsOffBat: 4, ballInOver: 2, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 3, runsOffBat: 0, ballInOver: 3, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 4, runsOffBat: 0, ballInOver: 4, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 5, runsOffBat: 0, ballInOver: 5, strikerId: "s2", nonStrikerId: "s1" }),
      delivery({ sequence: 6, runsOffBat: 2, ballInOver: 6, strikerId: "s2", nonStrikerId: "s1" }),
    ];

    const state = deriveInningsState(deliveries, config);

    expect(state.totalRuns).toBe(7);
    expect(state.wickets).toBe(0);
    expect(state.legalBalls).toBe(6);
    expect(state.oversDisplay).toBe("1.0");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `deriveInningsState` not found.

- [ ] **Step 3: Implement minimal `derive-score.ts`**

```typescript
import type { DeliveryInput, InningsConfig, InningsState, PlayerStats, BowlerStats } from "./types";

function initBatsman(playerId: string): PlayerStats {
  return { playerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
}

function initBowler(playerId: string): BowlerStats {
  return { playerId, legalBalls: 0, runsConceded: 0, wickets: 0 };
}

function oversDisplay(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

function isLegalDelivery(d: DeliveryInput): boolean {
  return !d.extraType;
}

function totalDeliveryRuns(d: DeliveryInput): number {
  const extra = d.extraType === "wide" || d.extraType === "noball" ? 1 + d.extraRuns : d.extraRuns;
  return d.runsOffBat + extra;
}

function swapStriker(strikerId: string, nonStrikerId: string, runs: number): [string, string] {
  if (runs % 2 === 1) return [nonStrikerId, strikerId];
  return [strikerId, nonStrikerId];
}

export function deriveInningsState(
  allDeliveries: DeliveryInput[],
  config: InningsConfig
): InningsState {
  const undone = new Set<number>();
  for (const d of allDeliveries) {
    if (d.isUndo && d.undoesSequence != null) undone.add(d.undoesSequence);
  }

  const active = allDeliveries
    .filter((d) => !d.isUndo && !undone.has(d.sequence))
    .sort((a, b) => a.sequence - b.sequence);

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let strikerId = config.openingStrikerId;
  let nonStrikerId = config.openingNonStrikerId;
  let bowlerId = config.openingBowlerId;
  let isFreeHit = false;

  const batsmanStats: Record<string, PlayerStats> = {
    [config.openingStrikerId]: initBatsman(config.openingStrikerId),
    [config.openingNonStrikerId]: initBatsman(config.openingNonStrikerId),
  };
  const bowlerStats: Record<string, BowlerStats> = {
    [config.openingBowlerId]: initBowler(config.openingBowlerId),
  };

  for (const d of active) {
    const runs = totalDeliveryRuns(d);
    totalRuns += runs;

    if (!bowlerStats[d.bowlerId]) bowlerStats[d.bowlerId] = initBowler(d.bowlerId);
    if (!batsmanStats[d.strikerId]) batsmanStats[d.strikerId] = initBatsman(d.strikerId);

    bowlerStats[d.bowlerId].runsConceded += runs;

    if (d.extraType !== "wide") {
      batsmanStats[d.strikerId].balls += 1;
      if (d.runsOffBat === 4) batsmanStats[d.strikerId].fours += 1;
      if (d.runsOffBat === 6) batsmanStats[d.strikerId].sixes += 1;
      batsmanStats[d.strikerId].runs += d.runsOffBat;
    }

    if (isLegalDelivery(d)) {
      legalBalls += 1;
      bowlerStats[d.bowlerId].legalBalls += 1;
      if (legalBalls % 6 === 0) {
        [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
      }
    }

    if (d.isWicket) {
      wickets += 1;
      if (d.dismissedPlayerId && batsmanStats[d.dismissedPlayerId]) {
        batsmanStats[d.dismissedPlayerId].isOut = true;
      }
      bowlerStats[d.bowlerId].wickets += d.wicketType !== "run_out" ? 1 : 0;
    }

    const swapRuns = d.extraType === "wide" ? 1 + d.extraRuns : d.runsOffBat;
    if (!d.isWicket) {
      [strikerId, nonStrikerId] = swapStriker(strikerId, nonStrikerId, swapRuns);
    }

    if (d.extraType === "noball") isFreeHit = true;
    else if (isLegalDelivery(d)) isFreeHit = false;
  }

  const completedByOvers = legalBalls >= config.maxOvers * 6;
  const completedByWickets = wickets >= config.maxWickets;

  return {
    totalRuns,
    wickets,
    legalBalls,
    oversDisplay: oversDisplay(legalBalls),
    runRate: legalBalls === 0 ? 0 : (totalRuns / legalBalls) * 6,
    strikerId,
    nonStrikerId,
    bowlerId,
    isFreeHit,
    isComplete: completedByOvers || completedByWickets,
    batsmanStats,
    bowlerStats,
    fallOfWickets: [],
    undoneSequences: undone,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/cricket/
git commit -m "feat: add basic innings score derivation"
```

---

### Task 4: Score derivation — extras, wickets, undo, free hit

**Files:**
- Modify: `src/lib/cricket/derive-score.ts`
- Modify: `src/lib/cricket/derive-score.test.ts`

- [ ] **Step 1: Add failing tests for extras**

Append to `derive-score.test.ts`:
```typescript
  it("wide does not count as a legal ball but adds runs", () => {
    const deliveries: DeliveryInput[] = [
      delivery({ sequence: 1, extraType: "wide", extraRuns: 0, runsOffBat: 0, ballInOver: 1 }),
      delivery({ sequence: 2, runsOffBat: 1, ballInOver: 1 }),
    ];
    const state = deriveInningsState(deliveries, config);
    expect(state.totalRuns).toBe(2);
    expect(state.legalBalls).toBe(1);
    expect(state.oversDisplay).toBe("0.1");
  });

  it("undoes a delivery", () => {
    const deliveries: DeliveryInput[] = [
      delivery({ sequence: 1, runsOffBat: 4, ballInOver: 1 }),
      { ...delivery({ sequence: 2, runsOffBat: 0, ballInOver: 2 }), isUndo: true, undoesSequence: 1 },
    ];
    const state = deriveInningsState(deliveries, config);
    expect(state.totalRuns).toBe(0);
    expect(state.legalBalls).toBe(0);
  });
```

- [ ] **Step 2: Run tests — verify new tests fail if needed**

Run: `npm test`

- [ ] **Step 3: Fix derivation logic until tests pass**

Update `derive-score.ts`:
- Track `fallOfWickets` when wicket falls (append `{ wicket, runs: totalRuns, over, ball, playerId }`)
- On wicket (non-run-out), set `strikerId` to dismissed player slot — caller must supply next batsman via subsequent delivery's `strikerId`; for derivation, keep current striker/nonStriker from delivery record
- Ensure undo rebuilds `undone` set correctly (already done)

Add fall-of-wicket tracking inside the wicket block:
```typescript
const fallOfWickets: FallOfWicket[] = [];
// inside loop after wickets += 1:
if (d.dismissedPlayerId) {
  fallOfWickets.push({
    wicket: wickets,
    runs: totalRuns,
    over: Math.floor((legalBalls - (isLegalDelivery(d) ? 1 : 0)) / 6),
    ball: legalBalls % 6 || (isLegalDelivery(d) ? legalBalls % 6 : legalBalls % 6),
    playerId: d.dismissedPlayerId,
  });
}
```

Simplify FOW over/ball: use `Math.floor(legalBalls / 6)` and `legalBalls % 6` after incrementing legal balls.

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/cricket/
git commit -m "feat: handle extras, undo, and fall of wickets in score derivation"
```

---

### Task 5: Scorer session auth helpers

**Files:**
- Create: `src/lib/auth/scorer-session.ts`

- [ ] **Step 1: Implement session helpers**

```typescript
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { scorerSessions } from "@/db/schema";

export const SCORER_COOKIE = "scorer_session";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createScorerSession(matchId: string): Promise<string> {
  const db = getDb();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(scorerSessions)
    .values({ matchId, expiresAt })
    .returning({ token: scorerSessions.token });
  return row.token;
}

export async function getScorerMatchId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SCORER_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const [session] = await db
    .select()
    .from(scorerSessions)
    .where(and(eq(scorerSessions.token, token), gt(scorerSessions.expiresAt, new Date())));
  return session?.matchId ?? null;
}

export function scorerSessionCookie(token: string) {
  return `${SCORER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/
git commit -m "feat: add scorer PIN hash and session cookie helpers"
```

---

### Task 6: POST /api/matches — create match

**Files:**
- Create: `src/app/api/matches/route.ts`
- Create: `src/lib/match/create-match.ts`

- [ ] **Step 1: Create Zod schema and service**

`src/lib/match/create-match.ts`:
```typescript
import { z } from "zod";
import { getDb } from "@/db";
import { matches, players, innings } from "@/db/schema";
import { hashPin } from "@/lib/auth/scorer-session";

export const createMatchSchema = z.object({
  teamAName: z.string().min(1),
  teamBName: z.string().min(1),
  tossWinner: z.enum(["a", "b"]),
  electedTo: z.enum(["bat", "bowl"]),
  pin: z.string().regex(/^\d{4,6}$/),
  teamAPlayers: z.array(z.string().min(1)).length(11),
  teamBPlayers: z.array(z.string().min(1)).length(11),
  openingStrikerIndex: z.number().int().min(0).max(10),
  openingNonStrikerIndex: z.number().int().min(0).max(10),
  openingBowlerIndex: z.number().int().min(0).max(10),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;

export async function createMatch(input: CreateMatchInput) {
  const db = getDb();
  const pinHash = await hashPin(input.pin);

  const battingFirst =
    (input.tossWinner === "a" && input.electedTo === "bat") ||
    (input.tossWinner === "b" && input.electedTo === "bowl")
      ? "a"
      : "b";

  const [match] = await db
    .insert(matches)
    .values({
      teamAName: input.teamAName,
      teamBName: input.teamBName,
      tossWinner: input.tossWinner,
      electedTo: input.electedTo,
      scorerPinHash: pinHash,
      status: "innings_1",
    })
    .returning();

  const playerRows = [
    ...input.teamAPlayers.map((name, i) => ({
      matchId: match.id,
      team: "a" as const,
      name,
      battingOrder: i + 1,
    })),
    ...input.teamBPlayers.map((name, i) => ({
      matchId: match.id,
      team: "b" as const,
      name,
      battingOrder: i + 1,
    })),
  ];

  const insertedPlayers = await db.insert(players).values(playerRows).returning();

  const teamA = insertedPlayers.filter((p) => p.team === "a");
  const teamB = insertedPlayers.filter((p) => p.team === "b");
  const battingTeamPlayers = battingFirst === "a" ? teamA : teamB;
  const bowlingTeamPlayers = battingFirst === "a" ? teamB : teamA;

  await db.insert(innings).values({
    matchId: match.id,
    battingTeam: battingFirst,
    inningsNumber: 1,
  });

  return {
    matchId: match.id,
    shareUrl: `/m/${match.id}`,
    openingStrikerId: battingTeamPlayers[input.openingStrikerIndex].id,
    openingNonStrikerId: battingTeamPlayers[input.openingNonStrikerIndex].id,
    openingBowlerId: bowlingTeamPlayers[input.openingBowlerIndex].id,
  };
}
```

- [ ] **Step 2: Create API route**

`src/app/api/matches/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createMatch, createMatchSchema } from "@/lib/match/create-match";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await createMatch(parsed.data);
  return NextResponse.json(result, { status: 201 });
}
```

- [ ] **Step 3: Manual smoke test**

Run dev server, then:
```bash
curl -s -X POST http://localhost:3000/api/matches \
  -H 'Content-Type: application/json' \
  -d '{"teamAName":"India","teamBName":"Australia","tossWinner":"a","electedTo":"bat","pin":"1234","teamAPlayers":["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11"],"teamBPlayers":["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9","Q10","Q11"],"openingStrikerIndex":0,"openingNonStrikerIndex":1,"openingBowlerIndex":0}'
```

Expected: `{ "matchId": "...", "shareUrl": "/m/..." }`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/matches/ src/lib/match/create-match.ts
git commit -m "feat: add create match API"
```

---

### Task 7: Build match state from DB

**Files:**
- Create: `src/lib/match/build-match-state.ts`

- [ ] **Step 1: Implement state builder**

```typescript
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { matches, players, innings, deliveries } from "@/db/schema";
import { deriveInningsState } from "@/lib/cricket/derive-score";
import type { DeliveryInput } from "@/lib/cricket/types";

export async function buildMatchState(matchId: string) {
  const db = getDb();

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!match) return null;

  const allPlayers = await db.select().from(players).where(eq(players.matchId, matchId));
  const allInnings = await db
    .select()
    .from(innings)
    .where(eq(innings.matchId, matchId))
    .orderBy(asc(innings.inningsNumber));

  const inningsStates = [];
  for (const inn of allInnings) {
    const rows = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.inningsId, inn.id))
      .orderBy(asc(deliveries.sequence));

    const deliveryInputs: DeliveryInput[] = rows.map((r) => ({
      sequence: r.sequence,
      overNumber: r.overNumber,
      ballInOver: r.ballInOver,
      runsOffBat: r.runsOffBat,
      extraType: r.extraType,
      extraRuns: r.extraRuns,
      isWicket: r.isWicket,
      wicketType: r.wicketType,
      dismissedPlayerId: r.dismissedPlayerId,
      strikerId: r.strikerId,
      nonStrikerId: r.nonStrikerId,
      bowlerId: r.bowlerId,
      isUndo: r.isUndo,
      undoesSequence: r.undoesSequence,
    }));

    const first = deliveryInputs[0];
    const openingStrikerId = first?.strikerId ?? allPlayers.find((p) => p.team === inn.battingTeam && p.battingOrder === 1)!.id;
    const openingNonStrikerId = first?.nonStrikerId ?? allPlayers.find((p) => p.team === inn.battingTeam && p.battingOrder === 2)!.id;
    const openingBowlerId = first?.bowlerId ?? allPlayers.find((p) => p.team !== inn.battingTeam && p.battingOrder === 1)!.id;

    inningsStates.push({
      innings: inn,
      state: deriveInningsState(deliveryInputs, {
        maxOvers: 20,
        maxWickets: 10,
        openingStrikerId,
        openingNonStrikerId,
        openingBowlerId,
      }),
      deliveries: rows,
    });
  }

  return { match, players: allPlayers, innings: inningsStates };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/match/build-match-state.ts
git commit -m "feat: build live match state from DB deliveries"
```

---

### Task 8: GET /api/matches/[id]

**Files:**
- Create: `src/app/api/matches/[id]/route.ts`

- [ ] **Step 1: Implement GET handler**

```typescript
import { NextResponse } from "next/server";
import { buildMatchState } from "@/lib/match/build-match-state";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = await buildMatchState(id);
  if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(state);
}
```

- [ ] **Step 2: Smoke test**

```bash
curl -s http://localhost:3000/api/matches/<matchId>
```

Expected: JSON with match, players, innings.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/matches/[id]/route.ts
git commit -m "feat: add GET match state API for polling"
```

---

### Task 9: POST unlock + deliveries + advance APIs

**Files:**
- Create: `src/app/api/matches/[id]/unlock/route.ts`
- Create: `src/app/api/matches/[id]/deliveries/route.ts`
- Create: `src/app/api/matches/[id]/advance/route.ts`
- Create: `src/lib/match/insert-deliveries.ts`

- [ ] **Step 1: Unlock route**

`src/app/api/matches/[id]/unlock/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { matches } from "@/db/schema";
import { verifyPin, createScorerSession, scorerSessionCookie } from "@/lib/auth/scorer-session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { pin } = await request.json();
  const db = getDb();
  const [match] = await db.select().from(matches).where(eq(matches.id, id));
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await verifyPin(String(pin), match.scorerPinHash);
  if (!ok) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  const token = await createScorerSession(id);
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Set-Cookie": scorerSessionCookie(token), "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 2: Insert deliveries service**

`src/lib/match/insert-deliveries.ts`:
```typescript
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { deliveries, innings } from "@/db/schema";
import { z } from "zod";

export const deliveryPayloadSchema = z.object({
  clientEventId: z.string().uuid(),
  inningsId: z.string().uuid(),
  runsOffBat: z.number().int().min(0).max(6),
  extraType: z.enum(["wide", "noball"]).nullable().optional(),
  extraRuns: z.number().int().min(0).default(0),
  isWicket: z.boolean().default(false),
  wicketType: z.enum(["bowled", "caught", "lbw", "run_out", "stumped", "other"]).nullable().optional(),
  dismissedPlayerId: z.string().uuid().nullable().optional(),
  strikerId: z.string().uuid(),
  nonStrikerId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  isUndo: z.boolean().default(false),
  undoesSequence: z.number().int().nullable().optional(),
});

export async function insertDeliveriesBatch(
  matchId: string,
  items: z.infer<typeof deliveryPayloadSchema>[]
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const inserted = [];
    for (const item of items) {
      const existing = await tx
        .select({ id: deliveries.id })
        .from(deliveries)
        .where(eq(deliveries.clientEventId, item.clientEventId));
      if (existing.length > 0) {
        inserted.push(existing[0]);
        continue;
      }

      const [{ maxSeq }] = await tx
        .select({ maxSeq: sql<number>`coalesce(max(${deliveries.sequence}), 0)` })
        .from(deliveries)
        .where(eq(deliveries.inningsId, item.inningsId));

      const [{ legalBalls }] = await tx
        .select({ legalBalls: sql<number>`count(*) filter (where ${deliveries.extraType} is null and ${deliveries.isUndo} = false)` })
        .from(deliveries)
        .where(eq(deliveries.inningsId, item.inningsId));

      const sequence = Number(maxSeq) + 1;
      const legalBallCount = Number(legalBalls);
      const overNumber = Math.floor(legalBallCount / 6);
      const ballInOver = (legalBallCount % 6) + 1;

      const [row] = await tx
        .insert(deliveries)
        .values({
          clientEventId: item.clientEventId,
          inningsId: item.inningsId,
          sequence,
          overNumber: item.isUndo ? 0 : overNumber,
          ballInOver: item.isUndo ? 0 : ballInOver,
          runsOffBat: item.runsOffBat,
          extraType: item.extraType ?? null,
          extraRuns: item.extraRuns ?? 0,
          isWicket: item.isWicket,
          wicketType: item.wicketType ?? null,
          dismissedPlayerId: item.dismissedPlayerId ?? null,
          strikerId: item.strikerId,
          nonStrikerId: item.nonStrikerId,
          bowlerId: item.bowlerId,
          isUndo: item.isUndo ?? false,
          undoesSequence: item.undoesSequence ?? null,
        })
        .returning();
      inserted.push(row);
    }
    return inserted;
  });
}
```

- [ ] **Step 3: Deliveries route**

`src/app/api/matches/[id]/deliveries/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { getScorerMatchId } from "@/lib/auth/scorer-session";
import { deliveryPayloadSchema, insertDeliveriesBatch } from "@/lib/match/insert-deliveries";

const batchSchema = z.object({ deliveries: z.array(deliveryPayloadSchema).min(1) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scorerMatchId = await getScorerMatchId();
  if (scorerMatchId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = batchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await insertDeliveriesBatch(id, body.data.deliveries);
  return NextResponse.json({ inserted: result.length });
}
```

- [ ] **Step 4: Advance route**

`src/app/api/matches/[id]/advance/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { matches, innings } from "@/db/schema";
import { getScorerMatchId } from "@/lib/auth/scorer-session";
import { buildMatchState } from "@/lib/match/build-match-state";

const bodySchema = z.object({
  action: z.enum(["start_innings_2", "complete"]),
  battingTeam: z.enum(["a", "b"]).optional(),
  target: z.number().int().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if ((await getScorerMatchId()) !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  if (parsed.data.action === "start_innings_2") {
    const state = await buildMatchState(id);
    const inn1 = state?.innings[0]?.state;
    const target = (inn1?.totalRuns ?? 0) + 1;
    const battingTeam = parsed.data.battingTeam!;
    await db.insert(innings).values({ matchId: id, battingTeam, inningsNumber: 2, target });
    await db.update(matches).set({ status: "innings_2" }).where(eq(matches.id, id));
  } else {
    await db.update(matches).set({ status: "completed" }).where(eq(matches.id, id));
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/matches/[id]/ src/lib/match/insert-deliveries.ts
git commit -m "feat: add unlock, deliveries, and advance APIs"
```

---

### Task 10: Create match form UI

**Files:**
- Create: `src/components/create-match-form.tsx`
- Create: `src/app/matches/new/page.tsx`

- [ ] **Step 1: Build form component**

`src/components/create-match-form.tsx` — form with:
- Team A/B name inputs
- 11 text inputs per team (use `defaultValue` arrays)
- Toss winner radio (`a`/`b`)
- Elected to bat/bowl radio
- Opening striker/non-striker/bowler dropdowns (indexes 0–10)
- PIN input (4–6 digits)
- Submit → `POST /api/matches` → `router.push(result.shareUrl)`

- [ ] **Step 2: Wire page**

`src/app/matches/new/page.tsx`:
```tsx
import { CreateMatchForm } from "@/components/create-match-form";

export default function NewMatchPage() {
  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">New T20 Match</h1>
      <CreateMatchForm />
    </main>
  );
}
```

- [ ] **Step 3: Manual test in browser**

Create a match → redirects to `/m/[id]`.

- [ ] **Step 4: Commit**

```bash
git add src/components/create-match-form.tsx src/app/matches/new/
git commit -m "feat: add create match form UI"
```

---

### Task 11: Live match page with polling

**Files:**
- Create: `src/components/scoreboard.tsx`, `src/components/share-link-bar.tsx`, `src/components/match-view.tsx`
- Create: `src/app/m/[id]/page.tsx`

- [ ] **Step 1: Scoreboard component**

Display: team names, `runs/wickets`, overs, run rate, striker/non-striker names + stats, bowler stats, fall of wickets list.

- [ ] **Step 2: MatchView with 2s polling**

`src/components/match-view.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Scoreboard } from "./scoreboard";
import { ShareLinkBar } from "./share-link-bar";

export function MatchView({ matchId }: { matchId: string }) {
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        if (!cancelled) { setState(data); setError(false); }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [matchId]);

  if (!state) return <p className="p-4">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg p-4">
      <ShareLinkBar matchId={matchId} />
      {error && <p className="text-sm text-amber-600">Reconnecting…</p>}
      <Scoreboard state={state} />
    </div>
  );
}
```

- [ ] **Step 3: Page wrapper**

`src/app/m/[id]/page.tsx`:
```tsx
import { MatchView } from "@/components/match-view";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchView matchId={id} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ src/app/m/
git commit -m "feat: add live match page with scoreboard polling"
```

---

### Task 12: PIN unlock + scorer mode

**Files:**
- Create: `src/components/pin-unlock-modal.tsx`
- Modify: `src/components/match-view.tsx`

- [ ] **Step 1: PIN modal**

Modal with 4–6 digit input → `POST /api/matches/[id]/unlock` → on success set local `isScorer` state true.

- [ ] **Step 2: Add "Start Scoring" button to MatchView**

Shown when `!isScorer`. Opens modal. After unlock, render `<BallPad />`.

- [ ] **Step 3: Commit**

```bash
git add src/components/pin-unlock-modal.tsx src/components/match-view.tsx
git commit -m "feat: add PIN unlock for scorer mode"
```

---

### Task 13: Ball pad scoring UI

**Files:**
- Create: `src/components/ball-pad.tsx`, `src/components/wicket-picker.tsx`, `src/components/player-picker.tsx`
- Modify: `src/components/match-view.tsx`

- [ ] **Step 1: Ball pad buttons**

Large buttons: 0,1,2,3,4,6, Wide, No ball, W, Undo.

On tap → build delivery payload from current match state (striker/nonStriker/bowler IDs from latest poll state) → queue locally (Task 14) → optimistic UI update.

- [ ] **Step 2: Wicket picker**

Modal: wicket type + dismissed batsman (for run out: striker or non-striker).

- [ ] **Step 3: Bowler change at over end**

When `legalBalls % 6 === 0` after a legal delivery, show `PlayerPicker` for next bowler (exclude bowler who exceeded 4 overs / 24 legal balls).

- [ ] **Step 4: Next batsman on wicket**

Show `PlayerPicker` filtered to not-out batsmen not yet dismissed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ball-pad.tsx src/components/wicket-picker.tsx src/components/player-picker.tsx
git commit -m "feat: add ball-by-ball scoring UI"
```

---

### Task 14: Offline delivery queue

**Files:**
- Create: `src/lib/offline/delivery-queue.ts`
- Modify: `src/components/ball-pad.tsx`

- [ ] **Step 1: IndexedDB queue**

`src/lib/offline/delivery-queue.ts`:
```typescript
import { openDB, type IDBPDatabase } from "idb";

interface QueuedDelivery {
  clientEventId: string;
  inningsId: string;
  payload: Record<string, unknown>;
  synced: boolean;
}

const DB_NAME = "cricket-score";
const STORE = "deliveries";

async function db(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE, { keyPath: "clientEventId" });
    },
  });
}

export async function enqueueDelivery(item: QueuedDelivery) {
  const database = await db();
  await database.put(STORE, item);
}

export async function getUnsynced(): Promise<QueuedDelivery[]> {
  const database = await db();
  const all = await database.getAll(STORE);
  return all.filter((d) => !d.synced);
}

export async function markSynced(clientEventId: string) {
  const database = await db();
  const item = await database.get(STORE, clientEventId);
  if (item) await database.put(STORE, { ...item, synced: true });
}
```

- [ ] **Step 2: Sync loop in MatchView**

On mount + `online` event + after each enqueue:
```typescript
const unsynced = await getUnsynced();
if (unsynced.length === 0) return;
await fetch(`/api/matches/${matchId}/deliveries`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ deliveries: unsynced.map((u) => u.payload) }),
});
for (const u of unsynced) await markSynced(u.clientEventId);
```

- [ ] **Step 3: Offline badge**

Show `"Offline — saving locally"` when `!navigator.onLine`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/offline/ src/components/
git commit -m "feat: add offline delivery queue with IndexedDB sync"
```

---

### Task 15: Innings break and match complete

**Files:**
- Modify: `src/components/match-view.tsx`, `src/components/scoreboard.tsx`

- [ ] **Step 1: Detect innings complete**

When current innings `state.isComplete` and match status is `innings_1`:
- Hide ball pad
- Show innings summary + "Start 2nd Innings" button
- Button → pick new openers + bowler → `POST /api/matches/[id]/advance` `{ action: "start_innings_2", battingTeam: "..." }`

- [ ] **Step 2: Detect match complete**

When innings 2 complete or target passed:
- `POST advance { action: "complete" }`
- Show result banner: "Team X won by Y runs/wickets"

- [ ] **Step 3: Commit**

```bash
git add src/components/
git commit -m "feat: add innings break and match result flows"
```

---

### Task 16: Mobile styling pass

**Files:**
- Modify: `src/app/globals.css`, all components

- [ ] **Step 1: Mobile-first touch targets**

Ensure ball pad buttons min 48px height, sticky score strip at top, safe-area padding.

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css src/components/
git commit -m "style: mobile-first touch targets and layout polish"
```

---

### Task 17: README and deploy

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Include: Neon setup, `DATABASE_URL`, Vercel deploy steps, env vars, `npm run db:migrate`.

- [ ] **Step 2: Verify production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with Neon and Vercel deploy instructions"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|---|---|
| One scorer, view-only spectators | Tasks 12–13 (PIN gate), 11 (polling view) |
| Standard T20 scorecard | Tasks 3–4, 11, 13 |
| Shared URL | Tasks 6, 11 |
| Scorer offline + sync | Task 14 |
| Mobile web | Tasks 10–16 |
| T20 only (20 overs, 11 players) | Tasks 2, 3, 6 |
| No accounts | Tasks 5, 9 |
| PIN unlock on shared link | Tasks 5, 9, 12 |
| Ball-by-ball taps | Task 13 |
| Next.js + Neon on Vercel | Tasks 1–2, 17 |
| 2s polling for viewers | Task 11 |
| Undo model | Tasks 3–4, 13 |
| Innings break / match complete | Task 15 |
| Unit tests for score derivation | Tasks 3–4 |

## Manual QA Checklist (post-implementation)

- [ ] Create match on phone browser
- [ ] Copy share link → open on second phone → see live updates
- [ ] Unlock scorer with PIN → score a full over
- [ ] Toggle airplane mode → score 3 balls → reconnect → verify sync
- [ ] Undo last ball
- [ ] Complete innings 1 → start innings 2 → complete match
