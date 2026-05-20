import type { Task, TaskId } from "./type.js";

export type TaskExecutionIntent =
  | {
      mode: "manual";
    }
  | {
      mode: "runner";
      allowedEffect: RunnerAllowedEffect;
      instruction?: string;
    };

export type RunnerAllowedEffect = "readOnly" | "localWrite" | "externalSideEffect";

export type RunnerRequestStatus = "pending" | "waitingApproval";

export type RunnerExecutionRequest = {
  taskId: TaskId;
  status: RunnerRequestStatus;
  allowedEffect: RunnerAllowedEffect;
  instruction?: string;
};

export type TaskExecutionPlan =
  | {
      kind: "manual";
      taskId: TaskId;
    }
  | {
      kind: "runnerRequest";
      request: RunnerExecutionRequest;
    }
  | {
      kind: "approvalRequired";
      request: RunnerExecutionRequest;
    };

export type PlanTaskExecutionInput = {
  task: Task;
  intent: TaskExecutionIntent;
};

export const planTaskExecution = (input: PlanTaskExecutionInput): TaskExecutionPlan => {
  if (input.intent.mode === "manual") {
    return {
      kind: "manual",
      taskId: input.task.id,
    };
  }

  const request: RunnerExecutionRequest = {
    taskId: input.task.id,
    status: input.intent.allowedEffect === "externalSideEffect" ? "waitingApproval" : "pending",
    allowedEffect: input.intent.allowedEffect,
    instruction: input.intent.instruction,
  };

  if (request.status === "waitingApproval") {
    return {
      kind: "approvalRequired",
      request,
    };
  }

  return {
    kind: "runnerRequest",
    request,
  };
};
