ALTER TABLE "matches" ADD COLUMN "created_by_user_id" text;
--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "scorer_pin_hash";
--> statement-breakpoint
DROP TABLE "scorer_sessions";
--> statement-breakpoint
DROP INDEX "match_likes_match_viewer_idx";
--> statement-breakpoint
ALTER TABLE "match_likes" RENAME COLUMN "viewer_id" TO "user_id";
--> statement-breakpoint
CREATE UNIQUE INDEX "match_likes_match_user_idx" ON "match_likes" USING btree ("match_id","user_id");
--> statement-breakpoint
ALTER TABLE "match_comments" RENAME COLUMN "viewer_id" TO "user_id";
--> statement-breakpoint
ALTER TABLE "match_comments" ADD COLUMN "author_image_url" text;
