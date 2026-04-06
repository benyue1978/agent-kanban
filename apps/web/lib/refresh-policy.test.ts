import { describe, expect, it } from "vitest";
import { POLLING_REFRESH_INTERVAL_MS } from "./refresh-policy";

describe("refresh policy", () => {
  it("refreshes supported pages every ten seconds", () => {
    expect(POLLING_REFRESH_INTERVAL_MS).toBe(10_000);
  });
});
