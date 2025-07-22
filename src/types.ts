// Core types for Taskell - Task state transition management

export type TaskStatus = 
  | 'zatsu'   // Quick capture, no completion criteria yet
  | 'ready'   // Has completion criteria (delta), ready to work on  
  | 'active'  // Currently being worked on
  | 'paused'  // Temporarily paused
  | 'done'    // Completed
  | 'dropped' // Abandoned/cancelled

export interface Task {
  id: number
  title: string
  status: TaskStatus
  delta?: string        // Completion criteria (what success looks like)
  finalState?: string   // Description of final state after completion
  created: Date
  updated: Date
  startTime?: Date      // When task was started (active)
  notes: string[]       // Notes during execution
  timeSpent: number     // Minutes spent on task
}

export interface TaskStore {
  tasks: Task[]
  nextId: number
  activeTaskId?: number // Currently active task (if any)
}

export interface CommandResult {
  success: boolean
  message: string
  task?: Task
}