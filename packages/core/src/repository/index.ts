import type { ResultAsync } from "neverthrow";
import {
  type ScheduledTask,
  type TaskId,
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

export interface TaskRepository {
  saveUnitTask(task: UnitTask, status?: TaskStatus): RepositoryResult<UnitTask>;
  saveScheduledTask(task: ScheduledTask, status?: TaskStatus): RepositoryResult<ScheduledTask>;
  saveTaskSet(taskSet: TaskSet, status?: TaskStatus): RepositoryResult<TaskSet>;

  findUnitTask(id: TaskId): RepositoryResult<UnitTask>;
  findScheduledTask(id: TaskId): RepositoryResult<ScheduledTask>;
  findTaskSet(id: TaskSetId): RepositoryResult<TaskSet>;

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
