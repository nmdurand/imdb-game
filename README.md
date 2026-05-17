# imdbGame

Guess the movie from its plot. The title (and any obvious giveaway) is redacted from the synopsis — pick the right title out of four. Stuck? Reveal a clue (year, director, lead actor), but each clue you peek at before answering chips away at the points you'd earn for that round.

Three lives. Get one wrong and you lose a heart.

## Stack

- Next.js 16 (App Router) · React 19
- MUI + Tailwind CSS for UI
- Drizzle ORM on Postgres (local Docker container in dev, Neon in prod)
- Zustand for client state
- Server Actions for the authoritative game loop
- Vitest with PGlite-in-memory for tests (no DB service required for CI)
- TMDB API for seed data (top-rated movies + plot + director + cast)

## Local setup

You'll need a Docker-compatible runtime. [Colima](https://github.com/abiosoft/colima) is the lightest fit on macOS:

```bash
brew install colima docker docker-compose
colima start
```

Docker Desktop works too — anything that exposes a Docker socket. Then:

```bash
cp .env.example .env.local
# Get a free TMDB key at https://www.themoviedb.org/settings/api and paste it into .env.local
yarn install
docker compose up -d           # Postgres at localhost:5432
yarn db:push                   # apply the schema
yarn db:seed                   # fetch movies from TMDB
yarn dev
```

Open <http://localhost:3000>.

To point at Neon (or any other Postgres) instead, edit `DATABASE_URL` in `.env.local` and skip the `docker compose up` step.

## Scripts

| Script         | What it does                                                    |
| -------------- | --------------------------------------------------------------- |
| `dev`          | Next dev server (Turbopack)                                     |
| `build`        | Production build                                                |
| `start`        | Production server (after `build`)                               |
| `lint`         | `eslint .`                                                      |
| `test`         | Run the Vitest suite (DB integration + store), one-shot         |
| `test:watch`   | Vitest in watch mode                                            |
| `db:generate`  | Generate a SQL migration from the current schema                |
| `db:migrate`   | Apply pending migrations                                        |
| `db:push`      | Push the current schema to the DB without a migration file      |
| `db:studio`    | Open Drizzle Studio for the active DB                           |
| `db:seed`      | Fetch top movies from TMDB into the DB                          |

## Data

Movies come from [TMDB](https://www.themoviedb.org)'s `top_rated` endpoint, enriched per-movie with credits (director + first-billed cast). The seed script honors `SEED_MOVIE_COUNT` in `.env.local`.

Plots have title-derived tokens redacted before they're stored (e.g. *Pulp Fiction*'s plot will have `pulp` and `fiction` replaced with `███`), so the game has to be played by inference, not pattern-matching.

## Game mechanics

- **Round**: see a redacted plot, pick the right title out of four (one correct, three distractors from other seeded movies).
- **Clues**: reveal `year`, `director`, or `leadActor` to narrow it down. Each clue you reveal before answering subtracts `CLUE_PENALTY` (25) from the points earned on a correct answer. Base reward is 100.
- **Lives**: start with 3, lose one per wrong answer, game ends at 0.
- **Hall of Fame**: weekly / monthly / all-time top 10. Score is submitted only after the game ends.

## Architecture notes

- **Trust boundary**: the client never sees the *raw* plot or the clue values until the server hands them over. The plot ships redacted, and clue text is only returned by `revealClue`, which records the reveal server-side so scoring can't be faked. See [`src/app/game/actions.ts`](src/app/game/actions.ts).
- **Drizzle Relations API**: no joins needed — `moviesTable` is flat. Distractors are picked server-side from the same table.
- **Zustand selectors**: components subscribe to slices of [`src/stores/gameStore.ts`](src/stores/gameStore.ts), so a score change doesn't re-render the whole UI.
- **Tests use PGlite-in-memory**: [`tests/fixtures/db.ts`](tests/fixtures/db.ts) spins up an embedded Postgres-WASM per test (~50 ms), runs migrations, returns a fresh `db`. No Docker required for `yarn test` or CI.

## Deploying to Neon + Vercel

1. Provision a Neon project, copy the **pooled** connection string (`-pooler` host).
2. Set `DATABASE_URL` in the Vercel project's environment variables.
3. Run `yarn db:migrate` against that URL once to create the schema.
4. Run `yarn db:seed` once locally (or as a one-off Vercel job) to populate movies.
