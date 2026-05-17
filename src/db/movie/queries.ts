import { inArray, notInArray, sql } from "drizzle-orm";
import { db } from "../drizzle";
import { moviesTable, type SelectMovie } from "../schema";
import { CHOICES_PER_ROUND } from "@/consts";

export type Round = { movie: SelectMovie; distractors: SelectMovie[] };

async function pickRandom(
  excludeIds: number[],
  limit: number,
): Promise<SelectMovie[]> {
  return db.query.moviesTable.findMany({
    where:
      excludeIds.length > 0
        ? notInArray(moviesTable.id, excludeIds)
        : undefined,
    orderBy: sql`RANDOM()`,
    limit,
  });
}

// `excludeMovieIds` keeps a movie from re-appearing as the correct answer.
// Distractors are free to repeat across rounds — that's fine, the
// correctMovieId is already in the round JSON for optimistic UI, so reuse
// doesn't leak anything new.
export async function pickRound(
  excludeMovieIds: number[],
): Promise<Round | null> {
  const [movie] = await pickRandom(excludeMovieIds, 1);
  if (!movie) return null;
  const distractors = await pickRandom([movie.id], CHOICES_PER_ROUND - 1);
  if (distractors.length < CHOICES_PER_ROUND - 1) return null;
  return { movie, distractors };
}

export async function getMoviesByIds(ids: number[]): Promise<SelectMovie[]> {
  if (ids.length === 0) return [];
  return db.query.moviesTable.findMany({
    where: inArray(moviesTable.id, ids),
  });
}
