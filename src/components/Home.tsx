"use client";

import Link from "next/link";
import { Button, Typography } from "@mui/material";

export function Home() {
  return (
    <div className="flex flex-col items-center gap-8 sm:gap-12 text-center max-w-xl">
      <div className="flex items-center gap-3 leading-none">
        <Typography
          variant="h2"
          component="div"
          className="font-black text-center leading-[0.9] -rotate-6 text-5xl sm:text-6xl md:text-7xl"
          style={{ color: "#f5c518" }}
        >
          <div>IM</div>
          <div>Db</div>
        </Typography>
        <Typography
          variant="h2"
          component="span"
          className="font-bold text-5xl sm:text-6xl md:text-7xl"
        >
          game
        </Typography>
      </div>
      <Typography
        variant="body1"
        className="opacity-80 text-pretty text-sm sm:text-base"
      >
        Read the plot, guess the movie!
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
