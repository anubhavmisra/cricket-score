CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`client_event_id` text NOT NULL,
	`innings_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`over_number` integer NOT NULL,
	`ball_in_over` integer NOT NULL,
	`runs_off_bat` integer DEFAULT 0 NOT NULL,
	`extra_type` text,
	`extra_runs` integer DEFAULT 0 NOT NULL,
	`is_wicket` integer DEFAULT false NOT NULL,
	`wicket_type` text,
	`dismissed_player_id` text,
	`striker_id` text NOT NULL,
	`non_striker_id` text NOT NULL,
	`bowler_id` text NOT NULL,
	`is_undo` integer DEFAULT false NOT NULL,
	`undoes_sequence` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`innings_id`) REFERENCES `innings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dismissed_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`striker_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`non_striker_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bowler_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deliveries_client_event_id_idx` ON `deliveries` (`client_event_id`);--> statement-breakpoint
CREATE TABLE `innings` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`batting_team` text NOT NULL,
	`innings_number` integer NOT NULL,
	`target` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`team_a_name` text NOT NULL,
	`team_b_name` text NOT NULL,
	`toss_winner` text NOT NULL,
	`elected_to` text NOT NULL,
	`scorer_pin_hash` text NOT NULL,
	`status` text DEFAULT 'innings_1' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`team` text NOT NULL,
	`name` text NOT NULL,
	`batting_order` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scorer_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
