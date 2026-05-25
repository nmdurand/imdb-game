ALTER TABLE "movies" DROP CONSTRAINT "movies_tmdb_id_unique";--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "language" text;--> statement-breakpoint
UPDATE "movies" SET "language" = 'fr' WHERE "language" IS NULL;--> statement-breakpoint
ALTER TABLE "movies" ALTER COLUMN "language" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "language" text;--> statement-breakpoint
UPDATE "game_sessions" SET "language" = 'fr' WHERE "language" IS NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "language" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_tmdb_language_unique" UNIQUE("tmdb_id","language");
