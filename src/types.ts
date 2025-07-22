export interface Task {
  id: number;
  content: string;
  done: boolean;
  stateDescription?: string; // optional description of final state after completion
  createdAt: Date;
  completedAt?: Date;
}

export interface TaskStore {
  tasks: Task[];
  nextId: number;
}