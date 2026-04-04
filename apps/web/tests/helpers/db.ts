import { execFileSync } from "node:child_process";

const databaseUrl =
  process.env.WEB_TEST_DATABASE_URL ??
  "postgresql://agent_kanban:agent_kanban@localhost:5433/agent_kanban";

function runSql(sql: string): void {
  execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: "ignore",
  });
}

export function seedReviewUiFixture(): void {
  runSql(`
    TRUNCATE TABLE
      "events",
      "comment_mentions",
      "comments",
      "cards",
      "collaborators",
      "projects"
    RESTART IDENTITY CASCADE;

    INSERT INTO "projects" ("id", "name", "repo_url", "policy_json", "created_at")
    VALUES (
      'project-ui',
      'agent-kanban',
      'https://example.com/repo.git',
      '{"allowAgentReview": false, "allowSelfReview": false, "allowAgentPickUnassignedReady": true, "defaultSelectionPolicy": "priority_then_ready_age_then_updated_at"}'::jsonb,
      NOW()
    );

    INSERT INTO "collaborators" ("id", "kind", "display_name", "created_at")
    VALUES
      ('agent-main', 'agent', 'Codex Main', NOW()),
      ('human-reviewer', 'human', 'Reviewer', NOW()),
      ('human-song', 'human', 'Song', NOW());

    INSERT INTO "cards" (
      "id",
      "project_id",
      "title",
      "description_md",
      "revision",
      "state",
      "owner_id",
      "priority",
      "created_at",
      "updated_at"
    )
    VALUES
      (
        'card-new',
        'project-ui',
        'Fresh planning card',
        '# Fresh planning card

## Goal
Shape the card in browser.

## Scope
Queue it for work.

## Definition of Done
- [ ] queued',
        1,
        'New',
        NULL,
        3,
        NOW(),
        NOW()
      ),
      (
        'card-review',
        'project-ui',
        'Review-ready implementation',
        '# Review-ready implementation

## Goal
Review the delivered work.

## Scope
Either send back or complete.

## Definition of Done
- [x] summary present

## Final Summary

### What was done
- Implemented the first browser workflow.

### DoD Check
- [x] summary present',
        4,
        'In Review',
        'agent-main',
        2,
        NOW(),
        NOW()
      );

    INSERT INTO "comments" ("id", "card_id", "author_id", "kind", "body_md", "created_at")
    VALUES (
      'comment-mention',
      'card-review',
      'agent-main',
      'question',
      '@human-reviewer please check this card.',
      NOW()
    );

    INSERT INTO "comment_mentions" (
      "comment_id",
      "mentioned_collaborator_id",
      "status",
      "created_at",
      "updated_at"
    )
    VALUES (
      'comment-mention',
      'human-reviewer',
      'open',
      NOW(),
      NOW()
    );
  `);
}
