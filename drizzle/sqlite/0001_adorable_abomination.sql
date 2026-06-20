CREATE TABLE `match_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`viewer_id` text NOT NULL,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `match_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`viewer_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `match_likes_match_viewer_idx` ON `match_likes` (`match_id`,`viewer_id`);