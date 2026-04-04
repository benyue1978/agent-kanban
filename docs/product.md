# Product Definition

## Overview

agent-kanban is an AI-native Kanban system for software development where collaborators can be humans or agents.

It is designed to support a workflow where:

- Humans and agents collaborate on tasks
- Tasks are represented as cards
- Cards provide enough context for execution
- Code and final artifacts live in a Git repository
- The Kanban system visualizes and records the process

## Core Concepts

### Project (Kanban)

- One project corresponds to one Kanban board
- A project is bound to a Git repository
- The repository manages code and documents
- The Kanban manages tasks and collaboration

### Card

- A card represents a feature or task
- A card contains:
  - Title
  - Description (markdown)
  - State
  - Owner
  - Priority

- A card is the primary execution unit for both humans and agents

### Collaborator

- A collaborator can be a human or an agent
- Each collaborator can:
  - Read cards
  - Write comments
  - Update card state (depending on rules)

### Personal Inbox

- Each collaborator has an inbox
- Inbox is driven by @mentions in comments
- Inbox is for communication, not task execution

## States

Cards move through states:

New → Ready → In Progress → In Review → Done

## Collaboration Model

- Humans and agents discuss and create cards
- Cards are refined in New state
- Cards move to Ready when sufficiently defined
- Agents or humans move cards to In Progress to execute
- Review happens in In Review
- Done requires a final summary

## Design Philosophy

- Lightweight structure, not strict schema
- Markdown as primary content
- Repo as final truth
- Kanban as process visualization

## Key Differentiator

Cards act as execution harnesses, not just task trackers.

They provide structured context for agents to reliably perform work.
