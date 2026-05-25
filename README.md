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
- Bilingual UI + content (English + French) via a cookie-backed locale toggle

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
docker compose up -d                              # Postgres at localhost:5432
yarn db:push                                      # apply the schema
SEED_LANGUAGE=fr yarn db:seed                     # fetch French movies from TMDB
SEED_LANGUAGE=en yarn db:seed                     # fetch English movies from TMDB
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
| `db:seed`      | Fetch top movies from TMDB into the DB (see "Data" for env vars)|

## Data

Movies come from [TMDB](https://www.themoviedb.org)'s `top_rated` endpoint, enriched per-movie with credits (director + first-billed cast). The DB stores one row per `(tmdb_id, language)`, so the same movie can have an English row and a French row.

Seed script env vars:

- `SEED_LANGUAGE` — `en` or `fr` (default `fr`). Maps to TMDB's `en-US` / `fr-FR`. Run the script once per language.
- `SEED_MOVIE_COUNT` — how many top-rated movies to fetch (default 200).
- `SEED_RESET=true` — wipes movies (and dependent sessions/hall-of-fame entries) **for the chosen language only** before seeding. Otherwise the script upserts on `(tmdb_id, language)`.

Movies without an overview in the chosen language are skipped, so the row count per language may differ slightly.

Plots have title-derived tokens redacted before they're stored (e.g. *Pulp Fiction*'s plot will have `pulp` and `fiction` replaced with `███`), so the game has to be played by inference, not pattern-matching. The redactor uses a combined EN+FR stopword set, so it handles both languages with no per-row branching.

## Localization

UI strings live in [`src/i18n/en.ts`](src/i18n/en.ts) and [`src/i18n/fr.ts`](src/i18n/fr.ts) (mirrored shape, typed off the English dict). The active locale is resolved server-side from the `imdb_locale` cookie (falling back to `Accept-Language`, then `fr`) in [`src/lib/locale.ts`](src/lib/locale.ts).

The EN/FR toggle in the header writes the cookie via a server action ([`src/lib/locale-actions.ts`](src/lib/locale-actions.ts)) and revalidates the layout. The toggle is disabled mid-game — a game session is locked to one language at start so its movie picks stay consistent.

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
