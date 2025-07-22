import { Task, TaskStore } from './types.ts';

export class TaskManager {
  private store: TaskStore;
  private storePath: string;

  constructor(storePath = './taskell.json') {
    this.storePath = storePath;
    this.store = this.loadStore();
  }

  private loadStore(): TaskStore {
    try {
      const data = Deno.readTextFileSync(this.storePath);
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      parsed.tasks = parsed.tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
      return parsed;
    } catch {
      return { tasks: [], nextId: 1 };
    }
  }

  private saveStore(): void {
    Deno.writeTextFileSync(this.storePath, JSON.stringify(this.store, null, 2));
  }

  addTask(content: string): Task {
    const task: Task = {
      id: this.store.nextId++,
      content,
      done: false,
      createdAt: new Date(),
    };

    this.store.tasks.push(task);
    this.saveStore();
    return task;
  }

  markDone(id: number, stateDescription?: string): Task | null {
    const task = this.store.tasks.find(t => t.id === id);
    if (!task || task.done) {
      return null;
    }

    task.done = true;
    task.completedAt = new Date();
    if (stateDescription) {
      task.stateDescription = stateDescription;
    }

    this.saveStore();
    return task;
  }

  markUndone(id: number): Task | null {
    const task = this.store.tasks.find(t => t.id === id);
    if (!task || !task.done) {
      return null;
    }

    task.done = false;
    task.completedAt = undefined;
    task.stateDescription = undefined;

    this.saveStore();
    return task;
  }

  getTask(id: number): Task | null {
    return this.store.tasks.find(t => t.id === id) || null;
  }

  listTasks(): Task[] {
    return [...this.store.tasks];
  }

  listPendingTasks(): Task[] {
    return this.store.tasks.filter(task => !task.done);
  }

  listCompletedTasks(): Task[] {
    return this.store.tasks.filter(task => task.done);
  }

  deleteTask(id: number): boolean {
    const index = this.store.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    this.store.tasks.splice(index, 1);
    this.saveStore();
    return true;
  }
}