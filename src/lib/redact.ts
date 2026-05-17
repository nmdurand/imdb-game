const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "by",
  "and",
  "or",
  "but",
  "with",
  "from",
  "as",
  "is",
  "it",
  "its",
  "his",
  "her",
  "their",
  "this",
  "that",
  "these",
  "those",
]);

const BLOCK = "█";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function tokensToRedact(title: string): string[] {
  return title
    .split(/[^\p{L}\p{N}]+/u)
    .filter((s) => s.length >= 3 && !STOPWORDS.has(s.toLowerCase()));
}

export function redactTitle(plot: string, title: string): string {
  const tokens = tokensToRedact(title);
  if (tokens.length === 0) return plot;
  // Longer first so substrings don't get clobbered out from under longer matches.
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  let result = plot;
  for (const token of sorted) {
    const re = new RegExp(`\\b${escapeRegex(token)}\\b`, "giu");
    result = result.replace(re, BLOCK.repeat(token.length));
  }
  return result;
}
