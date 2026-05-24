"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useGameStore } from "@/stores/gameStore";
import {
  checkQualification,
  submitHallOfFameEntry,
  type SubmitResult,
} from "@/app/hall-of-fame/actions";

const NAME_STORAGE_KEY = "hallOfFamePlayerName";
const NAME_MAX = 40;

type Phase =
  | { kind: "checking" }
  | { kind: "not-qualified" }
  | { kind: "qualifies"; error?: string }
  | { kind: "submitting" }
  | { kind: "submitted" };

export function Summary() {
  const score = useGameStore((s) => s.score);
  const gameId = useGameStore((s) => s.gameId);
  const reset = useGameStore((s) => s.reset);

  const [phase, setPhase] = useState<Phase>({ kind: "checking" });
  const [name, setName] = useState("");

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    checkQualification(gameId).then((result) => {
      if (cancelled) return;
      if (result.qualifies) {
        const stored =
          typeof window !== "undefined"
            ? sessionStorage.getItem(NAME_STORAGE_KEY)
            : null;
        setName(stored ?? "");
        setPhase({ kind: "qualifies" });
      } else {
        setPhase({ kind: "not-qualified" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const trimmed = name.trim();
  const nameValid = trimmed.length >= 1 && trimmed.length <= NAME_MAX;
  const busy = phase.kind === "checking" || phase.kind === "submitting";

  async function handleSubmit() {
    if (!gameId || !nameValid) return;
    setPhase({ kind: "submitting" });
    const result: SubmitResult = await submitHallOfFameEntry(gameId, trimmed);
    if (result.ok) {
      sessionStorage.setItem(NAME_STORAGE_KEY, trimmed);
      setPhase({ kind: "submitted" });
    } else {
      setPhase({ kind: "qualifies", error: messageFor(result.reason) });
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-md">
      <Typography
        variant="h4"
        className="text-2xl sm:text-3xl md:text-4xl text-center"
      >
        Score: {score}
      </Typography>

      {phase.kind === "checking" && <CircularProgress size={24} />}

      {phase.kind === "qualifies" || phase.kind === "submitting" ? (
        <form
          className="flex flex-col items-center gap-3 w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <Typography variant="body1">
            Nice — your score made the Hall of Fame!
          </Typography>
          <TextField
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{
              htmlInput: { maxLength: NAME_MAX, style: { color: "white" } },
            }}
            disabled={phase.kind === "submitting"}
            fullWidth
            autoFocus
          />
          {phase.kind === "qualifies" && phase.error && (
            <Typography variant="body2" color="error">
              {phase.error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!nameValid || phase.kind === "submitting"}
          >
            Save my score
          </Button>
        </form>
      ) : null}

      {phase.kind === "submitted" && (
        <div className="flex flex-col items-center gap-2">
          <Typography variant="body1">Score saved.</Typography>
          <Button
            component={Link}
            href="/hall-of-fame"
            variant="outlined"
            color="primary"
          >
            View Hall of Fame
          </Button>
        </div>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={reset}
        disabled={busy}
      >
        Play again
      </Button>
    </div>
  );
}

function messageFor(reason: Exclude<SubmitResult, { ok: true }>["reason"]) {
  switch (reason) {
    case "invalid-name":
      return "Invalid name (1 to 40 characters).";
    case "not-qualified":
      return "This score no longer qualifies for the Hall of Fame.";
    case "already-submitted":
      return "Score already saved.";
    case "session-not-finished":
    case "session-not-found":
      return "Session not found.";
  }
}
