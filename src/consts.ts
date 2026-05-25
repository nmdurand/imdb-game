export const INITIAL_LIVES_COUNT = 3;

export const CHOICES_PER_ROUND = 4;

export const ROUND_BASE_SCORE = 10;
export const HINT_COST = 3;

export const HINT_TYPES = ["year", "director", "leadActor"] as const;
export type HintType = (typeof HINT_TYPES)[number];

export function roundValueFor(hintsRevealedCount: number): number {
  return ROUND_BASE_SCORE - hintsRevealedCount * HINT_COST;
}
