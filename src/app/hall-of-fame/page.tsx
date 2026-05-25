import { Typography } from "@mui/material";
import {
  getLeaderboards,
  type LeaderboardEntry,
  type LeaderboardWindow,
} from "./actions";
import { getDict } from "@/i18n";
import { getServerLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const [leaderboards, locale] = await Promise.all([
    getLeaderboards(),
    getServerLocale(),
  ]);
  const dict = getDict(locale).hallOfFame;
  const windowLabels: Record<LeaderboardWindow, string> = {
    weekly: dict.weekly,
    monthly: dict.monthly,
    allTime: dict.allTime,
  };

  return (
    <div className="w-full max-w-5xl flex flex-col gap-6 sm:gap-8">
      <Typography
        variant="h4"
        className="text-center text-2xl sm:text-3xl md:text-4xl"
      >
        {dict.heading}
      </Typography>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {(Object.keys(windowLabels) as LeaderboardWindow[]).map((window) => (
          <Leaderboard
            key={window}
            title={windowLabels[window]}
            entries={leaderboards[window]}
            emptyLabel={dict.empty}
          />
        ))}
      </div>
    </div>
  );
}

function Leaderboard({
  title,
  entries,
  emptyLabel,
}: {
  title: string;
  entries: LeaderboardEntry[];
  emptyLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <Typography
        variant="h6"
        className="text-center text-base sm:text-lg md:text-xl"
      >
        {title}
      </Typography>
      {entries.length === 0 ? (
        <p className="text-center opacity-60">{emptyLabel}</p>
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
