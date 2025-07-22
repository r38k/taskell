import { TaskManager } from './task-manager.ts'
import { Task, TaskStatus } from './types.ts'

export class TaskREPL {
  private taskManager: TaskManager
  private isRunning: boolean = false

  constructor() {
    this.taskManager = new TaskManager()
  }

  async start(): Promise<void> {
    console.log('\n🚀 Taskell REPL - Task State Management')
    console.log('Type "help" or "h" for commands, "quit" or "q" to exit\n')
    
    this.isRunning = true
    
    // Show initial status
    this.displayStatus()

    while (this.isRunning) {
      const input = await this.prompt('taskell> ')
      await this.processCommand(input.trim())
    }
  }

  private async prompt(message: string): Promise<string> {
    const buf = new Uint8Array(1024)
    await Deno.stdout.write(new TextEncoder().encode(message))
    const n = await Deno.stdin.read(buf)
    if (!n) return ''
    return new TextDecoder().decode(buf.subarray(0, n)).trim()
  }

  private displayStatus(): void {
    console.clear()
    console.log('═══════════════════════════════════════════════════════════════')
    
    const activeTask = this.taskManager.getActiveTask()
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
      console.log('───────────────────────────────────────────────────────────────')
    }

    const counts = this.taskManager.getStatusCounts()
    const pendingCount = counts.zatsu + counts.ready + counts.paused
    
    console.log(`📊 Tasks: ${pendingCount} pending | ${counts.active} active | ${counts.done} done | ${counts.dropped} dropped`)
    
    if (counts.zatsu > 0) {
      console.log(`\n📝 Zatsu (${counts.zatsu}) - Need completion criteria:`)
      const zatsuTasks = this.taskManager.list('zatsu').slice(0, 3)
      for (const task of zatsuTasks) {
        console.log(`   ${task.id}. ${task.title}`)
      }
      if (counts.zatsu > 3) console.log(`   ... and ${counts.zatsu - 3} more`)
    }

    if (counts.ready > 0) {
      console.log(`\n✅ Ready (${counts.ready}) - Available to start:`)
      const readyTasks = this.taskManager.list('ready').slice(0, 3)
      for (const task of readyTasks) {
        console.log(`   ${task.id}. ${task.title}`)
        if (task.delta) console.log(`      → ${task.delta}`)
      }
      if (counts.ready > 3) console.log(`   ... and ${counts.ready - 3} more`)
    }

    if (counts.paused > 0) {
      console.log(`\n⏸️ Paused (${counts.paused}):`)
      const pausedTasks = this.taskManager.list('paused').slice(0, 2)
      for (const task of pausedTasks) {
        console.log(`   ${task.id}. ${task.title} (${task.timeSpent}min spent)`)
      }
    }

