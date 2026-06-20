ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "created_by_user_id" text;
--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN IF EXISTS "scorer_pin_hash";
--> statement-breakpoint
DROP TABLE IF EXISTS "scorer_sessions";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_image_url" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_likes' AND column_name = 'viewer_id'
  ) THEN
    DROP INDEX IF EXISTS "match_likes_match_viewer_idx";
    ALTER TABLE "match_likes" RENAME COLUMN "viewer_id" TO "user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_comments' AND column_name = 'viewer_id'
  ) THEN
    ALTER TABLE "match_comments" RENAME COLUMN "viewer_id" TO "user_id";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "match_comments" ADD COLUMN IF NOT EXISTS "author_image_url" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "match_likes_match_user_idx" ON "match_likes" USING btree ("match_id","user_id");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "match_likes" ADD CONSTRAINT "match_likes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
