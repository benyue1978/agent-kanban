import { describe, expect, it } from "vitest";
import {
  appendCompletionSummary,
  getProtectedSections,
  validateCompletionSummary,
} from "../src/index.js";

const sample = `# Card

## Goal
Ship the API

## Scope
Create the service

## Definition of Done
- [ ] tests

## Final Summary
### What was done
Built the API

### DoD Check
- [x] tests`;

describe("card markdown", () => {
  it("finds protected sections", () => {
    const sections = getProtectedSections(sample);

    expect(sections.goal).toContain("Ship the API");
    expect(sections.scope).toContain("Create the service");
    expect(sections.definitionOfDone).toContain("- [ ] tests");
    expect(sections.finalSummary).toContain("### What was done");
  });

  it("rejects completion when final summary is missing", () => {
    expect(() => validateCompletionSummary("# Card")).toThrowError(/summary_required/);
  });

  it("rejects completion when DoD Check is missing from the final summary", () => {
    expect(() =>
      validateCompletionSummary(`## Final Summary
### What was done
Shipped it`)
    ).toThrowError(/summary_required/);
  });

  it("appends a protected final summary block when one is missing", () => {
    expect(
      appendCompletionSummary(
        `# Card

## Goal
Ship the API`,
        `### What was done
Built the API

### DoD Check
- [x] tests`
      )
    ).toContain(`## Final Summary
### What was done
Built the API`);
  });
});
