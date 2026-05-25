import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeTestDb,
  seedMovies,
  SAMPLE_MOVIES,
  type TestDb,
} from "./fixtures/db";

const { dbRef } = vi.hoisted(() => ({
  dbRef: { current: null as TestDb | null },
}));

vi.mock("@/db/drizzle", () => ({
  get db() {
    if (!dbRef.current) throw new Error("Test DB not initialized");
    return dbRef.current;
  },
}));

const { answerRound, revealHint, startGame } = await import(
  "@/app/game/actions"
);
const { roundValueFor } = await import("@/consts");

let cleanup: () => Promise<void>;

beforeEach(async () => {
  const t = await makeTestDb();
  dbRef.current = t.db;
  cleanup = t.cleanup;
  await seedMovies(t.db, SAMPLE_MOVIES);
});

afterEach(async () => {
  await cleanup();
  dbRef.current = null;
});

describe("startGame", () => {
  it("ships a redacted plot + 4 distinct choices, no raw plot leaked", async () => {
    const r = await startGame();
    expect(r.lives).toBe(3);
    expect(r.score).toBe(0);
    expect(r.round.choices).toHaveLength(4);
    const ids = new Set(r.round.choices.map((c) => c.movieId));
    expect(ids.size).toBe(4);
    expect(ids.has(r.round.correctMovieId)).toBe(true);
    // The shipped payload must not leak director/leadActor/year/raw plot.
    const blob = JSON.stringify(r);
    expect(blob).not.toContain("director");
    expect(blob).not.toContain("leadActor");
  });

  it("preloads a lookahead with a different correct movie", async () => {
    const r = await startGame();
    expect(r.nextRound).not.toBeNull();
    expect(r.nextRound!.movieId).not.toBe(r.round.movieId);
  });
});

describe("answerRound", () => {
  it.each([
    { hints: [] as const, expected: 10 },
    { hints: ["year"] as const, expected: 7 },
    { hints: ["year", "director"] as const, expected: 4 },
    { hints: ["year", "director", "leadActor"] as const, expected: 1 },
  ])(
    "correct answer with $hints.length hint(s) earns $expected points",
    async ({ hints, expected }) => {
      const start = await startGame();
      for (const hintType of hints) {
        await revealHint({
          gameId: start.gameId,
          movieId: start.round.movieId,
          hintType,
        });
      }
      const r = await answerRound({
        gameId: start.gameId,
        movieId: start.round.movieId,
        choiceMovieId: start.round.correctMovieId,
      });
      expect(r.score).toBe(expected);
      expect(r.pointsEarned).toBe(expected);
      expect(r.lives).toBe(3);
      expect(r.status).toBe("playing");
      expect(roundValueFor(hints.length)).toBe(expected);
    },
  );

  it("wrong answer decrements lives, keeps score, earns 0 points", async () => {
    const start = await startGame();
    const wrong = start.round.choices.find(
      (c) => c.movieId !== start.round.correctMovieId,
    )!;
    const r = await answerRound({
      gameId: start.gameId,
      movieId: start.round.movieId,
      choiceMovieId: wrong.movieId,
    });
    expect(r.score).toBe(0);
    expect(r.lives).toBe(2);
    expect(r.pointsEarned).toBe(0);
    expect(r.status).toBe("playing");
  });

  it("rejects a choice that wasn't among the 4 shown", async () => {
    const start = await startGame();
    const shownIds = new Set(start.round.choices.map((c) => c.movieId));
    const notShown = SAMPLE_MOVIES.map((_, i) => i + 1).find(
      (id) => !shownIds.has(id),
    );
    if (notShown === undefined) {
      throw new Error("Expected at least one un-shown movie id in the sample");
    }
    await expect(
      answerRound({
        gameId: start.gameId,
        movieId: start.round.movieId,
        choiceMovieId: notShown,
      }),
    ).rejects.toThrow(/invalid choice/i);
  });

  it("transitions to finished on the third wrong answer", async () => {
    const start = await startGame();
    let curRound = start.round;
    let nextRound = start.nextRound;
    for (let i = 0; i < 2; i++) {
      const wrong = curRound.choices.find(
        (c) => c.movieId !== curRound.correctMovieId,
      )!;
      const r = await answerRound({
        gameId: start.gameId,
        movieId: curRound.movieId,
        choiceMovieId: wrong.movieId,
      });
      expect(r.status).toBe("playing");
      if (!nextRound) throw new Error("expected a lookahead");
      curRound = nextRound;
      nextRound = r.nextRound;
    }
    const wrong = curRound.choices.find(
      (c) => c.movieId !== curRound.correctMovieId,
    )!;
    const r = await answerRound({
      gameId: start.gameId,
      movieId: curRound.movieId,
      choiceMovieId: wrong.movieId,
    });
    expect(r.lives).toBe(0);
    expect(r.status).toBe("finished");
    expect(r.nextRound).toBeNull();
  });

  it("rejects a stale round once the server has advanced", async () => {
    const start = await startGame();
    await answerRound({
      gameId: start.gameId,
      movieId: start.round.movieId,
      choiceMovieId: start.round.correctMovieId,
    });
    await expect(
      answerRound({
        gameId: start.gameId,
        movieId: start.round.movieId,
        choiceMovieId: start.round.correctMovieId,
      }),
    ).rejects.toThrow(/stale/i);
  });
});

