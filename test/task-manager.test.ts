import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { TaskManager } from '../src/task-manager.ts'
import { TaskStatus } from '../src/types.ts'

// Helper function to clean up test files
const cleanupTestFile = (filename: string) => {
  try {
    Deno.removeSync(filename)
  } catch {
    // File doesn't exist, ignore
  }
}

Deno.test('TaskManager - Basic Task Lifecycle', () => {
  const testFile = 'test-taskell.json'
  cleanupTestFile(testFile)
  
  const manager = new TaskManager(testFile)
  
  // Test adding task (zatsu state)
  const addResult = manager.add('Fix API bug')
  assert(addResult.success)
  assertEquals(addResult.task?.status, 'zatsu')
  assertEquals(addResult.task?.title, 'Fix API bug')
  
  // Test setting delta (zatsu → ready)
  const deltaResult = manager.setDelta(1, 'API returns 200 with valid response')
  assert(deltaResult.success)
  assertEquals(deltaResult.task?.status, 'ready')
  assertEquals(deltaResult.task?.delta, 'API returns 200 with valid response')
  
  // Test starting task (ready → active)
  const startResult = manager.start(1)
  assert(startResult.success)
  assertEquals(startResult.task?.status, 'active')
  assertExists(startResult.task?.startTime)
  
  // Test completing task (active → done)
  const doneResult = manager.done('Fixed token validation issue')
  assert(doneResult.success)
  assertEquals(doneResult.task?.status, 'done')
  assertEquals(doneResult.task?.finalState, 'Fixed token validation issue')
  
  cleanupTestFile(testFile)
})

Deno.test('TaskManager - State Transition Rules', () => {
  const testFile = 'test-taskell-2.json'
  cleanupTestFile(testFile)
  
  const manager = new TaskManager(testFile)
  
  // Add task in zatsu state
  manager.add('Test task')
  
  // Cannot start zatsu task (missing delta)
  const startZatsuResult = manager.start(1)
  assert(!startZatsuResult.success)
  
  // Set delta to make it ready
  manager.setDelta(1, 'Task completed successfully')
  
  // Now can start
  const startReadyResult = manager.start(1)
  assert(startReadyResult.success)
  assertEquals(startReadyResult.task?.status, 'active')
  
  // Cannot start another task while one is active
  manager.add('Second task')
  manager.setDelta(2, 'Second task done')
  const startSecondResult = manager.start(2)
  assert(!startSecondResult.success)
  
  cleanupTestFile(testFile)
})

Deno.test('TaskManager - Task Management Operations', () => {
  const testFile = 'test-taskell-3.json'
  cleanupTestFile(testFile)
  
  const manager = new TaskManager(testFile)
  
  // Add and prepare task
  manager.add('Task to pause')
  manager.setDelta(1, 'Task completed')
  manager.start(1)
  
  // Test pause
  const pauseResult = manager.pause()
  assert(pauseResult.success)
  assertEquals(pauseResult.task?.status, 'paused')
  
  // Test resume
  const resumeResult = manager.resume(1)
  assert(resumeResult.success)
  assertEquals(resumeResult.task?.status, 'active')
  
  // Test drop
  const dropResult = manager.drop(1)
  assert(dropResult.success)
  assertEquals(dropResult.task?.status, 'dropped')
  
  cleanupTestFile(testFile)
})

Deno.test('TaskManager - Notes and Time Tracking', () => {
  const testFile = 'test-taskell-4.json'
  cleanupTestFile(testFile)
  
  const manager = new TaskManager(testFile)
  
  // Prepare active task
  manager.add('Task with notes')
  manager.setDelta(1, 'Completed with notes')
  manager.start(1)
  
  // Add note
  const noteResult = manager.note('Making progress on the issue')
  assert(noteResult.success)
  assertEquals(noteResult.task?.notes.length, 1)
  assert(noteResult.task!.notes[0].includes('Making progress on the issue'))
  
  // Add another note
  manager.note('Found the root cause')
  const task = manager.getActiveTask()
  assertEquals(task?.notes.length, 2)
  
  cleanupTestFile(testFile)
})

Deno.test('TaskManager - Smart Task Finding', () => {
  const testFile = 'test-taskell-5.json'
  cleanupTestFile(testFile)
  
  const manager = new TaskManager(testFile)
  
  // Add tasks
  manager.add('Fix authentication bug')
  manager.add('Update user interface')
  manager.add('Write documentation')
  
  // Test finding by partial title
  manager.setDelta('auth', 'Auth works correctly')
  const tasks = manager.list('ready')
  assertEquals(tasks.length, 1)
  assertEquals(tasks[0].title, 'Fix authentication bug')
  
  cleanupTestFile(testFile)
})

Deno.test('TaskManager - List Filtering', () => {
  const testFile = 'test-taskell-6.json'
  cleanupTestFile(testFile)
  
  const manager = new TaskManager(testFile)
  
  // Create tasks in different states
  manager.add('Zatsu task')
  
  manager.add('Ready task')
  manager.setDelta(2, 'Ready completed')
  
  manager.add('Active task')  
  manager.setDelta(3, 'Active completed')
  manager.start(3)
  
  manager.add('Paused task')
  manager.setDelta(4, 'Paused completed')
  manager.start(4)
  manager.pause()
  
  manager.add('Done task')
  manager.setDelta(5, 'Done completed')
  manager.start(5)
  manager.done()
  
  // Test filtering
  assertEquals(manager.list('zatsu').length, 1)
  assertEquals(manager.list('ready').length, 1)
  assertEquals(manager.list('active').length, 1)
  assertEquals(manager.list('paused').length, 1)
  assertEquals(manager.list('done').length, 1)
  assertEquals(manager.list('pending').length, 4) // zatsu + ready + active + paused
  
  cleanupTestFile(testFile)
})

Deno.test('TaskManager - Status Counts', () => {
  const testFile = 'test-taskell-7.json'
  cleanupTestFile(testFile)
  
  const manager = new TaskManager(testFile)
  
  // Initially empty
  const emptyCounts = manager.getStatusCounts()
  assertEquals(emptyCounts.zatsu, 0)
  assertEquals(emptyCounts.ready, 0)
  assertEquals(emptyCounts.active, 0)
  assertEquals(emptyCounts.paused, 0)
  assertEquals(emptyCounts.done, 0)
  assertEquals(emptyCounts.dropped, 0)
  
  // Add some tasks
  manager.add('Task 1')
  manager.add('Task 2')
  manager.setDelta(2, 'Task 2 done')
  
  const counts = manager.getStatusCounts()
  assertEquals(counts.zatsu, 1)
  assertEquals(counts.ready, 1)
  assertEquals(counts.active, 0)
  
  cleanupTestFile(testFile)
})