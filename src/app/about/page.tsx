import { Typography } from "@mui/material";

export default function AboutPage() {
  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 sm:gap-6">
      <Typography
        variant="h4"
        className="text-center text-2xl sm:text-3xl md:text-4xl"
      >
        About
      </Typography>
      <Typography
        variant="body1"
        className="text-center text-sm sm:text-base"
      >
        The IMDb movie quiz - read the plot, guess the movie!
        <br />
        Data comes from
        <a href="https://www.themoviedb.org" className="underline">
          TMDB
        </a>
        .
      </Typography>
    </div>
  );
}
