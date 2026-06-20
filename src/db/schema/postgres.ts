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
  (table) => [uniqueIndex("deliveries_client_event_id_idx").on(table.clientEventId)],
);

export const scorerSessions = pgTable("scorer_sessions", {
  token: uuid("token").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
