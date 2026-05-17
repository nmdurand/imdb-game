"use client";

import Link from "next/link";
import { Button, Typography } from "@mui/material";

export function Home() {
  return (
    <div className="flex flex-col items-center gap-12 text-center max-w-xl">
      <div className="flex flex-col items-center leading-none">
        <Typography variant="h2" component="span" className="font-bold">
          imdb<span className="italic opacity-70">Game</span>
        </Typography>
      </div>
      <Typography variant="body1" className="opacity-80 text-pretty">
        Read the plot, find the movie!
      </Typography>
      <Button
        variant="contained"
        color="primary"
        component={Link}
        href="/game"
        size="large"
      >
        Play
      </Button>
    </div>
  );
}
