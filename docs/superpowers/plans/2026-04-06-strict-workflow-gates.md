# Strict Workflow Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen the Kanban workflow by enforcing mandatory quality and safety gates for state transitions in both the backend and the agent skill.

**Architecture:** 
- Update `packages/card-markdown` to include placeholder detection and evidence validation.
- Update `apps/api` to use the new validation rules in `setState`.
- Update `skills/agent-kanban/SKILL.md` with explicit workflow mandates.

**Tech Stack:** Node.js, TypeScript, Vitest.

---

### Task 1: Enhance Markdown Validation Helpers

**Files:**
- Modify: `packages/card-markdown/src/summary.ts`
- Modify: `packages/card-markdown/src/anchors.ts` (if needed for section checks)
- Test: `packages/card-markdown/tests/card-markdown.test.ts`

- [ ] **Step 1: Write failing tests for placeholder detection**

```typescript
// Add to card-markdown.test.ts
describe("placeholder detection", () => {
  it("detects TBD, TODO, and unchecked checkboxes", () => {
    expect(isSectionComplete("Has TBD")).toBe(false);
    expect(isSectionComplete("Has TODO")).toBe(false);
    expect(isSectionComplete("Has [ ]")).toBe(false);
    expect(isSectionComplete("Complete section")).toBe(true);
  });
});
```

- [ ] **Step 2: Implement isSectionComplete**

Update `packages/card-markdown/src/summary.ts` (or `anchors.ts`):

```typescript
export function isSectionComplete(content: string): boolean {
  const placeholders = ["TBD", "TODO", "[ ]"];
  const upperContent = content.toUpperCase();
  return !placeholders.some(p => upperContent.includes(p.toUpperCase()));
}
```

- [ ] **Step 3: Update validateCompletionSummary to require Result / Links**

```typescript
// In packages/card-markdown/src/summary.ts
export function validateCompletionSummary(markdown: string): void {
  const sections = getProtectedSections(markdown);
  // ... existing checks ...
  if (sections.finalSummaryResultLinks === undefined) {
    throw new SummaryValidationError("summary_required: final summary must include 'Result / Links'");
  }
  
  const links = sections.finalSummaryResultLinks;
  const hasGitHash = /[0-9a-f]{7,}/i.test(links);
  const hasUrl = /https?:\/\//.test(links);
  
  if (!hasGitHash && !hasUrl) {
    throw new SummaryValidationError("summary_required: 'Result / Links' must contain a URL or git hash as evidence");
  }
}
```

- [ ] **Step 4: Run tests and verify they pass**

- [ ] **Step 5: Commit**

```bash
git add packages/card-markdown
git commit -m "feat: add placeholder detection and strengthen completion summary validation"
```

---

### Task 2: Update API Transition Logic

**Files:**
- Modify: `apps/api/src/services/card-service.ts`
- Test: `apps/api/tests/integration/workflow-routes.test.ts`

- [ ] **Step 1: Write failing integration test for New -> Ready gate**

Attempt to move a card with "TBD" in the Goal to Ready. Expect 400 `missing_required_section`.

- [ ] **Step 2: Update hasRequiredSections in CardService**

```typescript
function hasRequiredSections(title: string, descriptionMd: string): boolean {
  const sections = getProtectedSections(descriptionMd);
  const coreSections = [
    { key: "goal", name: "Goal" },
    { key: "context", name: "Context" },
    { key: "scope", name: "Scope" },
    { key: "definitionOfDone", name: "Definition of Done" }
  ];

  for (const section of coreSections) {
    const content = sections[section.key as keyof ProtectedSections];
    if (!content || !isSectionComplete(content)) {
      return false; 
    }
  }

  return title.length > 0;
}
```

- [ ] **Step 3: Run integration tests and verify failure messages**

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/services/card-service.ts
git commit -m "feat: enforce strict New -> Ready gate in API"
```

---

### Task 3: Update Agent Skill

**Files:**
- Modify: `skills/agent-kanban/SKILL.md`

- [ ] **Step 1: Add Hard Gates and Implementation Rule**

Update `skills/agent-kanban/SKILL.md`:

Add a new section **6. Workflow Hard Gates**:
- **Readying Mandate**: "Must finish planning. Must include detailed, placeholder-free description. Agents move to Ready only after brainstorming."
- **Implementation Mandate**: "Implementation work (writing code) MUST ONLY occur in `In Progress`. Move card to `In Progress` before implementation starts."
- **Completion Mandate**: "Must pass tests, commit all changes, and push. Final Summary must include commit links/hashes."

- [ ] **Step 2: Commit**

```bash
git add skills/agent-kanban/SKILL.md
git commit -m "docs: add workflow hard gates to agent skill"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Run full test suite**
- [ ] **Step 2: Manual bypass attempt**
- [ ] **Step 3: Final Commit**
