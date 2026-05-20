import { describe, expect, test } from "vite-plus/test";
import { planTaskExecution } from "./execution.js";
import { taskId, taskName, taskNumber, type UnitTask } from "./type.js";

const task = (): UnitTask => ({
  type: "unit",
  id: taskId("abcdefghijklmnopqrstu")._unsafeUnwrap(),
  number: taskNumber(1)._unsafeUnwrap(),
  name: taskName("Try the runner agnostic workflow")._unsafeUnwrap(),
});

describe("planTaskExecution", () => {
  test("does not create a runner request for a manual task", () => {
    const result = planTaskExecution({
      task: task(),
      intent: { mode: "manual" },
    });

    expect(result).toEqual({
      kind: "manual",
      taskId: "abcdefghijklmnopqrstu",
    });
  });

  test("creates a pending runner request when the allowed effect is local", () => {
    const result = planTaskExecution({
      task: task(),
      intent: {
        mode: "runner",
        allowedEffect: "localWrite",
        instruction: "Edit local files and leave a diff.",
      },
    });

    expect(result).toEqual({
      kind: "runnerRequest",
      request: {
        taskId: "abcdefghijklmnopqrstu",
        status: "pending",
        allowedEffect: "localWrite",
        instruction: "Edit local files and leave a diff.",
      },
    });
  });

  test("requires approval before a runner may perform an external side effect", () => {
    const result = planTaskExecution({
      task: task(),
      intent: {
        mode: "runner",
        allowedEffect: "externalSideEffect",
        instruction: "Draft and send an email.",
      },
    });

    expect(result).toEqual({
      kind: "approvalRequired",
      request: {
        taskId: "abcdefghijklmnopqrstu",
        status: "waitingApproval",
        allowedEffect: "externalSideEffect",
        instruction: "Draft and send an email.",
      },
    });
  });
});
