import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { err, errAsync, ok, Result, ResultAsync } from "neverthrow";
import {
  type ScheduledTask,
  type Task,
  type TaskId,
  type TaskNumber,
  type TaskSet,
  type TaskSetId,
  type TaskStatus,
  type UnitTask,
  taskDelta,
  taskDueDate,
  taskId,
  taskName,
  taskNumber,
} from "../type.js";
import type {
  RepositoryError,
  RepositoryErrorKind,
  RepositoryResult,
  TaskRecord,
  TaskRepository,
} from "./index.js";

const FILE_EXTENSION = ".jsonl" as const;
const ENCODING = "utf-8" as const;
const DEFAULT_BASE_PATH = join(homedir(), ".config", "taskell");
const TASK_DIR = "task" as const;
const TASK_STATUSES = ["inbox", "active", "done"] as const satisfies ReadonlyArray<TaskStatus>;
const TASK_TYPES = ["unit", "scheduled"] as const;

const toRepositoryError = (
  kind: RepositoryErrorKind,
  message: string,
  cause?: unknown,
): RepositoryError => ({ kind, message, cause });

const wrapUnknownError =
  (kind: RepositoryErrorKind, message: string) =>
  (cause: unknown): RepositoryError =>
    toRepositoryError(kind, message, cause);

const taskFilePath = (basePath: string, type: string, status: TaskStatus, id: string): string =>
  join(basePath, TASK_DIR, type, status, `${id}${FILE_EXTENSION}`);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const parseUnitTask = (value: unknown): Result<UnitTask, RepositoryError> => {
  if (!isRecord(value)) {
    return err(toRepositoryError("Parse", "Task data must be an object"));
  }

  const values = Result.combine([
    taskId(asString(value.id) ?? ""),
    taskNumber(Number(value.number)),
    taskName(asString(value.name) ?? ""),
    value.delta === undefined ? ok(undefined) : taskDelta(asString(value.delta) ?? ""),
  ]);

  return values
    .mapErr((cause) => toRepositoryError("Validation", "Invalid unit task data", cause))
    .map(([id, number, name, delta]) => ({
      type: "unit" as const,
      id,
      number,
      name,
      delta,
    }));
};

const parseScheduledTask = (value: unknown): Result<ScheduledTask, RepositoryError> => {
  if (!isRecord(value)) {
    return err(toRepositoryError("Parse", "Task data must be an object"));
  }

  const values = Result.combine([
    taskId(asString(value.id) ?? ""),
    taskNumber(Number(value.number)),
    taskName(asString(value.name) ?? ""),
    value.delta === undefined ? ok(undefined) : taskDelta(asString(value.delta) ?? ""),
    taskDueDate(asString(value.dueDate) ?? ""),
  ]);

  return values
    .mapErr((cause) => toRepositoryError("Validation", "Invalid scheduled task data", cause))
    .map(([id, number, name, delta, dueDate]) => ({
      type: "scheduled" as const,
      id,
      number,
      name,
      delta,
      dueDate,
    }));
};

const parseTask = (value: unknown): Result<Task, RepositoryError> => {
  if (!isRecord(value)) {
    return err(toRepositoryError("Parse", "Task data must be an object"));
  }

  if (value.type === "unit") {
    return parseUnitTask(value);
  }
  if (value.type === "scheduled") {
    return parseScheduledTask(value);
  }

  return err(toRepositoryError("Parse", "Unknown task type"));
};

const serializeTask = (task: Task): unknown =>
  task.type === "scheduled" ? { ...task, dueDate: task.dueDate.toString() } : task;