    console.log('═══════════════════════════════════════════════════════════════')
  }

  private async processCommand(input: string): Promise<void> {
    if (!input) {
      this.displayStatus()
      return
    }

    const [cmd, ...args] = input.split(' ')
    const command = cmd.toLowerCase()
    
    let result
    
    try {
      switch (command) {
        // Help
        case 'help':
        case 'h':
          this.showHelp()
          break

        // Add task (zatsu state)
        case 'add':
        case 'a':
          const title = args.join(' ')
          if (!title) {
            console.log('Usage: add <task title>')
            break
          }
          result = this.taskManager.add(title)
          console.log(result.message)
          break

        // Set completion criteria (zatsu -> ready)
        case 'delta':
        case 'd':
          if (args.length < 2) {
            console.log('Usage: delta <id> <completion criteria>')
            break
          }
          const [id, ...deltaParts] = args
          result = this.taskManager.setDelta(id, deltaParts.join(' '))
          console.log(result.message)
          break

        // Start task (ready -> active)
        case 'start':
        case 's':
          const taskId = args[0]
          const timeBox = args.includes('-t') ? parseInt(args[args.indexOf('-t') + 1]) : undefined
          result = this.taskManager.start(taskId, timeBox)
          console.log(result.message)
          break

        // Complete active task
        case 'done':
          const finalState = args.join(' ')
          result = this.taskManager.done(finalState || undefined)
          console.log(result.message)
          break

        // Pause active task
        case 'pause':
        case 'p':
          result = this.taskManager.pause()
          console.log(result.message)
          break

        // Resume paused task
        case 'resume':
        case 'r':
          const resumeId = args[0]
          result = this.taskManager.resume(resumeId)
          console.log(result.message)
          break

        // Drop task
        case 'drop':
          const dropId = args[0]
          result = this.taskManager.drop(dropId)
          console.log(result.message)
          break

        // Add note to active task
        case 'note':
        case 'n':
          const noteText = args.join(' ')
          if (!noteText) {
            console.log('Usage: note <text>')
            break
          }
          result = this.taskManager.note(noteText)
          console.log(result.message)
          break

        // List tasks
        case 'list':
        case 'l':
        case 'tl': // Short alias
          const filter = args[0] as TaskStatus | 'pending' | undefined
          this.displayTaskList(filter)
          break

        // Show task details
        case 'show':
          if (!args[0]) {
            console.log('Usage: show <id>')
            break
          }
          this.showTaskDetails(args[0])
          break

        // Quit
        case 'quit':
        case 'q':
        case 'exit':
          this.isRunning = false
          console.log('Goodbye! 👋')
          return

        // Clear screen and refresh
        case 'clear':
        case 'c':
          this.displayStatus()
          break

        default:
          console.log(`Unknown command: ${command}. Type "help" for available commands.`)
      }
    } catch (error) {
      console.log(`Error: ${error.message}`)
    }

    // Wait a moment before refreshing status
    if (this.isRunning && command !== 'list' && command !== 'l' && command !== 'tl' && command !== 'show' && command !== 'help') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.displayStatus()
    }
  }

  private showHelp(): void {
    console.log(`
📚 Taskell Commands:

📝 Task Management:
  add <title>           (a)  Add task in zatsu state
  delta <id> <criteria> (d)  Set completion criteria (zatsu → ready)
  start [id] [-t min]   (s)  Start task (ready → active) 
  done [final_state]         Complete active task
  pause                 (p)  Pause active task
  resume [id]           (r)  Resume paused task
  drop [id]                  Abandon task
  note <text>           (n)  Add note to active task

📋 Information:
  list [filter]         (l, tl) List tasks (zatsu|ready|active|paused|done|dropped|pending)
  show <id>                  Show task details
  clear                 (c)  Refresh display
  help                  (h)  Show this help

🚪 Exit:
  quit                  (q)  Exit REPL

💡 Tips:
- Press Enter alone to refresh display
- No ID needed for done/pause (works on active task)
- start without ID picks first ready task
- Tasks flow: zatsu → ready → active → done
`)
  }

  private displayTaskList(filter?: TaskStatus | 'pending'): void {
    const tasks = this.taskManager.list(filter)
    
    if (tasks.length === 0) {
      console.log(`No ${filter || 'all'} tasks found.`)
      return
    }

    console.log(`\n📋 ${filter ? filter.toUpperCase() : 'ALL'} Tasks (${tasks.length}):`)
    console.log('───────────────────────────────────────────────────────────────')
    
    for (const task of tasks) {
      const statusIcon = this.getStatusIcon(task.status)
      const timeInfo = task.timeSpent > 0 ? ` (${task.timeSpent}min)` : ''
      
      console.log(`${statusIcon} ${task.id}. ${task.title}${timeInfo}`)
      
      if (task.delta) {
        console.log(`   Goal: ${task.delta}`)
      }
      if (task.finalState) {
        console.log(`   Result: ${task.finalState}`)
      }
      if (task.notes.length > 0) {
        console.log(`   Notes: ${task.notes.length} entries`)
      }
    }
    console.log()
  }

  private showTaskDetails(identifier: string): void {
    const tasks = this.taskManager.list()
    const task = tasks.find(t => 
      t.id.toString() === identifier || 
      t.title.toLowerCase().includes(identifier.toLowerCase())
    )

    if (!task) {
      console.log('Task not found.')
      return
    }

    const statusIcon = this.getStatusIcon(task.status)
    
    console.log(`\n${statusIcon} Task #${task.id}: ${task.title}`)
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
    console.log()
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
}