describe("revealHint", () => {
  it("returns the real movie field value and tracks the hint", async () => {
    const start = await startGame();
    const sample = SAMPLE_MOVIES.find(
      (m, i) => i + 1 === start.round.correctMovieId,
    )!;
    const r = await revealHint({
      gameId: start.gameId,
      movieId: start.round.movieId,
      hintType: "year",
    });
    expect(r.hintType).toBe("year");
    expect(r.value).toBe(sample.year);
    expect(r.hintsRevealed).toEqual(["year"]);
    expect(r.roundValue).toBe(7);
  });

  it("is idempotent on repeat reveal of the same hint (no double charge)", async () => {
    const start = await startGame();
    await revealHint({
      gameId: start.gameId,
      movieId: start.round.movieId,
      hintType: "director",
    });
    const r = await revealHint({
      gameId: start.gameId,
      movieId: start.round.movieId,
      hintType: "director",
    });
    expect(r.hintsRevealed).toEqual(["director"]);
    expect(r.roundValue).toBe(7);
  });

  it("rejects an unknown hint type", async () => {
    const start = await startGame();
    await expect(
      revealHint({
        gameId: start.gameId,
        movieId: start.round.movieId,
        // @ts-expect-error testing runtime validation
        hintType: "title",
      }),
    ).rejects.toThrow(/invalid hint/i);
  });

  it("rejects a stale round", async () => {
    const start = await startGame();
    await answerRound({
      gameId: start.gameId,
      movieId: start.round.movieId,
      choiceMovieId: start.round.correctMovieId,
    });
    await expect(
      revealHint({
        gameId: start.gameId,
        movieId: start.round.movieId,
        hintType: "year",
      }),
    ).rejects.toThrow(/stale/i);
  });

  it("resets revealed hints after advancing to the next round", async () => {
    const start = await startGame();
    if (!start.nextRound) throw new Error("expected a lookahead");
    await revealHint({
      gameId: start.gameId,
      movieId: start.round.movieId,
      hintType: "year",
    });
    await answerRound({
      gameId: start.gameId,
      movieId: start.round.movieId,
      choiceMovieId: start.round.correctMovieId,
    });
    // After server-side advance, start.nextRound is now the active round.
    const r = await revealHint({
      gameId: start.gameId,
      movieId: start.nextRound.movieId,
      hintType: "year",
    });
    expect(r.hintsRevealed).toEqual(["year"]);
    expect(r.roundValue).toBe(7);
  });
});
