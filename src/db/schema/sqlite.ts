import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const matches = sqliteTable("matches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamAName: text("team_a_name").notNull(),
  teamBName: text("team_b_name").notNull(),
  tossWinner: text("toss_winner").notNull().$type<"a" | "b">(),
  electedTo: text("elected_to").notNull().$type<"bat" | "bowl">(),
  scorerPinHash: text("scorer_pin_hash").notNull(),
  status: text("status")
    .notNull()
    .default("innings_1")
    .$type<"innings_1" | "innings_break" | "innings_2" | "completed">(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const players = sqliteTable("players", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  team: text("team").notNull().$type<"a" | "b">(),
  name: text("name").notNull(),
  battingOrder: integer("batting_order").notNull(),
});

export const innings = sqliteTable("innings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  battingTeam: text("batting_team").notNull().$type<"a" | "b">(),
  inningsNumber: integer("innings_number").notNull(),
  target: integer("target"),
});

export const deliveries = sqliteTable(
  "deliveries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientEventId: text("client_event_id").notNull(),
    inningsId: text("innings_id")
      .notNull()
      .references(() => innings.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    overNumber: integer("over_number").notNull(),
    ballInOver: integer("ball_in_over").notNull(),
    runsOffBat: integer("runs_off_bat").notNull().default(0),
    extraType: text("extra_type").$type<"wide" | "noball" | null>(),
    extraRuns: integer("extra_runs").notNull().default(0),
    isWicket: integer("is_wicket", { mode: "boolean" }).notNull().default(false),
    wicketType: text("wicket_type").$type<
      "bowled" | "caught" | "lbw" | "run_out" | "stumped" | "other" | null
    >(),
    dismissedPlayerId: text("dismissed_player_id").references(() => players.id),
    strikerId: text("striker_id")
      .notNull()
      .references(() => players.id),
    nonStrikerId: text("non_striker_id")
      .notNull()
      .references(() => players.id),
    bowlerId: text("bowler_id")
      .notNull()
      .references(() => players.id),
    isUndo: integer("is_undo", { mode: "boolean" }).notNull().default(false),
    undoesSequence: integer("undoes_sequence"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("deliveries_client_event_id_idx").on(table.clientEventId)],
);

export const scorerSessions = sqliteTable("scorer_sessions", {
  token: text("token")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export const matchLikes = sqliteTable(
  "match_likes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    viewerId: text("viewer_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("match_likes_match_viewer_idx").on(table.matchId, table.viewerId)],
);

export const matchComments = sqliteTable("match_comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  viewerId: text("viewer_id").notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
