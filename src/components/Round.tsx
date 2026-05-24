"use client";

import { Button, CircularProgress, Typography } from "@mui/material";
import { twMerge } from "tailwind-merge";
import { useGameStore } from "@/stores/gameStore";
import type { ClientChoice } from "@/db/movie/dto";

export function Round() {
  const round = useGameStore((s) => s.round);
  const status = useGameStore((s) => s.status);
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
      <Choices choices={round.choices} correctMovieId={round.correctMovieId} />
      {status === "answering" && <Reveal />}
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
    if (isCorrect) return "bg-green-600 border-green-400";
    if (isSelected) return "bg-red-700 border-red-400";
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

function Reveal() {
  const revealedMovie = useGameStore((s) => s.revealedMovie);
  const advance = useGameStore((s) => s.advance);

  if (!revealedMovie) {
    return (
      <div className="flex items-center justify-center py-4">
        <CircularProgress size={20} />
      </div>
    );
  }

  const posterUrl = revealedMovie.posterPath
    ? `https://image.tmdb.org/t/p/w200${revealedMovie.posterPath}`
    : null;

  return (
    <div className="flex flex-col gap-3 sm:gap-4 mt-2 rounded border border-white/15 p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        {posterUrl && (
          // Plain <img> is fine here — TMDB's CDN is fast and we don't need
          // next/image optimization for a 200px poster.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={`${revealedMovie.title} poster`}
            className="w-16 sm:w-24 rounded shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <Typography variant="h6" className="text-base sm:text-lg md:text-xl">
            {revealedMovie.title}
          </Typography>
          <Typography
            variant="body2"
            className="opacity-80 text-xs sm:text-sm"
          >
            {revealedMovie.year} &middot; {revealedMovie.director}
          </Typography>
          <Typography
            variant="body2"
            className="opacity-80 text-xs sm:text-sm"
          >
            Starring {revealedMovie.leadActor}
          </Typography>
        </div>
      </div>
      <Button variant="contained" color="primary" onClick={advance}>
        Next
      </Button>
    </div>
  );
}
