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
    expect(sections.finalSummary).toContain("### DoD Check");
    expect(sections.finalSummaryWhatWasDone).toContain("Built the API");
    expect(sections.finalSummaryDodCheck).toContain("- [x] tests");
  });

  it("rejects completion when final summary is missing", () => {
    expect(() => validateCompletionSummary("# Card")).toThrowError(/summary_required/);
  });

  it("accepts a valid completion summary", () => {
    expect(() => validateCompletionSummary(sample)).not.toThrow();
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

  it("appends into an existing empty final summary block without duplicating the anchor", () => {
    expect(
      appendCompletionSummary(
        `# Card

## Final Summary`,
        `### What was done
Built the API

### DoD Check
- [x] tests`
      )
    ).toBe(`# Card

## Final Summary
### What was done
Built the API

### DoD Check
- [x] tests
`);
  });

  it("appends new summary content after an existing final summary body", () => {
    expect(
      appendCompletionSummary(
        sample,
        `### Key Decisions
Used Fastify`
      )
    ).toContain(`### DoD Check
- [x] tests

### Key Decisions
Used Fastify`);
  });
});
