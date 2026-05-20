import { errAsync, okAsync, Result, ResultAsync } from "neverthrow";
import {
  taskId,
  taskNumber,
  type TaskId,
  type TaskNumber,
  type TaskStatus,
  type UnitTask,
} from "./type.js";
import type {
  RepositoryError,
  RepositoryResult,
  TaskRecord,
  TaskRepository,
} from "./repository/index.js";
import { createMemoryTaskRepository } from "./repository/memory.js";
import { createTaskWorkflow } from "./workflows/createTask.js";
import { withDueDate } from "./workflows/updateTask.js";

export { createMemoryTaskRepository };

export type TaskOperationError =
  | RepositoryError
  | {
      kind: "Validation";
      message: string;
    };

export type AddUnitTaskInput = {
  name: string;
  delta?: string;
};

export type TaskLookupInput = {
  ref: string | number | TaskId | TaskNumber;
};

export type ListTasksInput = {
  status?: TaskStatus;
};

export type ScheduleTaskInput = TaskLookupInput & {
  dueDate: string;
};

const validationError = (message: string): TaskOperationError => ({
  kind: "Validation",
  message,
});

const parseTaskId = (id: string | TaskId): Result<TaskId, TaskOperationError> =>
  taskId(id).mapErr(() => validationError(`Invalid task id: ${id}`));

const parseTaskNumber = (value: string | number): Result<TaskNumber, TaskOperationError> => {
  const raw =
    typeof value === "number" ? value : Number(value.startsWith("#") ? value.slice(1) : value);
  return taskNumber(raw).mapErr(() => validationError(`Invalid task number: ${value}`));
};

const fromRepository = <TValue>(
  result: RepositoryResult<TValue>,
): ResultAsync<TValue, TaskOperationError> => result.mapErr((error) => error);

const allocateTaskNumber = (
  repository: TaskRepository,
): ResultAsync<TaskNumber, TaskOperationError> =>
  fromRepository(repository.listTasks()).andThen((records) => {
    const activeNumbers = records
      .filter((record) => record.status !== "done")
      .map((record) => record.task.number);
    const next = activeNumbers.length > 0 ? Math.max(...activeNumbers) + 1 : 1;
    const number = taskNumber(next).mapErr(() => validationError("Invalid next task number"));
    return number.isOk() ? okAsync(number.value) : errAsync(number.error);
  });

export const addUnitTask = (
  repository: TaskRepository,
  input: AddUnitTaskInput,
): ResultAsync<TaskRecord, TaskOperationError> => {
  const created = createTaskWorkflow({
    kind: "unvalidated",
    name: input.name,
    delta: input.delta,
  }).mapErr(() => validationError("Task name must not be empty"));

  return created.asyncAndThen((task) =>
    allocateTaskNumber(repository).andThen((number) =>
      fromRepository(
        repository
          .saveUnitTask({
            type: "unit",
            id: task.id,
            number,
            name: task.name,
            delta: task.delta,
          })
          .map((saved) => ({ task: saved, status: "inbox" as const })),
      ),
    ),
  );
};

export const listTasks = (
  repository: TaskRepository,
  input: ListTasksInput = {},
): ResultAsync<ReadonlyArray<TaskRecord>, TaskOperationError> =>
  fromRepository(repository.listTasks(input.status));

export const getTask = (
  repository: TaskRepository,
  input: TaskLookupInput,
): ResultAsync<TaskRecord, TaskOperationError> =>
  typeof input.ref === "number" || (typeof input.ref === "string" && /^#?\d+$/.test(input.ref))
    ? parseTaskNumber(input.ref).asyncAndThen((number) =>
        fromRepository(repository.findTaskByNumber(number)),
      )
    : parseTaskId(input.ref as string | TaskId).asyncAndThen((id) =>
        fromRepository(repository.findTask(id)),
      );

const moveTask = (
  repository: TaskRepository,
  input: TaskLookupInput,
  to: TaskStatus,
): ResultAsync<TaskRecord, TaskOperationError> =>
  getTask(repository, input).andThen((record) =>
    record.status === to
      ? okAsync(record)
      : fromRepository(
          repository.moveTaskStatus({
            id: record.task.id,
            from: record.status,
            to,
          }),
        ),
  );

export const startTask = (
  repository: TaskRepository,
  input: TaskLookupInput,
): ResultAsync<TaskRecord, TaskOperationError> => moveTask(repository, input, "active");

export const completeTask = (
  repository: TaskRepository,
  input: TaskLookupInput,
): ResultAsync<TaskRecord, TaskOperationError> => moveTask(repository, input, "done");

export const scheduleTask = (
  repository: TaskRepository,
  input: ScheduleTaskInput,
): ResultAsync<TaskRecord, TaskOperationError> =>
  getTask(repository, input).andThen((record) => {
    if (record.task.type !== "unit") {
      return okAsync(record);
    }

    const scheduled = withDueDate({
      task: record.task as UnitTask,
      dueDate: input.dueDate,
    }).mapErr(() => validationError(`Invalid due date: ${input.dueDate}`));

    return scheduled.asyncAndThen((task) =>
      fromRepository(repository.replaceTask({ previous: record, next: task })),
    );
  });
