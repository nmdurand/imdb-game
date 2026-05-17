import { Typography } from "@mui/material";

export default function AboutPage() {
  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <Typography variant="h4" className="text-center">
        À propos
      </Typography>
      <Typography variant="body1">
        imdbGame est un jeu de devinettes&nbsp;: on te montre le synopsis d&apos;un
        film, on en redacte le titre, et tu choisis parmi quatre. Les données
        viennent de <a href="https://www.themoviedb.org" className="underline">TMDB</a>.
      </Typography>
      <Typography variant="body1">
        Si tu sèches, tu peux dévoiler l&apos;année, le réalisateur ou
        l&apos;acteur principal — chaque indice grignote les points que tu
        gagneras en cas de bonne réponse.
      </Typography>
      <Typography variant="body1" className="italic opacity-80">
        Trois vies. Tu te trompes, tu perds un cœur.
      </Typography>
    </div>
  );
}
