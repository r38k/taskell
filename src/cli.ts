import { TaskCommand, Task } from './types.ts';
import {
  addTask,
  setDelta,
  startTask,
  pauseTask,
  completeTask,
  dropTask,
  addNote,
  getActiveTask,
  getReadyTasks,
  getPendingTasks,
  getCompletedTasks,
  findTask
} from './task-functions.ts';
import { loadStore, saveStore, withStore } from './persistence.ts';

export function parseCommand(input: string): { command: TaskCommand; args: string[] } {
  const parts = input.trim().split(/\s+/);
  const command = parts[0] as TaskCommand;
  const args = parts.slice(1);
  return { command, args };
}

export function formatTask(task: Task, showDetails = false): string {
  const statusIcon = {
    'zatsu': '💭',
    'ready': '🎯', 
    'active': '⚡',
    'done': '✅',
    'paused': '⏸️',
    'dropped': '❌'
  }[task.status];
  
  const timeStr = task.timeSpent > 0 ? ` (${task.timeSpent}m)` : '';
  let result = `${statusIcon} [${task.id}] ${task.content}${timeStr}`;
  
  if (showDetails) {
    if (task.delta) result += `\n    ΔS: ${task.delta}`;
    if (task.finalState) result += `\n    Final: ${task.finalState}`;
    if (task.notes.length > 0) {
      result += `\n    Notes: ${task.notes.length} entries`;
    }
  }
  
  return result;
}

export function formatTaskList(tasks: Task[], title?: string): string {
  if (tasks.length === 0) return title ? `${title}\n  (none)` : '(no tasks)';
  
  const formatted = tasks.map(task => `  ${formatTask(task)}`).join('\n');
  return title ? `${title}\n${formatted}` : formatted;
}

export async function executeCommand(command: TaskCommand, args: string[]): Promise<string> {
  switch (command) {
    case 'add':
    case 'a': {
      if (args.length === 0) return 'Usage: add <content>';
      const content = args.join(' ');
      const store = await withStore(store => addTask(store, content));
      const newTask = store.tasks[store.tasks.length - 1];
      return `Added task ${newTask.id}: ${content}`;
    }

    case 'list':
    case 'l': {
      const store = await loadStore();
      const pending = getPendingTasks(store);
      return formatTaskList(pending, 'Tasks:');
    }

    case 'delta':
    case 'd': {
      if (args.length < 2) return 'Usage: delta <id> <criteria>';
      const id = parseInt(args[0]);
      const delta = args.slice(1).join(' ');
      
      try {
        await withStore(store => setDelta(store, id, delta));
        return `Set completion criteria for task ${id}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    case 'start':
    case 's': {
      const store = await loadStore();
      let targetId: number;
      
      if (args.length === 0) {
        // Smart default: start first ready task
        const readyTasks = getReadyTasks(store);
        if (readyTasks.length === 0) return 'No ready tasks to start';
        targetId = readyTasks[0].id;
      } else {
        targetId = parseInt(args[0]);
      }
      
      try {
        await withStore(store => startTask(store, targetId));
        return `Started task ${targetId}`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    case 'pause':
    case 'p': {
      const store = await loadStore();
      let targetId: number;
      
      if (args.length === 0) {
        // Smart default: pause active task
        const activeTask = getActiveTask(store);
        if (!activeTask) return 'No active task to pause';
        targetId = activeTask.id;
      } else {
        targetId = parseInt(args[0]);
      }
      
      await withStore(store => pauseTask(store, targetId));
      return `Paused task ${targetId}`;
    }

    case 'done': {
      const store = await loadStore();
      let targetId: number;
      let finalState: string | undefined;
      
      if (args.length === 0) {
        // Smart default: complete active task
        const activeTask = getActiveTask(store);
        if (!activeTask) return 'No active task to complete';
        targetId = activeTask.id;
      } else {
        targetId = parseInt(args[0]);
        finalState = args.slice(1).join(' ') || undefined;
      }
      
      await withStore(store => completeTask(store, targetId, finalState));
      const finalText = finalState ? ` with state: ${finalState}` : '';
      return `Completed task ${targetId}${finalText}`;
    }

    case 'drop':
    case 'x': {
      if (args.length === 0) return 'Usage: drop <id>';
      const id = parseInt(args[0]);
      await withStore(store => dropTask(store, id));
      return `Dropped task ${id}`;
    }

    case 'note':
    case 'n': {
      const store = await loadStore();
      let targetId: number;
      let content: string;
      
      if (args.length === 0) return 'Usage: note <content> or note <id> <content>';
      
      // Smart default: add note to active task if no ID provided
      const activeTask = getActiveTask(store);
      if (activeTask && isNaN(parseInt(args[0]))) {
        targetId = activeTask.id;
        content = args.join(' ');
      } else {
        targetId = parseInt(args[0]);
        content = args.slice(1).join(' ');
      }
      
      if (!content) return 'Note content required';
      
      await withStore(store => addNote(store, targetId, content));
      return `Added note to task ${targetId}`;
    }

    case 'show': {
      if (args.length === 0) return 'Usage: show <id>';
      const id = parseInt(args[0]);
      const store = await loadStore();
      const task = findTask(store, id);
      
      if (!task) return `Task ${id} not found`;
      
      let result = formatTask(task, true);
      if (task.notes.length > 0) {
        result += '\n  Notes:';
        task.notes.forEach(note => {
          const time = note.timestamp.toLocaleTimeString();
          result += `\n    ${time}: ${note.content}`;
        });
      }
      return result;
    }

    case 'help':
    case 'h':
      return `
Taskell Commands:
  a, add <content>      Add new task (zatsu status)
  d, delta <id> <crit>  Set completion criteria (zatsu → ready)  
  s, start [id]         Start task (ready → active)
  p, pause [id]         Pause active task
  done [id] [state]     Complete task with optional final state
  x, drop <id>          Drop task
  n, note <content>     Add note to active task
  note <id> <content>   Add note to specific task
  l, list               List all pending tasks
  show <id>             Show task details
  r, repl               Enter interactive mode
  h, help               Show this help
  q, quit               Quit (in REPL mode)

Smart defaults: Most commands work without IDs when context is clear.
      `.trim();

    case 'quit':
    case 'q':
      return 'quit';

    default:
      return `Unknown command: ${command}. Type 'help' for usage.`;
  }
}

export async function showCurrentTask(): Promise<string> {
  const store = await loadStore();
  const activeTask = getActiveTask(store);
  
  if (activeTask) {
    const elapsed = activeTask.sessionStart 
      ? Math.round((Date.now() - activeTask.sessionStart.getTime()) / 60000)
      : 0;
    const elapsedStr = elapsed > 0 ? ` (${elapsed}m)` : '';
    return `⚡ Current: ${formatTask(activeTask)}${elapsedStr}`;
  }
  
  const readyTasks = getReadyTasks(store);
  if (readyTasks.length > 0) {
    return `🎯 Ready: ${readyTasks.length} task(s) - type 's' to start first`;
  }
  
  return '💭 No active task - type "help" for commands';
}