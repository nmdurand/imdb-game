"use client";

import { LinearProgress } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { TIMER_REFRESH_INTERVAL_MS } from "@/consts";

export function LinearTimer({
  durationMs,
  isStopped,
  onEnd,
}: {
  durationMs: number;
  isStopped: boolean;
  onEnd: () => void;
}) {
  const [endDate] = useState(() => new Date(Date.now() + durationMs));
  const [progress, setProgress] = useState<number>(100);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (isStopped) return;
    const interval = setInterval(() => {
      const remaining = endDate.getTime() - Date.now();
      setProgress(Math.max(0, (remaining / durationMs) * 100));
      if (remaining <= 0) {
        onEndRef.current();
      }
    }, TIMER_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [endDate, isStopped, durationMs]);

  return (
    <LinearProgress
      variant="determinate"
      value={progress}
      sx={{
        "& .MuiLinearProgress-bar": { transition: "none" },
      }}
    />
  );
}
