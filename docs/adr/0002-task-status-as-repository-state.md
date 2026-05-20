# ADR 0002: Represent task status as repository state

Date: 2026-05-19

## Status

Accepted

## Context

Taskell currently models `UnitTask`, `ScheduledTask`, and `TaskSet` without embedding lifecycle status in the task value. The JSONL repository stores tasks under status directories such as `inbox`, `active`, and `done`.

CLI commands still need to show and move tasks by status.

## Decision

Keep status outside the task value and expose persisted task entries as `TaskRecord`.

`TaskRecord` contains:

- the task value
- the current status

Core operations such as `startTask` and `completeTask` move a task record between repository statuses. They do not mutate the task value itself.

## Consequences

Task values stay focused on task meaning. Lifecycle state remains an operational persistence concern. Interfaces such as CLI can still list, get, start, and complete tasks through `TaskRecord`.
