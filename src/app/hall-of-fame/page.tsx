import { Typography } from "@mui/material";
import {
  getLeaderboards,
  type LeaderboardEntry,
  type LeaderboardWindow,
} from "./actions";

export const dynamic = "force-dynamic";

const WINDOW_LABELS: Record<LeaderboardWindow, string> = {
  weekly: "This week",
  monthly: "This month",
  allTime: "All time",
};

export default async function HallOfFamePage() {
  const leaderboards = await getLeaderboards();

  return (
    <div className="w-full max-w-5xl flex flex-col gap-8">
      <Typography variant="h4" className="text-center">
        Hall of Fame
      </Typography>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(Object.keys(WINDOW_LABELS) as LeaderboardWindow[]).map((window) => (
          <Leaderboard
            key={window}
            title={WINDOW_LABELS[window]}
            entries={leaderboards[window]}
          />
        ))}
      </div>
    </div>
  );
}

function Leaderboard({
  title,
  entries,
}: {
  title: string;
  entries: LeaderboardEntry[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <Typography variant="h6" className="text-center">
        {title}
      </Typography>
      {entries.length === 0 ? (
        <p className="text-center opacity-60">No scores yet.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {entries.map((entry, index) => (
            <li
              key={`${entry.playerName}-${entry.createdAt.toISOString()}`}
              className="flex items-baseline gap-3 px-3 py-2 rounded bg-white/5"
            >
              <span className="w-6 text-right opacity-60 tabular-nums">
                {index + 1}.
              </span>
              <span className="flex-1 truncate">{entry.playerName}</span>
              <span className="font-bold tabular-nums">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
