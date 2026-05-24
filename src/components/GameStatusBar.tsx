"use client";

import { useGameStore } from "@/stores/gameStore";

export function GameStatusBar() {
  return (
    <div className="w-full px-2 py-3 sm:p-8 sm:h-16 flex items-center justify-between">
      <ScoreCounter />
      <LivesCounter />
    </div>
  );
}

function ScoreCounter() {
  const score = useGameStore((s) => s.score);
  return <div className="text-xl sm:text-2xl">{score}</div>;
}

function LivesCounter() {
  const lives = useGameStore((s) => s.lives);
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {new Array(lives).fill(null).map((_, index) => (
        <HeartIcon key={index} />
      ))}
    </div>
  );
}

function HeartIcon() {
  return <span className="text-lg sm:text-2xl">❤️</span>;
}
