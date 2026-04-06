import { describe, expect, it } from "vitest";
import nextConfig from "./next.config.mjs";

describe("web next config", () => {
  it("defaults kanban api rewrites to the development api port", async () => {
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/kanban-api/:path*",
          destination: "http://127.0.0.1:3101/:path*",
        }),
      ])
    );
  });
});
