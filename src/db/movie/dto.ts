import type { SelectMovie } from "../schema";
import type { Round } from "./queries";

export type ClientChoice = { movieId: number; title: string };

// What the client sees for an active round. The raw plot, year, director, and
// lead actor are intentionally absent — they're either redacted out (plot) or
// hidden until the round resolves.
export type ClientRound = {
  movieId: number;
  plotRedacted: string;
  choices: ClientChoice[];
  // Leaked so the client can do optimistic feedback (relequiz's trade-off).
  // The server is still authoritative for score/lives.
  correctMovieId: number;
};

// Sent back when a round resolves: the facts that were hidden, plus the poster.
export type RevealedMovie = {
  movieId: number;
  title: string;
  year: number;
  director: string;
  leadActor: string;
  plot: string;
  posterPath: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function toClientRound({ movie, distractors }: Round): ClientRound {
  const choices: ClientChoice[] = shuffle([movie, ...distractors]).map((m) => ({
    movieId: m.id,
    title: m.title,
  }));
  return {
    movieId: movie.id,
    plotRedacted: movie.plotRedacted,
    choices,
    correctMovieId: movie.id,
  };
}

export function toRevealedMovie(m: SelectMovie): RevealedMovie {
  return {
    movieId: m.id,
    title: m.title,
    year: m.year,
    director: m.director,
    leadActor: m.leadActor,
    plot: m.plot,
    posterPath: m.posterPath,
  };
}
