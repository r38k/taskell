import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { TaskManager } from '../src/task-manager.ts';

// Test with a temporary file
const testStorePath = './test-taskell.json';

Deno.test("TaskManager - Add Task", () => {
  const manager = new TaskManager(testStorePath);
  
  const task = manager.addTask("Test task");
  
  assertEquals(task.content, "Test task");
  assertEquals(task.done, false);
  assertExists(task.id);
  assertExists(task.createdAt);
});

Deno.test("TaskManager - Mark Done", () => {
  const manager = new TaskManager(testStorePath);
  
  const task = manager.addTask("Test task");
  const doneTask = manager.markDone(task.id, "Task completed successfully");
  
  assertEquals(doneTask?.done, true);
  assertEquals(doneTask?.stateDescription, "Task completed successfully");
  assertExists(doneTask?.completedAt);
});

Deno.test("TaskManager - Mark Done without state description", () => {
  const manager = new TaskManager(testStorePath);
  
  const task = manager.addTask("Test task");
  const doneTask = manager.markDone(task.id);
  
  assertEquals(doneTask?.done, true);
  assertEquals(doneTask?.stateDescription, undefined);
  assertExists(doneTask?.completedAt);
});

Deno.test("TaskManager - Mark Undone", () => {
  const manager = new TaskManager(testStorePath);
  
  const task = manager.addTask("Test task");
  manager.markDone(task.id, "Done");
  const undoneTask = manager.markUndone(task.id);
  
  assertEquals(undoneTask?.done, false);
  assertEquals(undoneTask?.stateDescription, undefined);
  assertEquals(undoneTask?.completedAt, undefined);
});

Deno.test("TaskManager - List Tasks", () => {
  const manager = new TaskManager(testStorePath);
  
  manager.addTask("Task 1");
  manager.addTask("Task 2");
  const task3 = manager.addTask("Task 3");
  manager.markDone(task3.id, "Completed");
  
  const allTasks = manager.listTasks();
  const pendingTasks = manager.listPendingTasks();
  const completedTasks = manager.listCompletedTasks();
  
  assertEquals(allTasks.length, 3);
  assertEquals(pendingTasks.length, 2);
  assertEquals(completedTasks.length, 1);
  assertEquals(completedTasks[0].content, "Task 3");
});

Deno.test("TaskManager - Delete Task", () => {
  const manager = new TaskManager(testStorePath);
  
  const task = manager.addTask("Task to delete");
  const deleted = manager.deleteTask(task.id);
  const found = manager.getTask(task.id);
  
  assertEquals(deleted, true);
  assertEquals(found, null);
});

// Cleanup test file
Deno.test({
  name: "Cleanup",
  fn: () => {
    try {
      Deno.removeSync(testStorePath);
    } catch {
      // File might not exist, ignore
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});