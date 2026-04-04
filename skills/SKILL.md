# Agent Kanban Skill

## Overview

This skill defines how an agent should interact with the agent-kanban system.

The goal is to ensure that agents can reliably:

- pick tasks
- understand context
- execute work
- update state
- leave clear history

## 1. Getting a Task

Agents can:

- list assigned tasks
- follow explicit human instruction

Example:

kanban list --assigned-to me

## 2. Understanding a Card

Focus on:

- Goal
- Definition of Done
- Constraints
- Context

Treat the repository as the source of truth for code and detailed artifacts.

## 3. Execution

- Work inside the project repository
- Create or update:
  - code
  - markdown documents
  - artifacts

## 4. Logging Progress

Use comments to log:

- actions taken
- important findings
- reasoning when needed

Use @mentions when human input is required.

## 5. State Transitions

Typical flow:

- Ready → In Progress
- In Progress → In Review
- In Review → Done

## 6. Final Summary (Critical)

Before moving to Done:

- Update Final Summary section in the card

Include:

- what was done
- key decisions
- links to artifacts in repo
- DoD checklist

## 7. Rules

- Do not overwrite Goal or DoD unless explicitly instructed
- Do not rely on outdated context without checking repo
- Do not treat comments as final output
- Always ensure Final Summary reflects the real outcome

## 8. Communication

- Comments are primary communication channel
- Inbox is driven by @mentions

## 9. Philosophy

- Repo is truth
- Card is harness
- Comments are history

Agents should aim to leave the system in a state that a human can easily understand.
