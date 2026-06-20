PRAGMA foreign_keys=OFF;
--> statement-breakpoint
ALTER TABLE `matches` ADD `created_by_user_id` text;
--> statement-breakpoint
ALTER TABLE `matches` DROP COLUMN `scorer_pin_hash`;
--> statement-breakpoint
DROP TABLE `scorer_sessions`;
--> statement-breakpoint
DROP TABLE `match_likes`;
--> statement-breakpoint
CREATE TABLE `match_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `match_likes_match_user_idx` ON `match_likes` (`match_id`,`user_id`);
--> statement-breakpoint
DROP TABLE `match_comments`;
--> statement-breakpoint
CREATE TABLE `match_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`user_id` text NOT NULL,
	`author_name` text NOT NULL,
	`author_image_url` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
