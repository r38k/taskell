# ADR 0003: Add task numbers for CLI reference

Date: 2026-05-20

## Status

Accepted

## Context

Taskell uses Nano ID based `TaskId` values as stable internal identifiers. They are safe for persistence, but they are inconvenient to type in the CLI.

Short list indexes and ID prefixes are easy to type, but they make shell history difficult to understand. User-defined aliases add another thing to manage.

## Decision

Add a human-facing `TaskNumber` to tasks. CLI output shows task numbers like issue numbers.

Examples:

- `#1 [inbox] Write README`
- `taskell start 1`
- `taskell done #1`

`TaskId` remains the stable internal identifier. `TaskNumber` is a CLI reference and is allocated from the current non-done task set. Done tasks are excluded from number allocation and lookup so numbers can be reused after tasks are completed.

## Consequences

Shell history becomes more readable than raw Nano IDs or volatile list indexes. The number space can stay small for personal usage because completed tasks leave the active reference set.

Task numbers are not permanent historical identifiers. If history needs stronger traceability later, Taskell can add archive lookup by internal `TaskId`.
