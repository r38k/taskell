# ADR 0001: Keep task execution runner agnostic

Date: 2026-05-19

## Status

Accepted

## Context

Taskell should be able to hand some tasks to an external task runner. The runner may be Claude Code, Codex, GitHub Copilot, or an original harness. Taskell should not depend on any specific runner because that would make the core domain model follow one tool's capabilities and lifecycle.

Some tasks can be executed automatically. Other tasks may involve external side effects, such as sending email or posting to an external service. Those tasks should be prepared by a runner but must wait for user approval before the side effect is performed.

## Decision

The core package models execution intent and approval boundaries, but it does not invoke a runner.

The core exposes runner-agnostic concepts:

- whether a task is intended for manual or runner execution
- the maximum effect level allowed without approval
- the lifecycle state of a task
- a pending execution request that an external runner can consume

Runner invocation, process management, daemon behavior, and integration details belong outside the core package.

## Consequences

The CLI can initially create and inspect execution requests without running a background daemon. Later, a CLI command, daemon, MCP server, or other interface can consume the same core state and dispatch it to any runner.

The core remains testable through observable domain behavior without mocking Claude Code, Codex, GitHub Copilot, or any other runner.
