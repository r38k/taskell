import { describe, expect, test } from "vitest";
import {
  addUnitTask,
  completeTask,
  createMemoryTaskRepository,
  getTask,
  listTasks,
  scheduleTask,
  startTask,
} from "./operations.js";

describe("task operations", () => {
  test("adds a unit task to the inbox", async () => {
    const repository = createMemoryTaskRepository();

    const result = await addUnitTask(repository, {
      name: "Capture the first CLI command",
      delta: "The task can be listed later.",
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      status: "inbox",
      task: {
        type: "unit",
        number: 1,
        name: "Capture the first CLI command",
        delta: "The task can be listed later.",
      },
    });
  });

  test("allocates task numbers from current inbox and active tasks", async () => {
    const repository = createMemoryTaskRepository();
    const first = await addUnitTask(repository, { name: "First" });
    const second = await addUnitTask(repository, { name: "Second" });
    await completeTask(repository, { ref: "#2" });

    const third = await addUnitTask(repository, { name: "Third" });

    expect(first._unsafeUnwrap().task.number).toBe(1);
    expect(second._unsafeUnwrap().task.number).toBe(2);
    expect(third._unsafeUnwrap().task.number).toBe(2);
  });

  test("lists tasks by status", async () => {
    const repository = createMemoryTaskRepository();
    await addUnitTask(repository, { name: "One" });
    const started = await addUnitTask(repository, { name: "Two" });
    await startTask(repository, { ref: started._unsafeUnwrap().task.number.toString() });

    const inbox = await listTasks(repository, { status: "inbox" });
    const active = await listTasks(repository, { status: "active" });

    expect(inbox._unsafeUnwrap()).toHaveLength(1);
    expect(inbox._unsafeUnwrap()[0]?.task.name).toBe("One");
    expect(active._unsafeUnwrap()).toHaveLength(1);
    expect(active._unsafeUnwrap()[0]?.task.name).toBe("Two");
  });

  test("gets a task by number reference", async () => {
    const repository = createMemoryTaskRepository();
    const created = await addUnitTask(repository, { name: "Find me" });

    const found = await getTask(repository, { ref: `#${created._unsafeUnwrap().task.number}` });

    expect(found._unsafeUnwrap()).toMatchObject({
      status: "inbox",
      task: {
        name: "Find me",
      },
    });
  });

  test("starts and completes a task by moving status", async () => {
    const repository = createMemoryTaskRepository();
    const created = await addUnitTask(repository, { name: "Move through lifecycle" });

    const active = await startTask(repository, { ref: created._unsafeUnwrap().task.number });
    const done = await completeTask(repository, { ref: created._unsafeUnwrap().task.number });

    expect(active._unsafeUnwrap().status).toBe("active");
    expect(done._unsafeUnwrap().status).toBe("done");
  });

  test("schedules a unit task and keeps its current status", async () => {
    const repository = createMemoryTaskRepository();
    const created = await addUnitTask(repository, { name: "Schedule me" });
    await startTask(repository, { ref: created._unsafeUnwrap().task.number });

    const scheduled = await scheduleTask(repository, {
      ref: created._unsafeUnwrap().task.number,
      dueDate: "2026-05-20",
    });

    expect(scheduled._unsafeUnwrap()).toMatchObject({
      status: "active",
      task: {
        type: "scheduled",
        name: "Schedule me",
      },
    });
    const task = scheduled._unsafeUnwrap().task;
    expect(task.type).toBe("scheduled");
    if (task.type === "scheduled") {
      expect(task.dueDate.toString()).toBe("2026-05-20");
    }
  });

  test("does not resolve done tasks by number reference", async () => {
    const repository = createMemoryTaskRepository();
    const created = await addUnitTask(repository, { name: "Done is out of lookup" });
    await completeTask(repository, { ref: created._unsafeUnwrap().task.number });

    const found = await getTask(repository, { ref: created._unsafeUnwrap().task.number });

    expect(found.isErr()).toBe(true);
    expect(found._unsafeUnwrapErr().kind).toBe("NotFound");
  });
});
