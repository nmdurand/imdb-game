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
import {
  HINT_TYPES,
  INITIAL_LIVES_COUNT,
  roundValueFor,
  type HintType,
} from "@/consts";
import { getServerLocale } from "@/lib/locale";

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
  pointsEarned: number;
  revealedMovie: RevealedMovie;
  nextRound: ClientRound | null;
};

export type RevealHintResult = {
  hintType: HintType;
  value: string | number;
  hintsRevealed: HintType[];
  roundValue: number;
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
  const locale = await getServerLocale();
  const current = await pickRound(locale, []);
  if (!current) throw new Error("Not enough movies seeded");
  const seen = [current.movie.id];

  const next = await pickRound(locale, seen);
  if (next) seen.push(next.movie.id);

  const [session] = await db
    .insert(gameSessionsTable)
    .values({
      language: locale,
      lives: INITIAL_LIVES_COUNT,
      score: 0,
      seenMovieIds: seen,
      currentMovieId: current.movie.id,
      currentDistractorIds: current.distractors.map((d) => d.id),
      nextMovieId: next?.movie.id ?? null,
      nextDistractorIds: next ? next.distractors.map((d) => d.id) : [],
      currentHintsRevealed: [],
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
  choiceMovieId: number;
}): Promise<AnswerResult> {
  const session = await loadSession(input.gameId);
  if (session.status === "finished") throw new Error("Game already finished");
  if (session.currentMovieId !== input.movieId) {
    throw new Error("Stale round");
  }

  const validChoices = new Set([
    session.currentMovieId,
    ...session.currentDistractorIds,
  ]);
  if (!validChoices.has(input.choiceMovieId)) {
    throw new Error("Invalid choice");
  }

  const currentMovie = await loadMovie(input.movieId);
  const correct = input.choiceMovieId === session.currentMovieId;

  const roundValue = roundValueFor(session.currentHintsRevealed.length);
  const newLives = correct ? session.lives : session.lives - 1;
  const newScore = correct ? session.score + roundValue : session.score;
  const pointsEarned = correct ? roundValue : 0;

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

    const fresh = await pickRound(session.language, session.seenMovieIds);
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
      currentHintsRevealed: [],
      status,
    })
    .where(eq(gameSessionsTable.id, input.gameId));

  return {
    lives: newLives,
    score: newScore,
    status,
    pointsEarned,
    revealedMovie: toRevealedMovie(currentMovie),
    nextRound: responseNext,
  };
}

function hintValue(movie: SelectMovie, hintType: HintType): string | number {
  switch (hintType) {
    case "year":
      return movie.year;
    case "director":
      return movie.director;
    case "leadActor":
      return movie.leadActor;
  }
}

export async function revealHint(input: {
  gameId: string;
  movieId: number;
  hintType: HintType;
}): Promise<RevealHintResult> {
  if (!HINT_TYPES.includes(input.hintType)) {
    throw new Error("Invalid hint type");
  }

  const session = await loadSession(input.gameId);
  if (session.status === "finished") throw new Error("Game already finished");
  if (session.currentMovieId !== input.movieId) {
    throw new Error("Stale round");
  }

  const movie = await loadMovie(input.movieId);

  const already = session.currentHintsRevealed.includes(input.hintType);
  const hintsRevealed = already
    ? (session.currentHintsRevealed as HintType[])
    : ([...session.currentHintsRevealed, input.hintType] as HintType[]);

  if (!already) {
    await db
      .update(gameSessionsTable)
      .set({ currentHintsRevealed: hintsRevealed })
      .where(eq(gameSessionsTable.id, input.gameId));
  }

  return {
    hintType: input.hintType,
    value: hintValue(movie, input.hintType),
    hintsRevealed,
    roundValue: roundValueFor(hintsRevealed.length),
  };
}
