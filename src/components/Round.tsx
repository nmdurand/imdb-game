"use client";

import { Button, CircularProgress, Typography } from "@mui/material";
import { twMerge } from "tailwind-merge";
import { roundValueFromHints, useGameStore } from "@/stores/gameStore";
import type { ClientChoice } from "@/db/movie/dto";
import { HINT_COST, HINT_TYPES, type HintType } from "@/consts";

export function Round() {
  const round = useGameStore((s) => s.round);
  const error = useGameStore((s) => s.error);

  if (error) {
    return (
      <div className="grow flex items-center justify-center">
        <Typography color="error">Failed to load</Typography>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="grow flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      <Plot text={round.plotRedacted} />
      <Hints />
      <Choices choices={round.choices} correctMovieId={round.correctMovieId} />
      <NextAction />
    </div>
  );
}

const HINT_LABELS: Record<HintType, string> = {
  year: "Year",
  director: "Director",
  leadActor: "Lead actor",
};

function Hints() {
  const revealedHints = useGameStore((s) => s.revealedHints);
  const revealedMovie = useGameStore((s) => s.revealedMovie);
  const status = useGameStore((s) => s.status);
  const reveal = useGameStore((s) => s.reveal);

  const locked = status !== "playing";
  const roundValue = roundValueFromHints(revealedHints);

  function valueFor(hintType: HintType): string | number | undefined {
    if (revealedHints[hintType] !== undefined) return revealedHints[hintType];
    if (!revealedMovie) return undefined;
    return revealedMovie[hintType];
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <Typography
          variant="body2"
          component="span"
          className="opacity-80 text-[10px] sm:text-xs"
        >
          Round worth
        </Typography>
        <Typography
          variant="body1"
          component="span"
          className="font-bold tabular-nums text-sm sm:text-base"
        >
          {roundValue} pts
        </Typography>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {HINT_TYPES.map((hintType) => {
          const value = valueFor(hintType);
          if (value !== undefined) {
            return (
              <div
                key={hintType}
                className="rounded border-2 border-white/20 bg-white/10 flex flex-col items-stretch py-1.5 sm:py-2 px-2 min-w-0"
              >
                <span className="text-[9px] sm:text-[10px] opacity-70 leading-tight">
                  {HINT_LABELS[hintType]}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold leading-tight truncate">
                  {value}
                </span>
              </div>
            );
          }
          return (
            <Button
              key={hintType}
              variant="outlined"
              color="inherit"
              disabled={locked}
              onClick={() => void reveal(hintType)}
              className={twMerge(
                "border-2 text-white normal-case flex flex-col items-stretch gap-0 py-1.5 sm:py-2 px-2 border-white/30",
              )}
            >
              <span className="text-[9px] sm:text-[10px] opacity-70 leading-tight">
                {HINT_LABELS[hintType]}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold leading-tight truncate">
                −{HINT_COST} pts
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function Plot({ text }: { text: string }) {
  return (
    <Typography
      variant="h6"
      component="p"
      className="text-pretty leading-relaxed text-sm sm:text-base md:text-lg"
    >
      {text}
    </Typography>
  );
}

function Choices({
  choices,
  correctMovieId,
}: {
  choices: ClientChoice[];
  correctMovieId: number;
}) {
  const status = useGameStore((s) => s.status);
  const selectedChoiceId = useGameStore((s) => s.selectedChoiceId);
  const answer = useGameStore((s) => s.answer);

  const locked = status !== "playing";

  function classesFor(c: ClientChoice) {
    if (!locked) return "border-white/30";
    const isSelected = c.movieId === selectedChoiceId;
    const isCorrect = c.movieId === correctMovieId;
    if (isSelected && isCorrect) return "bg-green-600 border-green-400";
    if (isSelected) return "bg-red-700 border-red-400";
    if (isCorrect) return "bg-green-600 border-green-600";
    return "border-white/10 opacity-50";
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      {choices.map((c) => (
        <Button
          key={c.movieId}
          variant="outlined"
          color="inherit"
          disabled={locked}
          onClick={() => void answer(c.movieId)}
          className={twMerge(
            "border-2 text-white text-sm sm:text-base normal-case py-2 sm:py-3",
            classesFor(c),
          )}
        >
          {c.title}
        </Button>
      ))}
    </div>
  );
}

function NextAction() {
  const status = useGameStore((s) => s.status);
  const revealedMovie = useGameStore((s) => s.revealedMovie);
  const advance = useGameStore((s) => s.advance);

  const isAnswering = status === "answering";
  const loading = isAnswering && !revealedMovie;

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={advance}
      disabled={!isAnswering || loading}
      className={isAnswering ? "" : "invisible"}
      aria-hidden={!isAnswering}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : "Next"}
    </Button>
  );
}
