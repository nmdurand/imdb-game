import type { Locale } from "@/lib/locale";
import { en, type Dict } from "./en";
import { fr } from "./fr";

export type { Dict };

const DICTS: Record<Locale, Dict> = { en, fr };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}
