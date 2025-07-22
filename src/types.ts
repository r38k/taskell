export interface Task {
  id: number;
  content: string;
  status: 'zatsu' | 'ready' | 'active' | 'done' | 'paused' | 'dropped';
  delta?: string; // ΔS - completion criteria
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  finalState?: string; // Optional state description after completion
  notes: Note[];
  timeSpent: number; // minutes
  sessionStart?: Date;
}

export interface Note {
  timestamp: Date;
  content: string;
}

export interface TaskStore {
  tasks: Task[];
  nextId: number;
}

export type TaskCommand = 
  | 'add' | 'a'           // Add task (zatsu)
  | 'list' | 'l'          // List tasks  
  | 'delta' | 'd'         // Set completion criteria (zatsu → ready)
  | 'start' | 's'         // Start task (ready → active)
  | 'pause' | 'p'         // Pause task (active → paused)
  | 'resume'              // Resume task (paused → active)
  | 'done'                // Complete task (active → done)
  | 'drop' | 'x'          // Drop task (any → dropped)
  | 'note' | 'n'          // Add note to active task
  | 'show'                // Show task details
  | 'repl' | 'r'          // Enter REPL mode
  | 'help' | 'h'          // Show help
  | 'quit' | 'q';         // Quit REPL