import { Task, TaskStatus, TaskStore, CommandResult } from './types.ts'

export class TaskManager {
  private store: TaskStore
  private storeFile: string

  constructor(storeFile = 'taskell.json') {
    this.storeFile = storeFile
    this.store = this.loadStore()
  }

  private loadStore(): TaskStore {
    try {
      const data = Deno.readTextFileSync(this.storeFile)
      const parsed = JSON.parse(data)
      // Convert date strings back to Date objects
      parsed.tasks = parsed.tasks.map((task: any) => ({
        ...task,
        created: new Date(task.created),
        updated: new Date(task.updated),
        startTime: task.startTime ? new Date(task.startTime) : undefined
      }))
      return parsed
    } catch {
      return { tasks: [], nextId: 1 }
    }
  }

  private saveStore(): void {
    try {
      Deno.writeTextFileSync(this.storeFile, JSON.stringify(this.store, null, 2))
    } catch (error) {
      console.error('Failed to save store:', error)
    }
  }

  // Add task in zatsu (quick capture) state
  add(title: string): CommandResult {
    const task: Task = {
      id: this.store.nextId++,
      title: title.trim(),
      status: 'zatsu',
      created: new Date(),
      updated: new Date(),
      notes: [],
      timeSpent: 0
    }
    
    this.store.tasks.push(task)
    this.saveStore()
    
    return {
      success: true,
      message: `Task added: "${task.title}" (id: ${task.id}, status: zatsu)`,
      task
    }
  }

  // Set completion criteria (delta) - moves task from zatsu to ready
  setDelta(identifier: string | number, delta: string): CommandResult {
    const task = this.findTask(identifier)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    if (task.status !== 'zatsu') {
      return { success: false, message: `Cannot set delta for task in ${task.status} state` }
    }

    task.delta = delta.trim()
    task.status = 'ready'
    task.updated = new Date()
    this.saveStore()

    return {
      success: true,
      message: `Task "${task.title}" is now ready with completion criteria: "${delta}"`,
      task
    }
  }

  // Start working on a task (moves ready -> active)
  start(identifier?: string | number, timeBox?: number): CommandResult {
    // If no identifier, try to start the first ready task
    let task: Task | undefined
    if (identifier) {
      task = this.findTask(identifier)
    } else {
      task = this.store.tasks.find(t => t.status === 'ready')
    }

    if (!task) {
      return { 
        success: false, 
        message: identifier ? 'Task not found' : 'No ready tasks available to start'
      }
    }

    if (task.status !== 'ready') {
      return { success: false, message: `Cannot start task in ${task.status} state` }
    }

    // Check if another task is active
    if (this.store.activeTaskId) {
      const activeTask = this.store.tasks.find(t => t.id === this.store.activeTaskId)
      if (activeTask) {
        return { 
          success: false, 
          message: `Task "${activeTask.title}" is already active. Pause it first.` 
        }
      }
    }

    task.status = 'active'
    task.startTime = new Date()
    task.updated = new Date()
    this.store.activeTaskId = task.id
    this.saveStore()

    let message = `Started working on: "${task.title}"`
    if (timeBox) {
      message += ` (${timeBox} min timebox)`
    }

    return { success: true, message, task }
  }

  // Complete the currently active task
  done(finalState?: string): CommandResult {
    const activeTask = this.store.tasks.find(t => t.status === 'active')
    if (!activeTask) {
      return { success: false, message: 'No active task to complete' }
    }

    activeTask.status = 'done'
    if (finalState) {
      activeTask.finalState = finalState.trim()
    }
    activeTask.updated = new Date()
    
    // Calculate time spent
    if (activeTask.startTime) {
      const timeSpent = Math.floor((Date.now() - activeTask.startTime.getTime()) / (1000 * 60))
      activeTask.timeSpent += timeSpent
    }

    this.store.activeTaskId = undefined
    this.saveStore()

    let message = `Completed: "${activeTask.title}"`
    if (finalState) {
      message += ` → ${finalState}`
    }

    return { success: true, message, task: activeTask }
  }

