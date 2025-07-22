# Taskell - Task State Management Prototype

A task management tool focused on **state transitions** and **actionability** (行動に移れること).

## Core Concept

Tasks represent **state changes** (状態変化) rather than simple todo items. Each task must define what change it will bring about before it becomes actionable.

## State Flow

```
zatsu → ready → active → done
           ↓       ↓
         paused  dropped
```

- **Zatsu (雑)**: Quick capture without completion criteria
- **Ready**: Has completion criteria (delta), ready to work on
- **Active**: Currently being worked on (only one at a time)
- **Paused**: Temporarily paused, can be resumed
- **Done**: Completed successfully
- **Dropped**: Abandoned or cancelled

## Installation & Usage

### Setup
```bash
chmod +x ./taskell  # Make executable (Unix systems)
```

### REPL Mode (Recommended)
```bash
./taskell
```

Starts interactive mode with continuous task display and short commands.

### Single Commands
```bash
./taskell add "Fix API authentication bug"
./taskell delta 1 "API returns 200 with valid JWT token"
./taskell start 1
./taskell note "Found issue in middleware"
./taskell done "Fixed token validation logic"
```

## Command Reference

### Task Management
- `add <title>` (a) - Add task in zatsu state
- `delta <id> <criteria>` (d) - Set completion criteria (zatsu → ready)
- `start [id]` (s) - Start task (ready → active)
- `done [final_state]` - Complete active task
- `pause` (p) - Pause active task
- `resume [id]` (r) - Resume paused task
- `drop [id]` - Abandon task
- `note <text>` (n) - Add note to active task

### Information
- `list [filter]` (l, tl) - List tasks (zatsu|ready|active|paused|done|dropped|pending)
- `show <id>` - Show task details
- `status` (st) - Show summary status
- `help` (h) - Show help

## Key Features

### Smart Operations (No ID Required)
- `done` - Completes currently active task
- `pause` - Pauses currently active task
- `start` - Starts first ready task if no ID specified
- `resume` - Resumes first paused task if no ID specified
- `drop` - Drops currently active task if no ID specified

### REPL Mode Benefits
- **Continuous Display**: Always shows current task status
- **Short Commands**: Use `tl` instead of `task list`
- **Smart Refresh**: Auto-refreshes display after operations
- **Active Task Focus**: Prominently displays current work

### Flexible Task Finding
- By ID: `start 1`
- By partial title: `delta auth "Authentication working"`
- No ID: `start` (picks first ready task)

## Examples

### Basic Workflow
```bash
# Start REPL mode
./taskell

# Quick capture
add Fix user login bug

# Define what success looks like
delta 1 User can log in with valid credentials and see dashboard

# Start working
start 1

# Add notes while working
note Found the issue in JWT token validation
note Middleware was not checking token expiry correctly

# Complete with final state
done Fixed token validation and expiry check, all tests passing
```

### Advanced Usage
```bash
# Multiple tasks
add Implement user dashboard
add Write API documentation  
add Fix mobile responsive layout

# Set completion criteria
delta 1 Dashboard shows user stats and recent activity
delta 2 API docs cover all endpoints with examples
delta 3 Layout works correctly on screens 320px and up

# Work with timeboxes
start 1 -t 25  # Start with 25-minute focus session

# Pause and switch tasks  
pause
start 3
```

### Command Aliases
- `tl` = `task list`
- `a` = `add`
- `d` = `delta`
- `s` = `start`
- `p` = `pause`
- `r` = `resume`
- `n` = `note`
- `l` = `list`
- `h` = `help`

## Data Storage

Tasks are stored in `taskell.json` in the current directory. The file is human-readable JSON and can be backed up or shared easily.

## Testing

```bash
deno test test/task-manager.test.ts
```

## Philosophy

This implementation captures the original Taskell concept:

1. **Tasks as State Changes**: Every task represents changing something from one state to another
2. **Actionability First**: Tasks must define completion criteria (delta) before they become actionable
3. **Focus on Current Work**: Only one task can be active at a time, encouraging focus
4. **Continuous Progress**: REPL mode keeps you aware of current status and next actions
5. **Minimal Friction**: Smart defaults and short commands reduce management overhead

The tool prioritizes being able to take action (行動に移れること) over complex project management features.