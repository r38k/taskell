import { ok, Result } from "neverthrow";
import {
  taskDelta,
  type TaskDelta,
  type TaskDeltaError,
  taskId,
  type TaskId,
  type TaskIdError,
  taskName,
  type TaskName,
  type TaskNameError,
} from "../type.js";
import { nanoid } from "nanoid";

interface UnvalidatedTask {
  kind: "unvalidated";
  name: string;
  delta?: string;
}

interface ValidatedTask {
  kind: "validated";
  name: TaskName;
  delta?: TaskDelta;
}

export interface CreatedTask {
  kind: "created";
  id: TaskId;
  name: TaskName;
  delta?: TaskDelta;
}

type ValidationError = TaskNameError | TaskDeltaError;

type validateTask = (input: UnvalidatedTask) => Result<ValidatedTask, ValidationError>;

const validateTask: validateTask = (input) => {
  const name = taskName(input.name);
  const delta = input.delta ? taskDelta(input.delta) : ok(undefined);

  const values = Result.combine([name, delta]);

  return values.map(([name, delta]) => ({
    kind: "validated" as const,
    name,
    delta,
  }));
};

type CreatedTaskError = ValidationError | TaskIdError;

type createTask = (input: ValidatedTask) => Result<CreatedTask, CreatedTaskError>;

const createTask: createTask = (input) => {
  const id = taskId(nanoid());

  const values = Result.combine([id]);

  return values.map(([id]) => ({
    kind: "created" as const,
    id,
    name: input.name,
    delta: input.delta,
  }));
};

type CreateTaskWorkflow = (input: UnvalidatedTask) => Result<CreatedTask, CreatedTaskError>;

export const createTaskWorkflow: CreateTaskWorkflow = (input) =>
  ok(input).andThen(validateTask).andThen(createTask);
