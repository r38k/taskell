import { TaskManager } from './task-manager.ts'
import { TaskREPL } from './repl.ts'
import { TaskStatus } from './types.ts'

export class TaskCLI {
  private taskManager: TaskManager

  constructor() {
    this.taskManager = new TaskManager()
  }

  async run(args: string[]): Promise<void> {
    // If no args, start REPL mode
    if (args.length === 0) {
      const repl = new TaskREPL()
      await repl.start()
      return
    }

    const [command, ...params] = args
    const cmd = command.toLowerCase()

    try {
      switch (cmd) {
        case 'add':
        case 'a':
          if (params.length === 0) {
            console.log('Usage: taskell add <task title>')
            Deno.exit(1)
          }
          const result = this.taskManager.add(params.join(' '))
          console.log(result.message)
          break

        case 'delta':
        case 'd':
          if (params.length < 2) {
            console.log('Usage: taskell delta <id> <completion criteria>')
            Deno.exit(1)
          }
          const [id, ...deltaParts] = params
          const deltaResult = this.taskManager.setDelta(id, deltaParts.join(' '))
          console.log(deltaResult.message)
          if (!deltaResult.success) Deno.exit(1)
          break

        case 'start':
        case 's':
          const taskId = params[0]
          const timeFlagIndex = params.indexOf('-t')
          const timeBox = timeFlagIndex !== -1 ? parseInt(params[timeFlagIndex + 1]) : undefined
          const startResult = this.taskManager.start(taskId, timeBox)
          console.log(startResult.message)
          if (!startResult.success) Deno.exit(1)
          break

        case 'done':
          const finalState = params.join(' ')
          const doneResult = this.taskManager.done(finalState || undefined)
          console.log(doneResult.message)
          if (!doneResult.success) Deno.exit(1)
          break

        case 'pause':
        case 'p':
          const pauseResult = this.taskManager.pause()
          console.log(pauseResult.message)
          if (!pauseResult.success) Deno.exit(1)
          break

        case 'resume':
        case 'r':
          const resumeId = params[0]
          const resumeResult = this.taskManager.resume(resumeId)
          console.log(resumeResult.message)
          if (!resumeResult.success) Deno.exit(1)
          break

        case 'drop':
          const dropId = params[0]
          const dropResult = this.taskManager.drop(dropId)
          console.log(dropResult.message)
          if (!dropResult.success) Deno.exit(1)
          break

        case 'note':
        case 'n':
          if (params.length === 0) {
            console.log('Usage: taskell note <text>')
            Deno.exit(1)
          }
          const noteResult = this.taskManager.note(params.join(' '))
          console.log(noteResult.message)
          if (!noteResult.success) Deno.exit(1)
          break

        case 'list':
        case 'l':
        case 'tl': // Short alias for task list
          const filter = params[0] as TaskStatus | 'pending' | undefined
          this.displayTaskList(filter)
          break

        case 'show':
          if (params.length === 0) {
            console.log('Usage: taskell show <id>')
            Deno.exit(1)
          }
          this.showTaskDetails(params[0])
          break

        case 'status':
        case 'st':
          this.displayStatus()
          break

        case 'repl':
          const repl = new TaskREPL()
          await repl.start()
          break

        case 'help':
        case 'h':
          this.showHelp()
          break

        default:
          console.log(`Unknown command: ${command}`)
          console.log('Run "taskell help" for available commands, or "taskell" for REPL mode.')
          Deno.exit(1)
      }
    } catch (error) {
      console.error(`Error: ${error.message}`)
      Deno.exit(1)
    }
  }

  private displayStatus(): void {
    const counts = this.taskManager.getStatusCounts()
    const activeTask = this.taskManager.getActiveTask()
    
    console.log('📊 Taskell Status')
    console.log('═══════════════════════════════════════════════════════════════')
    
    if (activeTask) {
      const timeWorking = activeTask.startTime 
        ? Math.floor((Date.now() - activeTask.startTime.getTime()) / (1000 * 60))
        : 0
      
      console.log(`🔥 ACTIVE: ${activeTask.title}`)
      if (activeTask.delta) {
        console.log(`   Goal: ${activeTask.delta}`)
      }
      if (timeWorking > 0) {
        console.log(`   Working for: ${timeWorking} minutes`)
      }
    } else {
      console.log('No active task')
    }

    const pendingCount = counts.zatsu + counts.ready + counts.paused
    console.log(`\n📋 Summary: ${pendingCount} pending | ${counts.active} active | ${counts.done} done | ${counts.dropped} dropped`)
    console.log(`   Zatsu: ${counts.zatsu} | Ready: ${counts.ready} | Paused: ${counts.paused}`)
    
    if (counts.zatsu > 0) {
      console.log('\n📝 Next: Set completion criteria with "taskell delta <id> <criteria>"')
    } else if (counts.ready > 0) {
      console.log('\n✅ Next: Start working with "taskell start [id]"')
    }
  }

