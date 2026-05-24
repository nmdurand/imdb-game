"use client";

import { create } from "zustand";
import { answerRound, startGame } from "@/app/game/actions";
import type { ClientRound, RevealedMovie } from "@/db/movie/dto";
import { INITIAL_LIVES_COUNT } from "@/consts";

type GameStatus =
  | "idle"
  | "loading"
  | "playing"
  | "answering"
  | "finished"
  | "error";

type State = {
  gameId: string | null;
  round: ClientRound | null;
  nextRound: ClientRound | null;
  // Set by answerRound's response; promoted to nextRound on advance().
  pendingNextRound: ClientRound | null;
  selectedChoiceId: number | null;
  revealedMovie: RevealedMovie | null;
  lives: number;
  score: number;
  status: GameStatus;
  error: Error | null;
};

type Actions = {
  start: () => Promise<void>;
  answer: (choiceMovieId: number) => Promise<void>;
  advance: () => void;
  reset: () => Promise<void>;
};

const initialState: State = {
  gameId: null,
  round: null,
  nextRound: null,
  pendingNextRound: null,
  selectedChoiceId: null,
  revealedMovie: null,
  lives: INITIAL_LIVES_COUNT,
  score: 0,
  status: "idle",
  error: null,
};

let turnInFlight = false;
let turnEpoch = 0;
let startEpoch = 0;

export const useGameStore = create<State & Actions>((set, get) => ({
  ...initialState,

  start: async () => {
    turnEpoch++;
    turnInFlight = false;
    const epoch = ++startEpoch;
    set({ ...initialState, status: "loading" });
    try {
      const r = await startGame();
      if (epoch !== startEpoch) return;
      set({
        gameId: r.gameId,
        round: r.round,
        nextRound: r.nextRound,
        lives: r.lives,
        score: r.score,
        status: "playing",
      });
    } catch (e) {
      if (epoch !== startEpoch) return;
      set({ error: e as Error, status: "error" });
    }
  },

  reset: async () => {
    await get().start();
  },

  answer: async (choiceMovieId) => {
    const s = get();
    if (turnInFlight || !s.gameId || !s.round || s.status !== "playing") return;
    turnInFlight = true;
    const epoch = ++turnEpoch;

    set({ selectedChoiceId: choiceMovieId, status: "answering" });

    try {
      const r = await answerRound({
        gameId: s.gameId,
        movieId: s.round.movieId,
        choiceMovieId,
      });
      if (epoch !== turnEpoch) return;
      set({
        lives: r.lives,
        score: r.score,
        revealedMovie: r.revealedMovie,
        pendingNextRound: r.nextRound,
      });
    } catch (e) {
      if (epoch !== turnEpoch) return;
      set({ error: e as Error, status: "error" });
    } finally {
      turnInFlight = false;
    }
  },

  advance: () => {
    const s = get();
    if (s.status !== "answering") return;
    const gameOver = s.lives === 0 || s.nextRound === null;
    if (gameOver) {
      set({
        round: null,
        nextRound: null,
        pendingNextRound: null,
        selectedChoiceId: null,
        revealedMovie: null,
        status: "finished",
      });
    } else {
      set({
        round: s.nextRound,
        nextRound: s.pendingNextRound,
        pendingNextRound: null,
        selectedChoiceId: null,
        revealedMovie: null,
        status: "playing",
      });
    }
  },
}));
