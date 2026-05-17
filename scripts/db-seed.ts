// .env.local is loaded by Node via the --env-file flag in package.json's db:seed script.
import { db } from "../src/db/drizzle";
import { moviesTable, type InsertMovie } from "../src/db/schema";
import { redactTitle } from "../src/lib/redact";
import { sql } from "drizzle-orm";

const TMDB_BASE = "https://api.themoviedb.org/3";
const PAGE_SIZE = 20;
const PER_REQUEST_DELAY_MS = 250; // ~4 req/s, well under TMDB's limit

type TopRatedItem = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
};

type TopRatedPage = {
  page: number;
  total_pages: number;
  results: TopRatedItem[];
};

type Credits = {
  cast: { name: string; order: number }[];
  crew: { name: string; job: string }[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tmdb<T>(path: string, apiKey: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${path}${sep}api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB ${path} → ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function extractDirector(credits: Credits): string | null {
  const director = credits.crew.find((c) => c.job === "Director");
  return director?.name ?? null;
}

function extractLeadActor(credits: Credits): string | null {
  const sorted = [...credits.cast].sort((a, b) => a.order - b.order);
  return sorted[0]?.name ?? null;
}

function parseYear(releaseDate: string): number | null {
  const m = releaseDate.match(/^(\d{4})/);
  return m ? Number(m[1]) : null;
}

async function fetchTopRated(
  apiKey: string,
  count: number,
): Promise<TopRatedItem[]> {
  const results: TopRatedItem[] = [];
  let page = 1;
  while (results.length < count) {
    const data = await tmdb<TopRatedPage>(
      `/movie/top_rated?page=${page}`,
      apiKey,
    );
    results.push(...data.results);
    if (page >= data.total_pages) break;
    page++;
    await sleep(PER_REQUEST_DELAY_MS);
  }
  return results.slice(0, count);
}

async function buildMovieRow(
  item: TopRatedItem,
  apiKey: string,
): Promise<InsertMovie | null> {
  const year = parseYear(item.release_date);
  if (!year || !item.overview?.trim()) return null;

  const credits = await tmdb<Credits>(`/movie/${item.id}/credits`, apiKey);
  const director = extractDirector(credits);
  const leadActor = extractLeadActor(credits);
  if (!director || !leadActor) return null;

  const plot = item.overview.trim();
  return {
    tmdbId: item.id,
    title: item.title,
    year,
    director,
    leadActor,
    plot,
    plotRedacted: redactTitle(plot, item.title),
    posterPath: item.poster_path,
  };
}

async function main() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error(
      "TMDB_API_KEY is not set. Get a free key at https://www.themoviedb.org/settings/api and add it to .env.local.",
    );
    process.exit(1);
  }
  const count = Number(process.env.SEED_MOVIE_COUNT ?? 200);
  if (!Number.isFinite(count) || count <= 0) {
    console.error(`SEED_MOVIE_COUNT must be a positive number, got ${count}`);
    process.exit(1);
  }

  console.log(`Fetching top ${count} movies from TMDB…`);
  const items = await fetchTopRated(apiKey, count);
  console.log(`Got ${items.length} entries; enriching with credits…`);

  const rows: InsertMovie[] = [];
  let skipped = 0;
  for (const [i, item] of items.entries()) {
    try {
      const row = await buildMovieRow(item, apiKey);
      if (row) {
        rows.push(row);
      } else {
        skipped++;
      }
    } catch (e) {
      skipped++;
      console.warn(`  skip "${item.title}" (${item.id}):`, (e as Error).message);
    }
    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/${items.length} done (${rows.length} kept)`);
    }
    await sleep(PER_REQUEST_DELAY_MS);
  }

  // TMDB's top_rated endpoint can return the same movie on multiple pages
  // (live-rated, moving target). Drop duplicates so ON CONFLICT DO UPDATE
  // doesn't try to touch the same row twice in one statement.
  const uniqueRows = Array.from(
    new Map(rows.map((r) => [r.tmdbId, r])).values(),
  );
  const duplicates = rows.length - uniqueRows.length;

  if (uniqueRows.length === 0) {
    console.error("No rows to insert; aborting.");
    process.exit(1);
  }

  console.log(
    `Inserting ${uniqueRows.length} movies (skipped ${skipped}, deduped ${duplicates})…`,
  );
  // Upsert on tmdbId so re-running the script refreshes data without duplicating.
  await db
    .insert(moviesTable)
    .values(uniqueRows)
    .onConflictDoUpdate({
      target: moviesTable.tmdbId,
      set: {
        title: sql`excluded.title`,
        year: sql`excluded.year`,
        director: sql`excluded.director`,
        leadActor: sql`excluded.lead_actor`,
        plot: sql`excluded.plot`,
        plotRedacted: sql`excluded.plot_redacted`,
        posterPath: sql`excluded.poster_path`,
      },
    });

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
