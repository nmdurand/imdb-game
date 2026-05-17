CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lives" integer NOT NULL,
	"score" integer NOT NULL,
	"seen_movie_ids" integer[] DEFAULT '{}' NOT NULL,
	"current_movie_id" integer,
	"current_distractor_ids" integer[] DEFAULT '{}' NOT NULL,
	"current_clues_revealed" text[] DEFAULT '{}' NOT NULL,
	"next_movie_id" integer,
	"next_distractor_ids" integer[] DEFAULT '{}' NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hall_of_fame_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_session_id" uuid NOT NULL,
	"player_name" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hall_of_fame_entries_game_session_id_unique" UNIQUE("game_session_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_id" integer NOT NULL,
	"title" text NOT NULL,
	"year" integer NOT NULL,
	"director" text NOT NULL,
	"lead_actor" text NOT NULL,
	"plot" text NOT NULL,
	"plot_redacted" text NOT NULL,
	"poster_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id")
);
--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_current_movie_id_movies_id_fk" FOREIGN KEY ("current_movie_id") REFERENCES "public"."movies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_next_movie_id_movies_id_fk" FOREIGN KEY ("next_movie_id") REFERENCES "public"."movies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_of_fame_entries" ADD CONSTRAINT "hall_of_fame_entries_game_session_id_game_sessions_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "public"."game_sessions"("id") ON DELETE no action ON UPDATE no action;