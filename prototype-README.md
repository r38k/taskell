# Taskell Prototype - Functional Task Management

A simple, functional task management system focusing on state transitions and actionability.

## Core Concept

Tasks represent **state changes** (状態変化) rather than simple todos. The system emphasizes "行動に移れること" (being able to take action) through clear completion criteria and focused work sessions.

## State Flow

```
zatsu → ready → active → done
  ↓       ↓       ↓
dropped  paused  paused
```

- **zatsu** (雑): Initial capture, needs refinement
- **ready**: Has completion criteria (ΔS), actionable
- **active**: Currently being worked on (one at a time)
- **done**: Completed with optional final state description
- **paused**: Temporarily stopped
- **dropped**: Abandoned

## Installation & Usage

### Prerequisites
- [Deno](https://deno.land/) installed

### Setup
```bash
# Make executable (Unix systems)
chmod +x ./taskell

# Test the implementation
deno test test/task-functions.test.ts
```

### Commands (Short Aliases)

| Command | Alias | Description | Example |
|---------|-------|-------------|---------|
| `add` | `a` | Add new task (zatsu) | `./taskell a "Fix API bug"` |
| `delta` | `d` | Set completion criteria | `./taskell d 1 "API returns 200"` |
| `start` | `s` | Start task | `./taskell s 1` |
| `pause` | `p` | Pause active task | `./taskell p` |
| `done` | | Complete task | `./taskell done 1 "Bug fixed"` |
| `drop` | `x` | Drop task | `./taskell x 1` |
| `note` | `n` | Add note | `./taskell n "Found root cause"` |
| `list` | `l` | List pending tasks | `./taskell l` |
| `show` | | Show task details | `./taskell show 1` |
| `repl` | `r` | Interactive mode | `./taskell r` |
| `help` | `h` | Show help | `./taskell h` |

### Interactive (REPL) Mode

```bash
./taskell
# or
./taskell repl
```

In REPL mode, you get continuous task display and can use commands without the `./taskell` prefix:

```
🎯 Taskell Interactive Mode
Type "help" for commands, "quit" to exit

⚡ Current: [1] Fix API authentication bug (5m)
taskell> n Found issue in middleware validation
taskell> done Fixed token expiry check logic
```

## Example Workflow

```bash
# Quick command workflow
./taskell add "Implement user authentication"
./taskell delta 1 "Users can login with JWT tokens"
./taskell start 1
./taskell note 1 "Using bcrypt for password hashing"
./taskell done 1 "Authentication working with secure JWT"

# Interactive workflow
./taskell
taskell> a "Write unit tests"
taskell> d 2 "All endpoints have 90%+ test coverage" 
taskell> s     # Smart default: starts task 2
taskell> n "Added tests for auth endpoints"
taskell> done "Test coverage at 95%"
```

## Smart Defaults

Commands work without IDs when context is clear:
- `start` without ID → starts first ready task
- `pause` without ID → pauses active task  
- `done` without ID → completes active task
- `note` without ID → adds note to active task

## Data Storage

Tasks are stored in `taskell.json` in the current directory. You can set a custom path:

```bash
export TASKELL_STORE_PATH="~/my-tasks.json"
```

## Features

- ✅ **Pure functional architecture** (no classes)
- ✅ **State transition system** with validation
- ✅ **One active task** enforcement for focus
- ✅ **Time tracking** during work sessions
- ✅ **Note system** with timestamps
- ✅ **Smart command defaults**
- ✅ **Ultra-short aliases**
- ✅ **REPL mode** with continuous status
- ✅ **Optional completion states**
- ✅ **File-based persistence**

## Testing

```bash
deno test test/task-functions.test.ts
```

## Architecture

- **types.ts**: Task interfaces and type definitions
- **task-functions.ts**: Pure functions for state management
- **persistence.ts**: File-based storage functions
- **cli.ts**: Command parsing and execution
- **repl.ts**: Interactive mode
- **main.ts**: Entry point and argument handling

This prototype implements the original Taskell concept with a functional approach, emphasizing simplicity and actionability.