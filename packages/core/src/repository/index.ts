import type { ResultAsync } from "neverthrow";
import {
  type Task,
  type ScheduledTask,
  type TaskId,
  type TaskNumber,
  type TaskSet,
  type TaskSetId,
  type TaskStatus,
  type UnitTask,
} from "../type.js";

export type RepositoryErrorKind = "IO" | "Parse" | "Validation" | "NotFound";

export type RepositoryError = {
  kind: RepositoryErrorKind;
  message: string;
  cause?: unknown;
};

export type RepositoryResult<TValue> = ResultAsync<TValue, RepositoryError>;

export type TaskRecord = {
  task: Task;
  status: TaskStatus;
};

export interface TaskRepository {
  saveUnitTask(task: UnitTask, status?: TaskStatus): RepositoryResult<UnitTask>;
  saveScheduledTask(task: ScheduledTask, status?: TaskStatus): RepositoryResult<ScheduledTask>;
  saveTaskSet(taskSet: TaskSet, status?: TaskStatus): RepositoryResult<TaskSet>;

  findUnitTask(id: TaskId): RepositoryResult<UnitTask>;
  findScheduledTask(id: TaskId): RepositoryResult<ScheduledTask>;
  findTaskSet(id: TaskSetId): RepositoryResult<TaskSet>;

  findTask(id: TaskId): RepositoryResult<TaskRecord>;
  findTaskByNumber(number: TaskNumber): RepositoryResult<TaskRecord>;
  listTasks(status?: TaskStatus): RepositoryResult<ReadonlyArray<TaskRecord>>;
  moveTaskStatus(input: {
    id: TaskId;
    from: TaskStatus;
    to: TaskStatus;
  }): RepositoryResult<TaskRecord>;
  replaceTask(input: { previous: TaskRecord; next: Task }): RepositoryResult<TaskRecord>;

  // listUnitTasks(status: TaskStatus): RepositoryResult<ReadonlyArray<UnitTask>>;
  // listScheduledTasks(status: TaskStatus): RepositoryResult<ReadonlyArray<ScheduledTask>>;
  // listTaskSets(status: TaskStatus): RepositoryResult<ReadonlyArray<TaskSet>>;

  // updateTaskStatus(input: {
  // 	id: TaskId | TaskSetId;
  // 	type: TaskType;
  // 	from: TaskStatus;
  // 	to: TaskStatus;
  // }): RepositoryResult<void>;

  // removeTask(task: {
  // 	id: TaskId | TaskSetId;
  // 	type: TaskType;
  // 	status: TaskStatus;
  // }): RepositoryResult<void>;
}

export type TaskPersistencePort = TaskRepository;
