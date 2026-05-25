"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { Round } from "./Round";
import { GameStatusBar } from "./GameStatusBar";
import { Summary } from "./Summary";
import type { Dict } from "@/i18n";

export function Game({
  round,
  summary,
}: {
  round: Dict["round"];
  summary: Dict["summary"];
}) {
  const start = useGameStore((s) => s.start);
  const status = useGameStore((s) => s.status);

  useEffect(() => {
    void start();
  }, [start]);

  if (status === "finished") {
    return <Summary dict={summary} />;
  }

  return (
    <div className="w-full flex-1 self-stretch flex flex-col">
      <GameStatusBar />
      <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center">
        <Round dict={round} />
      </div>
    </div>
  );
}
