import { TaskStore } from './types.ts';
import { createEmptyStore } from './task-functions.ts';

const DEFAULT_STORE_PATH = './taskell.json';

export function getStorePath(): string {
  return Deno.env.get('TASKELL_STORE_PATH') || DEFAULT_STORE_PATH;
}

export async function loadStore(): Promise<TaskStore> {
  try {
    const data = await Deno.readTextFile(getStorePath());
    const parsed = JSON.parse(data);
    
    // Deserialize dates
    const store: TaskStore = {
      ...parsed,
      tasks: parsed.tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        sessionStart: task.sessionStart ? new Date(task.sessionStart) : undefined,
        notes: task.notes.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp)
        }))
      }))
    };
    
    return store;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return createEmptyStore();
    }
    throw error;
  }
}

export async function saveStore(store: TaskStore): Promise<void> {
  const data = JSON.stringify(store, null, 2);
  await Deno.writeTextFile(getStorePath(), data);
}

export async function withStore<T>(
  operation: (store: TaskStore) => TaskStore | Promise<TaskStore>
): Promise<TaskStore> {
  const store = await loadStore();
  const newStore = await operation(store);
  await saveStore(newStore);
  return newStore;
}