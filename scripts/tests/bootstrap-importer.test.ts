import { describe, expect, it } from "vitest";
import { parseSeedCards } from "../backfill-initial-cards";

describe("bootstrap importer", () => {
  it("parses initial seed cards from markdown", async () => {
    const cards = await parseSeedCards("bootstrap/initial-cards.md");
    expect(cards[0]?.title).toBe("Backend Skeleton");
    expect(cards).toHaveLength(7);
    expect(cards[0]?.descriptionMd).toContain("## Goal");
    expect(cards[0]?.descriptionMd).toContain("## Definition of Done");
    expect(cards[0]?.descriptionMd).toContain("API server runs locally");
  });
});
