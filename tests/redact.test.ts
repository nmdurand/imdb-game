import { describe, expect, it } from "vitest";
import { redactTitle, tokensToRedact } from "@/lib/redact";

describe("tokensToRedact", () => {
  it("keeps significant title tokens and drops stopwords + short words", () => {
    expect(tokensToRedact("The Lord of the Rings")).toEqual(["Lord", "Rings"]);
    expect(tokensToRedact("Pulp Fiction")).toEqual(["Pulp", "Fiction"]);
    expect(tokensToRedact("It")).toEqual([]);
  });

  it("handles apostrophes and punctuation", () => {
    expect(tokensToRedact("Schindler's List")).toEqual(["Schindler", "List"]);
  });
});

describe("redactTitle", () => {
  it("replaces title tokens in the plot with block characters of equal length", () => {
    const plot = "Pulp fiction is a film about Pulp and Fiction.";
    const out = redactTitle(plot, "Pulp Fiction");
    expect(out).not.toMatch(/pulp/i);
    expect(out).not.toMatch(/fiction/i);
    expect(out).toContain("████");
  });

  it("is case-insensitive but preserves untouched casing elsewhere", () => {
    const out = redactTitle("Inception begins.", "Inception");
    expect(out).toBe("█████████ begins.");
  });

  it("does not redact stopwords from the title", () => {
    const out = redactTitle("the of and is fine.", "The Of And Is");
    expect(out).toBe("the of and is fine.");
  });

  it("only matches whole words", () => {
    // "list" is a title token; "listless" should NOT be redacted.
    const out = redactTitle("They were listless.", "Schindler's List");
    expect(out).toBe("They were listless.");
  });
});