  // Pause the currently active task
  pause(): CommandResult {
    const activeTask = this.store.tasks.find(t => t.status === 'active')
    if (!activeTask) {
      return { success: false, message: 'No active task to pause' }
    }

    activeTask.status = 'paused'
    activeTask.updated = new Date()
    
    // Calculate time spent so far
    if (activeTask.startTime) {
      const timeSpent = Math.floor((Date.now() - activeTask.startTime.getTime()) / (1000 * 60))
      activeTask.timeSpent += timeSpent
    }

    this.store.activeTaskId = undefined
    this.saveStore()

    return { 
      success: true, 
      message: `Paused: "${activeTask.title}"`,
      task: activeTask 
    }
  }

  // Resume a paused task
  resume(identifier?: string | number): CommandResult {
    let task: Task | undefined
    if (identifier) {
      task = this.findTask(identifier)
    } else {
      // Find first paused task
      task = this.store.tasks.find(t => t.status === 'paused')
    }

    if (!task) {
      return { 
        success: false, 
        message: identifier ? 'Task not found' : 'No paused tasks to resume'
      }
    }

    if (task.status !== 'paused') {
      return { success: false, message: `Cannot resume task in ${task.status} state` }
    }

    // Check if another task is active
    if (this.store.activeTaskId) {
      return { success: false, message: 'Another task is already active' }
    }

    task.status = 'active'
    task.startTime = new Date()
    task.updated = new Date()
    this.store.activeTaskId = task.id
    this.saveStore()

    return { 
      success: true, 
      message: `Resumed: "${task.title}"`,
      task 
    }
  }

  // Drop/abandon a task
  drop(identifier?: string | number): CommandResult {
    let task: Task | undefined
    if (identifier) {
      task = this.findTask(identifier)
    } else {
      // Drop currently active task
      task = this.store.tasks.find(t => t.status === 'active')
    }

    if (!task) {
      return { 
        success: false, 
        message: identifier ? 'Task not found' : 'No active task to drop'
      }
    }

    task.status = 'dropped'
    task.updated = new Date()
    
    if (this.store.activeTaskId === task.id) {
      this.store.activeTaskId = undefined
    }

    this.saveStore()

    return { 
      success: true, 
      message: `Dropped: "${task.title}"`,
      task 
    }
  }

  // Add note to currently active task
  note(text: string): CommandResult {
    const activeTask = this.store.tasks.find(t => t.status === 'active')
    if (!activeTask) {
      return { success: false, message: 'No active task to add note to' }
    }

    const timestamp = new Date().toLocaleTimeString()
    activeTask.notes.push(`[${timestamp}] ${text.trim()}`)
    activeTask.updated = new Date()
    this.saveStore()

    return { 
      success: true, 
      message: `Note added to "${activeTask.title}"`,
      task: activeTask 
    }
  }

  // List tasks with filtering
  list(filter?: 'zatsu' | 'ready' | 'active' | 'paused' | 'done' | 'dropped' | 'pending'): Task[] {
    let tasks = this.store.tasks
    
    if (filter) {
      if (filter === 'pending') {
        tasks = tasks.filter(t => ['zatsu', 'ready', 'active', 'paused'].includes(t.status))
      } else {
        tasks = tasks.filter(t => t.status === filter)
      }
    }
    
    return tasks.sort((a, b) => b.updated.getTime() - a.updated.getTime())
  }

  // Get currently active task
  getActiveTask(): Task | undefined {
    return this.store.tasks.find(t => t.status === 'active')
  }

  // Get task counts by status
  getStatusCounts(): Record<TaskStatus, number> {
    const counts = { zatsu: 0, ready: 0, active: 0, paused: 0, done: 0, dropped: 0 }
    for (const task of this.store.tasks) {
      counts[task.status]++
    }
    return counts
  }

  private findTask(identifier: string | number): Task | undefined {
    if (typeof identifier === 'number') {
      return this.store.tasks.find(t => t.id === identifier)
    }
    
    const id = parseInt(identifier)
    if (!isNaN(id)) {
      return this.store.tasks.find(t => t.id === id)
    }
    
    // Try to match by title (partial)
    return this.store.tasks.find(t => 
      t.title.toLowerCase().includes(identifier.toLowerCase())
    )
  }
}