  private displayTaskList(filter?: TaskStatus | 'pending'): void {
    const tasks = this.taskManager.list(filter)
    
    if (tasks.length === 0) {
      console.log(`No ${filter || 'all'} tasks found.`)
      return
    }

    console.log(`📋 ${filter ? filter.toUpperCase() : 'ALL'} Tasks (${tasks.length}):`)
    
    for (const task of tasks) {
      const statusIcon = this.getStatusIcon(task.status)
      const timeInfo = task.timeSpent > 0 ? ` (${task.timeSpent}min)` : ''
      
      console.log(`${statusIcon} ${task.id}. ${task.title}${timeInfo}`)
      
      if (task.delta) {
        console.log(`   Goal: ${task.delta}`)
      }
      if (task.finalState) {
        console.log(`   → ${task.finalState}`)
      }
    }
  }

  private showTaskDetails(identifier: string): void {
    const tasks = this.taskManager.list()
    const task = tasks.find(t => 
      t.id.toString() === identifier || 
      t.title.toLowerCase().includes(identifier.toLowerCase())
    )

    if (!task) {
      console.log('Task not found.')
      Deno.exit(1)
    }

    const statusIcon = this.getStatusIcon(task.status)
    
    console.log(`${statusIcon} Task #${task.id}: ${task.title}`)
    console.log('───────────────────────────────────────────────────────────────')
    console.log(`Status: ${task.status}`)
    console.log(`Created: ${task.created.toLocaleString()}`)
    console.log(`Updated: ${task.updated.toLocaleString()}`)
    
    if (task.delta) {
      console.log(`Goal: ${task.delta}`)
    }
    if (task.finalState) {
      console.log(`Final State: ${task.finalState}`)
    }
    if (task.timeSpent > 0) {
      console.log(`Time Spent: ${task.timeSpent} minutes`)
    }
    
    if (task.notes.length > 0) {
      console.log(`\nNotes (${task.notes.length}):`)
      for (const note of task.notes) {
        console.log(`  ${note}`)
      }
    }
  }

  private getStatusIcon(status: TaskStatus): string {
    const icons = {
      zatsu: '📝',
      ready: '✅', 
      active: '🔥',
      paused: '⏸️',
      done: '✔️',
      dropped: '❌'
    }
    return icons[status] || '?'
  }

  private showHelp(): void {
    console.log(`
🚀 Taskell - Task State Management Tool

Usage:
  taskell [command] [args...]    Run single command
  taskell                       Start REPL mode (interactive)

📝 Task Management Commands:
  add <title>           (a)  Add task in zatsu state
  delta <id> <criteria> (d)  Set completion criteria (zatsu → ready)
  start [id] [-t min]   (s)  Start task (ready → active)
  done [final_state]         Complete active task
  pause                 (p)  Pause active task  
  resume [id]           (r)  Resume paused task
  drop [id]                  Abandon task
  note <text>           (n)  Add note to active task

📋 Information Commands:
  list [filter]         (l, tl) List tasks
  show <id>                  Show task details  
  status                (st) Show summary status
  help                  (h)  Show this help

🔄 Task Flow:
  zatsu → ready → active → done
            ↓       ↓
          paused  dropped

💡 Examples:
  taskell add "Fix authentication bug"
  taskell delta 1 "User can log in successfully"
  taskell start 1 -t 25
  taskell note "Found the issue in middleware"
  taskell done "Fixed token validation logic"

🚪 REPL Mode:
  Run "taskell" without arguments for interactive mode with
  continuous task display and shorter commands.
`)
  }
}

// Main entry point
if (import.meta.main) {
  const cli = new TaskCLI()
  await cli.run(Deno.args)
}