import { Task, TaskStore, Note } from './types.ts';

export function createEmptyStore(): TaskStore {
  return {
    tasks: [],
    nextId: 1
  };
}

export function addTask(store: TaskStore, content: string): TaskStore {
  const task: Task = {
    id: store.nextId,
    content,
    status: 'zatsu',
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: [],
    timeSpent: 0
  };
  
  return {
    ...store,
    tasks: [...store.tasks, task],
    nextId: store.nextId + 1
  };
}

export function setDelta(store: TaskStore, taskId: number, delta: string): TaskStore {
  return {
    ...store,
    tasks: store.tasks.map(task => 
      task.id === taskId && task.status === 'zatsu'
        ? { ...task, delta, status: 'ready', updatedAt: new Date() }
        : task
    )
  };
}

export function startTask(store: TaskStore, taskId: number): TaskStore {
  // Only allow one active task at a time
  const hasActiveTask = store.tasks.some(t => t.status === 'active');
  if (hasActiveTask) {
    throw new Error('Another task is already active. Pause it first.');
  }
  
  return {
    ...store,
    tasks: store.tasks.map(task =>
      task.id === taskId && (task.status === 'ready' || task.status === 'paused')
        ? { 
            ...task, 
            status: 'active', 
            updatedAt: new Date(),
            sessionStart: new Date()
          }
        : task
    )
  };
}

export function pauseTask(store: TaskStore, taskId: number): TaskStore {
  return {
    ...store,
    tasks: store.tasks.map(task => {
      if (task.id === taskId && task.status === 'active') {
        const sessionTime = task.sessionStart 
          ? Math.round((new Date().getTime() - task.sessionStart.getTime()) / 60000)
          : 0;
        
        return {
          ...task,
          status: 'paused',
          updatedAt: new Date(),
          timeSpent: task.timeSpent + sessionTime,
          sessionStart: undefined
        };
      }
      return task;
    })
  };
}

export function completeTask(store: TaskStore, taskId: number, finalState?: string): TaskStore {
  return {
    ...store,
    tasks: store.tasks.map(task => {
      if (task.id === taskId && task.status === 'active') {
        const sessionTime = task.sessionStart 
          ? Math.round((new Date().getTime() - task.sessionStart.getTime()) / 60000)
          : 0;
        
        return {
          ...task,
          status: 'done',
          finalState,
          completedAt: new Date(),
          updatedAt: new Date(),
          timeSpent: task.timeSpent + sessionTime,
          sessionStart: undefined
        };
      }
      return task;
    })
  };
}

export function dropTask(store: TaskStore, taskId: number): TaskStore {
  return {
    ...store,
    tasks: store.tasks.map(task =>
      task.id === taskId && task.status !== 'done'
        ? { ...task, status: 'dropped', updatedAt: new Date() }
        : task
    )
  };
}

export function addNote(store: TaskStore, taskId: number, content: string): TaskStore {
  const note: Note = {
    timestamp: new Date(),
    content
  };
  
  return {
    ...store,
    tasks: store.tasks.map(task =>
      task.id === taskId
        ? { ...task, notes: [...task.notes, note], updatedAt: new Date() }
        : task
    )
  };
}

// Smart getters
export function getActiveTask(store: TaskStore): Task | undefined {
  return store.tasks.find(t => t.status === 'active');
}

export function getReadyTasks(store: TaskStore): Task[] {
  return store.tasks.filter(t => t.status === 'ready');
}

export function getPendingTasks(store: TaskStore): Task[] {
  return store.tasks.filter(t => !['done', 'dropped'].includes(t.status));
}

export function getCompletedTasks(store: TaskStore): Task[] {
  return store.tasks.filter(t => t.status === 'done');
}

export function findTask(store: TaskStore, id: number): Task | undefined {
  return store.tasks.find(t => t.id === id);
}

// Smart operation helpers
export function canStart(task: Task): boolean {
  return task.status === 'ready' || task.status === 'paused';
}

export function canComplete(task: Task): boolean {
  return task.status === 'active';
}

export function canSetDelta(task: Task): boolean {
  return task.status === 'zatsu';
}