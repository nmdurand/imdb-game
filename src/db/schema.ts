import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const moviesTable = pgTable("movies", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull().unique(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  director: text("director").notNull(),
  leadActor: text("lead_actor").notNull(),
  // Raw plot, with title tokens still in it — never shipped to the client.
  plot: text("plot").notNull(),
  // Plot with title-derived tokens replaced by `█`s; this is what the player reads.
  plotRedacted: text("plot_redacted").notNull(),
  posterPath: text("poster_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const gameSessionsTable = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  lives: integer("lives").notNull(),
  score: integer("score").notNull(),
  seenMovieIds: integer("seen_movie_ids").array().notNull().default([]),
  currentMovieId: integer("current_movie_id").references(() => moviesTable.id),
  currentDistractorIds: integer("current_distractor_ids")
    .array()
    .notNull()
    .default([]),
  nextMovieId: integer("next_movie_id").references(() => moviesTable.id),
  nextDistractorIds: integer("next_distractor_ids")
    .array()
    .notNull()
    .default([]),
  currentHintsRevealed: text("current_hints_revealed")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  status: text("status", { enum: ["playing", "finished"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const hallOfFameEntriesTable = pgTable("hall_of_fame_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameSessionId: uuid("game_session_id")
    .references(() => gameSessionsTable.id)
    .notNull()
    .unique(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InsertMovie = typeof moviesTable.$inferInsert;
export type SelectMovie = typeof moviesTable.$inferSelect;
export type SelectGameSession = typeof gameSessionsTable.$inferSelect;
export type SelectHallOfFameEntry =
  typeof hallOfFameEntriesTable.$inferSelect;