export const _readJsonFile = (path: string): RepositoryResult<unknown> =>
  ResultAsync.fromPromise(
    readFile(path, ENCODING).then((content) => JSON.parse(content) as unknown),
    wrapUnknownError("IO", `Failed to read file at ${path}`),
  ).orElse((error) => {
    if ((error.cause as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
      return errAsync(toRepositoryError("NotFound", `File not found at ${path}`, error.cause));
    }
    return errAsync(error);
  });

const writeJsonFile = (path: string, data: unknown): RepositoryResult<void> =>
  ResultAsync.fromPromise(
    (async () => {
      await mkdir(dirname(path), { recursive: true });
      const content = `${JSON.stringify(data)}\n`;
      await writeFile(path, content, ENCODING);
    })(),
    wrapUnknownError("IO", `Failed to write file to ${path}`),
  );

export const createJsonlTaskRepository = (basePath: string = DEFAULT_BASE_PATH): TaskRepository => {
  const saveUnitTask = (task: UnitTask, status: TaskStatus = "inbox") =>
    writeJsonFile(taskFilePath(basePath, "unit", status, task.id), task).map(() => task);

  const saveScheduledTask = (task: ScheduledTask, status: TaskStatus = "inbox") =>
    writeJsonFile(taskFilePath(basePath, "scheduled", status, task.id), {
      ...task,
      dueDate: task.dueDate.toString(),
    }).map(() => task);

  const saveTaskSet = (taskSet: TaskSet, status: TaskStatus = "inbox") =>
    writeJsonFile(taskFilePath(basePath, "taskset", status, taskSet.id), {
      ...taskSet,
      tasks: taskSet.tasks.map((t) =>
        t.type === "scheduled" ? { ...t, dueDate: t.dueDate.toString() } : t,
      ),
    }).map(() => taskSet);

  const findTask = (id: TaskId): RepositoryResult<TaskRecord> =>
    ResultAsync.fromPromise(
      (async () => {
        for (const status of TASK_STATUSES) {
          for (const type of TASK_TYPES) {
            const path = taskFilePath(basePath, type, status, id);
            try {
              const parsed = parseTask(JSON.parse(await readFile(path, ENCODING)) as unknown);
              if (parsed.isErr()) {
                throw parsed.error;
              }
              return { task: parsed.value, status };
            } catch (cause) {
              if ((cause as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
                continue;
              }
              throw cause;
            }
          }
        }
        throw toRepositoryError("NotFound", `Task not found: ${id}`);
      })(),
      (cause) =>
        isRecord(cause) && typeof cause.kind === "string"
          ? (cause as RepositoryError)
          : toRepositoryError("IO", `Failed to find task: ${id}`, cause),
    );

  const listTasks = (status?: TaskStatus): RepositoryResult<ReadonlyArray<TaskRecord>> =>
    ResultAsync.fromPromise(
      (async () => {
        const statuses = status ? [status] : TASK_STATUSES;
        const records: TaskRecord[] = [];

        for (const currentStatus of statuses) {
          for (const type of TASK_TYPES) {
            const dir = join(basePath, TASK_DIR, type, currentStatus);
            let files: string[];
            try {
              files = await readdir(dir);
            } catch (cause) {
              if ((cause as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
                continue;
              }
              throw cause;
            }

            for (const file of files.filter((name) => name.endsWith(FILE_EXTENSION))) {
              const parsed = parseTask(
                JSON.parse(await readFile(join(dir, file), ENCODING)) as unknown,
              );
              if (parsed.isErr()) {
                throw parsed.error;
              }
              records.push({ task: parsed.value, status: currentStatus });
            }
          }
        }

        return records;
      })(),
      (cause) =>
        isRecord(cause) && typeof cause.kind === "string"
          ? (cause as RepositoryError)
          : toRepositoryError("IO", "Failed to list tasks", cause),
    );

  const findTaskByNumber = (number: TaskNumber): RepositoryResult<TaskRecord> =>
    listTasks().andThen((records) => {
      const record = records.find(
        (value) => value.status !== "done" && value.task.number === number,
      );
      return record ? ok(record) : err(toRepositoryError("NotFound", `Task not found: #${number}`));
    });

  const findUnitTask = (id: TaskId): RepositoryResult<UnitTask> =>
    findTask(id).andThen((record) =>
      record.task.type === "unit"
        ? ok(record.task)
        : err(toRepositoryError("NotFound", `Unit task not found: ${id}`)),
    );

  const findScheduledTask = (id: TaskId): RepositoryResult<ScheduledTask> =>
    findTask(id).andThen((record) =>
      record.task.type === "scheduled"
        ? ok(record.task)
        : err(toRepositoryError("NotFound", `Scheduled task not found: ${id}`)),
    );

  const findTaskSet = (_id: TaskSetId): RepositoryResult<TaskSet> =>
    errAsync(toRepositoryError("NotFound", "Not implemented"));

  const moveTaskStatus = (input: {
    id: TaskId;
    from: TaskStatus;
    to: TaskStatus;
  }): RepositoryResult<TaskRecord> =>
    findTask(input.id).andThen((record) => {
      if (record.status !== input.from) {
        return err(toRepositoryError("NotFound", `Task not found in ${input.from}: ${input.id}`));
      }

      const fromPath = taskFilePath(basePath, record.task.type, input.from, input.id);
      const toPath = taskFilePath(basePath, record.task.type, input.to, input.id);

      return ResultAsync.fromPromise(
        (async () => {
          await mkdir(dirname(toPath), { recursive: true });
          await rename(fromPath, toPath);
          return { task: record.task, status: input.to };
        })(),
        wrapUnknownError("IO", `Failed to move task status: ${input.id}`),
      );
    });

  const replaceTask = (input: { previous: TaskRecord; next: Task }): RepositoryResult<TaskRecord> =>
    ResultAsync.fromPromise(
      (async () => {
        const previousPath = taskFilePath(
          basePath,
          input.previous.task.type,
          input.previous.status,
          input.previous.task.id,
        );
        const nextPath = taskFilePath(
          basePath,
          input.next.type,
          input.previous.status,
          input.next.id,
        );

        await mkdir(dirname(nextPath), { recursive: true });
        await writeFile(nextPath, `${JSON.stringify(serializeTask(input.next))}\n`, ENCODING);
        if (previousPath !== nextPath) {
          await unlink(previousPath).catch((cause: NodeJS.ErrnoException) => {
            if (cause.code !== "ENOENT") {
              throw cause;
            }
          });
        }

        return { task: input.next, status: input.previous.status };
      })(),
      wrapUnknownError("IO", `Failed to replace task: ${input.previous.task.id}`),
    );

  return {
    saveUnitTask,
    saveScheduledTask,
    saveTaskSet,
    findUnitTask,
    findScheduledTask,
    findTaskSet,
    findTask,
    findTaskByNumber,
    listTasks,
    moveTaskStatus,
    replaceTask,
  };
};
