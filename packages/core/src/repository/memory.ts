import { errAsync, okAsync } from "neverthrow";
import type { Task, TaskId, TaskNumber, TaskSet, TaskSetId, TaskStatus } from "../type.js";
import type { RepositoryError, RepositoryResult, TaskRecord, TaskRepository } from "./index.js";

const notFound = (message: string): RepositoryError => ({ kind: "NotFound", message });

const sameId = (task: Task, id: TaskId): boolean => task.id === id;

export const createMemoryTaskRepository = (): TaskRepository => {
  const records = new Map<string, TaskRecord>();

  const save = <TTask extends Task>(task: TTask, status: TaskStatus): RepositoryResult<TTask> => {
    records.set(task.id, { task, status });
    return okAsync(task);
  };

  const findRecord = (id: TaskId): TaskRecord | undefined => records.get(id);

  const findTask = (id: TaskId): RepositoryResult<TaskRecord> => {
    const record = findRecord(id);
    return record ? okAsync(record) : errAsync(notFound(`Task not found: ${id}`));
  };

  const findTaskByNumber = (number: TaskNumber): RepositoryResult<TaskRecord> => {
    const record = Array.from(records.values()).find(
      (value) => value.status !== "done" && value.task.number === number,
    );
    return record ? okAsync(record) : errAsync(notFound(`Task not found: #${number}`));
  };

  return {
    saveUnitTask: (task, status = "inbox") => save(task, status),
    saveScheduledTask: (task, status = "inbox") => save(task, status),
    saveTaskSet: (taskSet) => okAsync(taskSet),

    findUnitTask: (id) => {
      const record = findRecord(id);
      return record?.task.type === "unit"
        ? okAsync(record.task)
        : errAsync(notFound(`Unit task not found: ${id}`));
    },
    findScheduledTask: (id) => {
      const record = findRecord(id);
      return record?.task.type === "scheduled"
        ? okAsync(record.task)
        : errAsync(notFound(`Scheduled task not found: ${id}`));
    },
    findTaskSet: (_id: TaskSetId): RepositoryResult<TaskSet> =>
      errAsync(notFound("Task set persistence is not implemented in memory repository")),

    findTask,
    findTaskByNumber,
    listTasks: (status) => {
      const found = Array.from(records.values()).filter((record) =>
        status ? record.status === status : true,
      );
      return okAsync(found);
    },
    moveTaskStatus: (input) => {
      const record = findRecord(input.id);
      if (!record || !sameId(record.task, input.id)) {
        return errAsync(notFound(`Task not found: ${input.id}`));
      }
      if (record.status !== input.from) {
        return errAsync(notFound(`Task not found in ${input.from}: ${input.id}`));
      }
      const next = { ...record, status: input.to };
      records.set(input.id, next);
      return okAsync(next);
    },
    replaceTask: (input) => {
      records.delete(input.previous.task.id);
      const next = { task: input.next, status: input.previous.status };
      records.set(input.next.id, next);
      return okAsync(next);
    },
  };
};
