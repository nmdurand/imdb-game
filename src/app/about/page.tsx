import { Typography } from "@mui/material";
import { getDict } from "@/i18n";
import { getServerLocale } from "@/lib/locale";

export default async function AboutPage() {
  const dict = getDict(await getServerLocale()).about;
  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 sm:gap-6">
      <Typography
        variant="h4"
        className="text-center text-2xl sm:text-3xl md:text-4xl"
      >
        {dict.heading}
      </Typography>
      <Typography
        variant="body1"
        className="text-center text-sm sm:text-base"
      >
        {dict.body}
        <br />
        {dict.dataAttribution}{" "}
        <a href="https://www.themoviedb.org" className="underline">
          TMDB
        </a>
        .
      </Typography>
    </div>
  );
}
