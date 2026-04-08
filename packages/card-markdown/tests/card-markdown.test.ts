import { describe, expect, it } from "vitest";
import {
  appendCompletionSummary,
  replaceCompletionSummary,
  getProtectedSections,
  isSectionComplete,
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

### Result / Links
Commit: abc1234

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

  it("rejects completion when Result / Links is missing", () => {
    expect(() =>
      validateCompletionSummary(`## Final Summary
### What was done
Shipped it`)
    ).toThrowError(/must include 'Result \/ Links'/);
  });

  it("rejects completion when Result / Links has no evidence (URL or hash)", () => {
    expect(() =>
      validateCompletionSummary(`## Final Summary
### What was done
Shipped it

### Result / Links
Done locally`)
    ).toThrowError(/must contain a URL or git hash/);
  });

  it("accepts a valid completion summary with git hash", () => {
    expect(() =>
      validateCompletionSummary(`## Final Summary
### What was done
Shipped it

### Result / Links
Commit: abc1234`)
    ).not.toThrow();
  });

  it("accepts a valid completion summary with URL", () => {
    expect(() =>
      validateCompletionSummary(`## Final Summary
### What was done
Shipped it

### Result / Links
PR: https://github.com/org/repo/pull/1`)
    ).not.toThrow();
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

  describe("placeholder detection", () => {
    it("detects TBD, TODO, and unchecked checkboxes", () => {
      expect(isSectionComplete("Has TBD")).toBe(false);
      expect(isSectionComplete("Has TODO")).toBe(false);
      expect(isSectionComplete("Has [ ]")).toBe(false);
      expect(isSectionComplete("Complete section")).toBe(true);
    });
  });

  describe("replaceCompletionSummary", () => {
    it("replaces content in existing final summary block", () => {
      const result = replaceCompletionSummary(
        sample,
        `### What was done
Completely new content

### Result / Links
Commit: xyz789`
      );
      expect(result).toContain("Completely new content");
      expect(result).not.toContain("Built the API");
      expect(result).toContain("Commit: xyz789");
    });

    it("creates final summary block if missing", () => {
      const result = replaceCompletionSummary(
        `# Card

## Goal
Ship the API`,
        `### What was done
Built the API

### Result / Links
Commit: abc1234`
      );
      expect(result).toContain(`## Final Summary`);
      expect(result).toContain("Built the API");
    });

    it("replaces when final summary exists but has content", () => {
      const result = replaceCompletionSummary(
        sample,
        `### What was done
New content

### Result / Links
Commit: new123`
      );
      expect(result).toContain("New content");
      expect(result).not.toContain("Built the API");
      expect(result).toContain("Commit: new123");
      // Should only have one occurrence of Final Summary
      expect(result.match(/## Final Summary/g)?.length).toBe(1);
    });
  });
});
