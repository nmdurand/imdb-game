"use client";

import Link from "next/link";
import { Button, Typography } from "@mui/material";

export function Home() {
  return (
    <div className="flex flex-col items-center gap-12 text-center max-w-xl">
      <div className="flex items-center gap-3 leading-none">
        <Typography
          variant="h2"
          component="div"
          className="font-black text-center leading-[0.9] -rotate-6"
          style={{ color: "#f5c518" }}
        >
          <div>IM</div>
          <div>Db</div>
        </Typography>
        <Typography variant="h2" component="span" className="font-bold">
          game
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
