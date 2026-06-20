CREATE TYPE "public"."elected_to" AS ENUM('bat', 'bowl');--> statement-breakpoint
CREATE TYPE "public"."extra_type" AS ENUM('wide', 'noball');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('innings_1', 'innings_break', 'innings_2', 'completed');--> statement-breakpoint
CREATE TYPE "public"."team" AS ENUM('a', 'b');--> statement-breakpoint
CREATE TYPE "public"."wicket_type" AS ENUM('bowled', 'caught', 'lbw', 'run_out', 'stumped', 'other');--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_event_id" uuid NOT NULL,
	"innings_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"over_number" integer NOT NULL,
	"ball_in_over" integer NOT NULL,
	"runs_off_bat" integer DEFAULT 0 NOT NULL,
	"extra_type" "extra_type",
	"extra_runs" integer DEFAULT 0 NOT NULL,
	"is_wicket" boolean DEFAULT false NOT NULL,
	"wicket_type" "wicket_type",
	"dismissed_player_id" uuid,
	"striker_id" uuid NOT NULL,
	"non_striker_id" uuid NOT NULL,
	"bowler_id" uuid NOT NULL,
	"is_undo" boolean DEFAULT false NOT NULL,
	"undoes_sequence" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "innings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"batting_team" "team" NOT NULL,
	"innings_number" integer NOT NULL,
	"target" integer
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_a_name" text NOT NULL,
	"team_b_name" text NOT NULL,
	"toss_winner" "team" NOT NULL,
	"elected_to" "elected_to" NOT NULL,
	"scorer_pin_hash" text NOT NULL,
	"status" "match_status" DEFAULT 'innings_1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"team" "team" NOT NULL,
	"name" text NOT NULL,
	"batting_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorer_sessions" (
	"token" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_innings_id_innings_id_fk" FOREIGN KEY ("innings_id") REFERENCES "public"."innings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_dismissed_player_id_players_id_fk" FOREIGN KEY ("dismissed_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_striker_id_players_id_fk" FOREIGN KEY ("striker_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_non_striker_id_players_id_fk" FOREIGN KEY ("non_striker_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_bowler_id_players_id_fk" FOREIGN KEY ("bowler_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorer_sessions" ADD CONSTRAINT "scorer_sessions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_client_event_id_idx" ON "deliveries" USING btree ("client_event_id");