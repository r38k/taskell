import { describe, expect, test } from "vite-plus/test";
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
        name: "Capture the first CLI command",
        delta: "The task can be listed later.",
      },
    });
  });

  test("lists tasks by status", async () => {
    const repository = createMemoryTaskRepository();
    await addUnitTask(repository, { name: "One" });
    const started = await addUnitTask(repository, { name: "Two" });
    await startTask(repository, { id: started._unsafeUnwrap().task.id });

    const inbox = await listTasks(repository, { status: "inbox" });
    const active = await listTasks(repository, { status: "active" });

    expect(inbox._unsafeUnwrap()).toHaveLength(1);
    expect(inbox._unsafeUnwrap()[0]?.task.name).toBe("One");
    expect(active._unsafeUnwrap()).toHaveLength(1);
    expect(active._unsafeUnwrap()[0]?.task.name).toBe("Two");
  });

  test("gets a task by id", async () => {
    const repository = createMemoryTaskRepository();
    const created = await addUnitTask(repository, { name: "Find me" });

    const found = await getTask(repository, { id: created._unsafeUnwrap().task.id });

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

    const active = await startTask(repository, { id: created._unsafeUnwrap().task.id });
    const done = await completeTask(repository, { id: created._unsafeUnwrap().task.id });

    expect(active._unsafeUnwrap().status).toBe("active");
    expect(done._unsafeUnwrap().status).toBe("done");
  });

  test("schedules a unit task and keeps its current status", async () => {
    const repository = createMemoryTaskRepository();
    const created = await addUnitTask(repository, { name: "Schedule me" });
    await startTask(repository, { id: created._unsafeUnwrap().task.id });

    const scheduled = await scheduleTask(repository, {
      id: created._unsafeUnwrap().task.id,
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
});
