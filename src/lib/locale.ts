import { cookies, headers } from "next/headers";
import { LOCALES, type Locale } from "@/db/schema";

export { LOCALES, type Locale };

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "imdb_locale";

function parseLocale(raw: string | undefined | null): Locale | null {
  if (!raw) return null;
  return (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : null;
}

function detectFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  // Take the highest-priority tag whose primary subtag matches a supported locale.
  const tags = header
    .split(",")
    .map((t) => t.trim().split(";")[0]?.toLowerCase().split("-")[0]);
  for (const tag of tags) {
    const match = parseLocale(tag ?? null);
    if (match) return match;
  }
  return null;
}

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  const h = await headers();
  return detectFromAcceptLanguage(h.get("accept-language")) ?? DEFAULT_LOCALE;
}
