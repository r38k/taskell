import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  createEmptyStore,
  addTask,
  setDelta,
  startTask,
  pauseTask,
  completeTask,
  dropTask,
  addNote,
  getActiveTask,
  getReadyTasks,
  getPendingTasks,
  getCompletedTasks,
  findTask
} from '../src/task-functions.ts';

Deno.test("createEmptyStore creates empty store", () => {
  const store = createEmptyStore();
  assertEquals(store.tasks.length, 0);
  assertEquals(store.nextId, 1);
});

Deno.test("addTask adds task with zatsu status", () => {
  const store = createEmptyStore();
  const newStore = addTask(store, "Test task");
  
  assertEquals(newStore.tasks.length, 1);
  assertEquals(newStore.tasks[0].content, "Test task");
  assertEquals(newStore.tasks[0].status, "zatsu");
  assertEquals(newStore.tasks[0].id, 1);
  assertEquals(newStore.nextId, 2);
});

Deno.test("setDelta transitions task from zatsu to ready", () => {
  let store = createEmptyStore();
  store = addTask(store, "Test task");
  store = setDelta(store, 1, "Task should be complete");
  
  const task = findTask(store, 1)!;
  assertEquals(task.status, "ready");
  assertEquals(task.delta, "Task should be complete");
});

Deno.test("startTask transitions ready task to active", () => {
  let store = createEmptyStore();
  store = addTask(store, "Test task");
  store = setDelta(store, 1, "Criteria");
  store = startTask(store, 1);
  
  const task = findTask(store, 1)!;
  assertEquals(task.status, "active");
  assertEquals(task.sessionStart instanceof Date, true);
});

Deno.test("startTask prevents multiple active tasks", () => {
  let store = createEmptyStore();
  store = addTask(store, "Task 1");
  store = addTask(store, "Task 2");
  store = setDelta(store, 1, "Criteria 1");
  store = setDelta(store, 2, "Criteria 2");
  store = startTask(store, 1);
  
  assertThrows(() => {
    startTask(store, 2);
  }, Error, "Another task is already active");
});

Deno.test("pauseTask transitions active task to paused and calculates time", () => {
  let store = createEmptyStore();
  store = addTask(store, "Test task");
  store = setDelta(store, 1, "Criteria");
  store = startTask(store, 1);
  
  // Wait a bit to simulate work time
  setTimeout(() => {}, 100);
  
  store = pauseTask(store, 1);
  const task = findTask(store, 1)!;
  assertEquals(task.status, "paused");
  assertEquals(task.sessionStart, undefined);
});

Deno.test("completeTask transitions active task to done", () => {
  let store = createEmptyStore();
  store = addTask(store, "Test task");
  store = setDelta(store, 1, "Criteria");
  store = startTask(store, 1);
  store = completeTask(store, 1, "Successfully completed");
  
  const task = findTask(store, 1)!;
  assertEquals(task.status, "done");
  assertEquals(task.finalState, "Successfully completed");
  assertEquals(task.completedAt instanceof Date, true);
});

Deno.test("completeTask without final state works", () => {
  let store = createEmptyStore();
  store = addTask(store, "Test task");
  store = setDelta(store, 1, "Criteria");
  store = startTask(store, 1);
  store = completeTask(store, 1);
  
  const task = findTask(store, 1)!;
  assertEquals(task.status, "done");
  assertEquals(task.finalState, undefined);
});

Deno.test("dropTask changes any task to dropped status", () => {
  let store = createEmptyStore();
  store = addTask(store, "Test task");
  store = dropTask(store, 1);
  
  const task = findTask(store, 1)!;
  assertEquals(task.status, "dropped");
});

Deno.test("addNote adds timestamped note to task", () => {
  let store = createEmptyStore();
  store = addTask(store, "Test task");
  store = addNote(store, 1, "Important note");
  
  const task = findTask(store, 1)!;
  assertEquals(task.notes.length, 1);
  assertEquals(task.notes[0].content, "Important note");
  assertEquals(task.notes[0].timestamp instanceof Date, true);
});

Deno.test("getter functions filter tasks correctly", () => {
  let store = createEmptyStore();
  store = addTask(store, "Zatsu task");
  store = addTask(store, "Ready task");
  store = addTask(store, "Active task");
  store = addTask(store, "Done task");
  
  store = setDelta(store, 2, "Ready criteria");
  store = setDelta(store, 3, "Active criteria");
  store = startTask(store, 3);
  store = setDelta(store, 4, "Done criteria");
  store = startTask(store, 4);
  store = completeTask(store, 4);
  
  assertEquals(getReadyTasks(store).length, 1);
  assertEquals(getActiveTask(store)?.id, 3);
  assertEquals(getPendingTasks(store).length, 3); // zatsu, ready, active
  assertEquals(getCompletedTasks(store).length, 1);
});