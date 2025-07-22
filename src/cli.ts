import { TaskManager } from './task-manager.ts';
import { Task } from './types.ts';

const taskManager = new TaskManager();

function formatTask(task: Task): string {
  const status = task.done ? '✓' : '○';
  const date = task.done 
    ? ` (completed ${task.completedAt?.toLocaleDateString()})`
    : ` (created ${task.createdAt.toLocaleDateString()})`;
  
  let output = `[${task.id}] ${status} ${task.content}${date}`;
  
  if (task.stateDescription) {
    output += `\n    → ${task.stateDescription}`;
  }
  
  return output;
}

function showUsage() {
  console.log(`
Taskell - Simple Task Management

Usage:
  taskell add "task content"                 Add a new task
  taskell done <id> ["state description"]   Mark task as done (with optional state)
  taskell undone <id>                       Mark task as not done
  taskell list                              List all tasks
  taskell pending                           List pending tasks only
  taskell completed                         List completed tasks only
  taskell show <id>                         Show task details
  taskell delete <id>                       Delete a task

Examples:
  taskell add "Fix API authentication bug"
  taskell done 1 "Fixed token validation logic"
  taskell done 2
  taskell list
  `);
}

export function main() {
  const args = Deno.args;
  
  if (args.length === 0) {
    showUsage();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'add':
      if (args.length < 2) {
        console.log('Error: Task content is required');
        console.log('Usage: taskell add "task content"');
        return;
      }
      const content = args.slice(1).join(' ');
      const task = taskManager.addTask(content);
      console.log(`Added task [${task.id}]: ${task.content}`);
      break;

    case 'done':
      if (args.length < 2) {
        console.log('Error: Task ID is required');
        console.log('Usage: taskell done <id> ["state description"]');
        return;
      }
      const doneId = parseInt(args[1]);
      if (isNaN(doneId)) {
        console.log('Error: Invalid task ID');
        return;
      }
      const stateDescription = args.length > 2 ? args.slice(2).join(' ') : undefined;
      const doneTask = taskManager.markDone(doneId, stateDescription);
      if (doneTask) {
        console.log(`Marked task [${doneTask.id}] as done: ${doneTask.content}`);
        if (stateDescription) {
          console.log(`State: ${stateDescription}`);
        }
      } else {
        console.log('Error: Task not found or already completed');
      }
      break;

    case 'undone':
      if (args.length < 2) {
        console.log('Error: Task ID is required');
        console.log('Usage: taskell undone <id>');
        return;
      }
      const undoneId = parseInt(args[1]);
      if (isNaN(undoneId)) {
        console.log('Error: Invalid task ID');
        return;
      }
      const undoneTask = taskManager.markUndone(undoneId);
      if (undoneTask) {
        console.log(`Marked task [${undoneTask.id}] as not done: ${undoneTask.content}`);
      } else {
        console.log('Error: Task not found or already pending');
      }
      break;

    case 'list':
      const allTasks = taskManager.listTasks();
      if (allTasks.length === 0) {
        console.log('No tasks found');
      } else {
        console.log('All tasks:');
        allTasks.forEach(task => {
          console.log(formatTask(task));
        });
      }
      break;

    case 'pending':
      const pendingTasks = taskManager.listPendingTasks();
      if (pendingTasks.length === 0) {
        console.log('No pending tasks');
      } else {
        console.log('Pending tasks:');
        pendingTasks.forEach(task => {
          console.log(formatTask(task));
        });
      }
      break;

    case 'completed':
      const completedTasks = taskManager.listCompletedTasks();
      if (completedTasks.length === 0) {
        console.log('No completed tasks');
      } else {
        console.log('Completed tasks:');
        completedTasks.forEach(task => {
          console.log(formatTask(task));
        });
      }
      break;

    case 'show':
      if (args.length < 2) {
        console.log('Error: Task ID is required');
        console.log('Usage: taskell show <id>');
        return;
      }
      const showId = parseInt(args[1]);
      if (isNaN(showId)) {
        console.log('Error: Invalid task ID');
        return;
      }
      const showTask = taskManager.getTask(showId);
      if (showTask) {
        console.log('Task details:');
        console.log(formatTask(showTask));
      } else {
        console.log('Error: Task not found');
      }
      break;

    case 'delete':
      if (args.length < 2) {
        console.log('Error: Task ID is required');
        console.log('Usage: taskell delete <id>');
        return;
      }
      const deleteId = parseInt(args[1]);
      if (isNaN(deleteId)) {
        console.log('Error: Invalid task ID');
        return;
      }
      const deleted = taskManager.deleteTask(deleteId);
      if (deleted) {
        console.log(`Deleted task [${deleteId}]`);
      } else {
        console.log('Error: Task not found');
      }
      break;

    default:
      console.log(`Error: Unknown command "${command}"`);
      showUsage();
  }
}

if (import.meta.main) {
  main();
}