"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
  gameSessionsTable,
  moviesTable,
  type SelectGameSession,
  type SelectMovie,
} from "@/db/schema";
import { pickRound } from "@/db/movie/queries";
import {
  toClientRound,
  toRevealedMovie,
  type ClientRound,
  type RevealedMovie,
} from "@/db/movie/dto";
import { INITIAL_LIVES_COUNT } from "@/consts";

export type StartGameResult = {
  gameId: string;
  round: ClientRound;
  nextRound: ClientRound | null;
  lives: number;
  score: number;
};

export type AnswerResult = {
  lives: number;
  score: number;
  status: "playing" | "finished";
  revealedMovie: RevealedMovie;
  nextRound: ClientRound | null;
};

async function loadSession(gameId: string): Promise<SelectGameSession> {
  const session = await db.query.gameSessionsTable.findFirst({
    where: eq(gameSessionsTable.id, gameId),
  });
  if (!session) throw new Error("Game not found");
  return session;
}

async function loadMovie(id: number): Promise<SelectMovie> {
  const movie = await db.query.moviesTable.findFirst({
    where: eq(moviesTable.id, id),
  });
  if (!movie) throw new Error(`Movie ${id} not found`);
  return movie;
}

export async function startGame(): Promise<StartGameResult> {
  const current = await pickRound([]);
  if (!current) throw new Error("Not enough movies seeded");
  const seen = [current.movie.id];

  const next = await pickRound(seen);
  if (next) seen.push(next.movie.id);

  const [session] = await db
    .insert(gameSessionsTable)
    .values({
      lives: INITIAL_LIVES_COUNT,
      score: 0,
      seenMovieIds: seen,
      currentMovieId: current.movie.id,
      currentDistractorIds: current.distractors.map((d) => d.id),
      nextMovieId: next?.movie.id ?? null,
      nextDistractorIds: next ? next.distractors.map((d) => d.id) : [],
      status: "playing",
    })
    .returning({ id: gameSessionsTable.id });

  return {
    gameId: session.id,
    round: toClientRound(current),
    nextRound: next ? toClientRound(next) : null,
    lives: INITIAL_LIVES_COUNT,
    score: 0,
  };
}

export async function answerRound(input: {
  gameId: string;
  movieId: number;
  choiceMovieId: number | null;
}): Promise<AnswerResult> {
  const session = await loadSession(input.gameId);
  if (session.status === "finished") throw new Error("Game already finished");
  if (session.currentMovieId !== input.movieId) {
    throw new Error("Stale round");
  }

  if (input.choiceMovieId !== null) {
    const validChoices = new Set([
      session.currentMovieId,
      ...session.currentDistractorIds,
    ]);
    if (!validChoices.has(input.choiceMovieId)) {
      throw new Error("Invalid choice");
    }
  }

  const currentMovie = await loadMovie(input.movieId);
  const correct = input.choiceMovieId === session.currentMovieId;

  const newLives = correct ? session.lives : session.lives - 1;
  const newScore = correct ? session.score + 1 : session.score;

  let newCurrentId: number | null = null;
  let newCurrentDistractorIds: number[] = [];
  let newNextId: number | null = null;
  let newNextDistractorIds: number[] = [];
  let newSeen = session.seenMovieIds;
  let responseNext: ClientRound | null = null;
  let status: "playing" | "finished" = "finished";

  if (newLives > 0 && session.nextMovieId !== null) {
    newCurrentId = session.nextMovieId;
    newCurrentDistractorIds = session.nextDistractorIds;

    const fresh = await pickRound(session.seenMovieIds);
    if (fresh) {
      newNextId = fresh.movie.id;
      newNextDistractorIds = fresh.distractors.map((d) => d.id);
      newSeen = [...session.seenMovieIds, fresh.movie.id];
      responseNext = toClientRound(fresh);
    }
    status = "playing";
  }

  await db
    .update(gameSessionsTable)
    .set({
      lives: newLives,
      score: newScore,
      seenMovieIds: newSeen,
      currentMovieId: newCurrentId,
      currentDistractorIds: newCurrentDistractorIds,
      nextMovieId: newNextId,
      nextDistractorIds: newNextDistractorIds,
      status,
    })
    .where(eq(gameSessionsTable.id, input.gameId));

  return {
    lives: newLives,
    score: newScore,
    status,
    revealedMovie: toRevealedMovie(currentMovie),
    nextRound: responseNext,
  };
}
