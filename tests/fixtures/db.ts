import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import * as schema from "@/db/schema";
import { redactTitle } from "@/lib/redact";

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

export async function makeTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "migrations"),
  });
  return {
    db,
    cleanup: async () => {
      await client.close();
    },
  };
}

export type SeedMovie = {
  tmdbId: number;
  title: string;
  year: number;
  director: string;
  leadActor: string;
  plot: string;
  posterPath?: string | null;
};

export async function seedMovies(db: TestDb, movies: SeedMovie[]) {
  const rows = movies.map((m) => ({
    tmdbId: m.tmdbId,
    title: m.title,
    year: m.year,
    director: m.director,
    leadActor: m.leadActor,
    plot: m.plot,
    plotRedacted: redactTitle(m.plot, m.title),
    posterPath: m.posterPath ?? null,
  }));
  return db.insert(schema.moviesTable).values(rows).returning();
}

// Five movies — enough to exercise advance + lookahead + game-end (3 lives).
export const SAMPLE_MOVIES: SeedMovie[] = [
  {
    tmdbId: 1,
    title: "The Godfather",
    year: 1972,
    director: "Francis Ford Coppola",
    leadActor: "Marlon Brando",
    plot: "An aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
  },
  {
    tmdbId: 2,
    title: "Pulp Fiction",
    year: 1994,
    director: "Quentin Tarantino",
    leadActor: "John Travolta",
    plot: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
  },
  {
    tmdbId: 3,
    title: "Schindler's List",
    year: 1993,
    director: "Steven Spielberg",
    leadActor: "Liam Neeson",
    plot: "In German-occupied Poland during World War II, an industrialist gradually becomes concerned for his Jewish workforce.",
  },
  {
    tmdbId: 4,
    title: "Forrest Gump",
    year: 1994,
    director: "Robert Zemeckis",
    leadActor: "Tom Hanks",
    plot: "The presidencies of Kennedy and Johnson, the Vietnam War and other events unfold from the perspective of a slow-witted Alabama man.",
  },
  {
    tmdbId: 5,
    title: "Inception",
    year: 2010,
    director: "Christopher Nolan",
    leadActor: "Leonardo DiCaprio",
    plot: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into a CEO's mind.",
  },
];
