import { describe, expect, test } from "vitest";
import { createTaskWorkflow } from "./createTask.js";

describe("createTaskWorkflow", () => {
  test("creates a unit task candidate from a valid name", () => {
    const result = createTaskWorkflow({
      kind: "unvalidated",
      name: "Write the first Taskell test",
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      kind: "created",
      name: "Write the first Taskell test",
    });
    expect(result._unsafeUnwrap().id).toHaveLength(21);
  });

  test("keeps an optional task delta when provided", () => {
    const result = createTaskWorkflow({
      kind: "unvalidated",
      name: "Update README",
      delta: "The project overview reflects the runner-agnostic direction.",
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      kind: "created",
      name: "Update README",
      delta: "The project overview reflects the runner-agnostic direction.",
    });
  });

  test("rejects an empty task name", () => {
    const result = createTaskWorkflow({
      kind: "unvalidated",
      name: "",
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual({ kind: "Validation" });
  });
});
