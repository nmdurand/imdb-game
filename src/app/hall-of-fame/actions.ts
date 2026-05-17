"use server";

import { asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { gameSessionsTable, hallOfFameEntriesTable } from "@/db/schema";

const TOP_N = 10;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const NAME_MAX = 40;
const MIN_SCORE = 1;

export type LeaderboardWindow = "weekly" | "monthly" | "allTime";

export type LeaderboardEntry = {
  playerName: string;
  score: number;
  createdAt: Date;
};

export type Leaderboards = Record<LeaderboardWindow, LeaderboardEntry[]>;

export type SubmitResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "invalid-name"
        | "not-qualified"
        | "already-submitted"
        | "session-not-finished"
        | "session-not-found";
    };

function windowStart(window: LeaderboardWindow, now: Date): Date | null {
  if (window === "weekly") return new Date(now.getTime() - WEEK_MS);
  if (window === "monthly") return new Date(now.getTime() - MONTH_MS);
  return null;
}

async function topN(
  window: LeaderboardWindow,
  now: Date,
): Promise<LeaderboardEntry[]> {
  const start = windowStart(window, now);
  return db
    .select({
      playerName: hallOfFameEntriesTable.playerName,
      score: hallOfFameEntriesTable.score,
      createdAt: hallOfFameEntriesTable.createdAt,
    })
    .from(hallOfFameEntriesTable)
    .where(start ? gte(hallOfFameEntriesTable.createdAt, start) : undefined)
    .orderBy(
      desc(hallOfFameEntriesTable.score),
      asc(hallOfFameEntriesTable.createdAt),
    )
    .limit(TOP_N);
}

export async function getLeaderboards(): Promise<Leaderboards> {
  const now = new Date();
  const [weekly, monthly, allTime] = await Promise.all([
    topN("weekly", now),
    topN("monthly", now),
    topN("allTime", now),
  ]);
  return { weekly, monthly, allTime };
}

async function qualifyingWindows(
  score: number,
  now: Date,
): Promise<LeaderboardWindow[]> {
  if (score < MIN_SCORE) return [];
  const windows: LeaderboardWindow[] = ["weekly", "monthly", "allTime"];
  const results = await Promise.all(
    windows.map(async (w) => {
      const top = await topN(w, now);
      if (top.length < TOP_N) return w;
      return score > top[TOP_N - 1].score ? w : null;
    }),
  );
  return results.filter((w): w is LeaderboardWindow => w !== null);
}

export async function checkQualification(
  gameId: string,
): Promise<{ qualifies: boolean; windows: LeaderboardWindow[] }> {
  const session = await db.query.gameSessionsTable.findFirst({
    where: eq(gameSessionsTable.id, gameId),
  });
  if (!session || session.status !== "finished") {
    return { qualifies: false, windows: [] };
  }
  const existing = await db.query.hallOfFameEntriesTable.findFirst({
    where: eq(hallOfFameEntriesTable.gameSessionId, gameId),
  });
  if (existing) return { qualifies: false, windows: [] };
  const windows = await qualifyingWindows(session.score, new Date());
  return { qualifies: windows.length > 0, windows };
}

export async function submitHallOfFameEntry(
  gameId: string,
  playerName: string,
): Promise<SubmitResult> {
  const trimmed = playerName.trim();
  if (trimmed.length < 1 || trimmed.length > NAME_MAX) {
    return { ok: false, reason: "invalid-name" };
  }

  const session = await db.query.gameSessionsTable.findFirst({
    where: eq(gameSessionsTable.id, gameId),
  });
  if (!session) return { ok: false, reason: "session-not-found" };
  if (session.status !== "finished") {
    return { ok: false, reason: "session-not-finished" };
  }

  const existing = await db.query.hallOfFameEntriesTable.findFirst({
    where: eq(hallOfFameEntriesTable.gameSessionId, gameId),
  });
  if (existing) return { ok: false, reason: "already-submitted" };

  const windows = await qualifyingWindows(session.score, new Date());
  if (windows.length === 0) return { ok: false, reason: "not-qualified" };

  await db.insert(hallOfFameEntriesTable).values({
    gameSessionId: gameId,
    playerName: trimmed,
    score: session.score,
  });
  return { ok: true };
}
