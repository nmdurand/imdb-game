import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "../drizzle";
import { moviesTable, type Locale, type SelectMovie } from "../schema";
import { CHOICES_PER_ROUND } from "@/consts";

export type Round = { movie: SelectMovie; distractors: SelectMovie[] };

async function pickRandom(
  language: Locale,
  excludeIds: number[],
  limit: number,
): Promise<SelectMovie[]> {
  const langFilter = eq(moviesTable.language, language);
  return db.query.moviesTable.findMany({
    where:
      excludeIds.length > 0
        ? and(langFilter, notInArray(moviesTable.id, excludeIds))
        : langFilter,
    orderBy: sql`RANDOM()`,
    limit,
  });
}

// `excludeMovieIds` keeps a movie from re-appearing as the correct answer.
// Distractors are free to repeat across rounds — that's fine, the
// correctMovieId is already in the round JSON for optimistic UI, so reuse
// doesn't leak anything new.
export async function pickRound(
  language: Locale,
  excludeMovieIds: number[],
): Promise<Round | null> {
  const [movie] = await pickRandom(language, excludeMovieIds, 1);
  if (!movie) return null;
  const distractors = await pickRandom(
    language,
    [movie.id],
    CHOICES_PER_ROUND - 1,
  );
  if (distractors.length < CHOICES_PER_ROUND - 1) return null;
  return { movie, distractors };
}

export async function getMoviesByIds(ids: number[]): Promise<SelectMovie[]> {
  if (ids.length === 0) return [];
  return db.query.moviesTable.findMany({
    where: inArray(moviesTable.id, ids),
  });
}
