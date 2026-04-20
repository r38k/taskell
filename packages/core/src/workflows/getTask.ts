import type { Result, ResultAsync } from "neverthrow";
import type { TaskId, UnitTask } from "../type.js";

export interface GetTaskCommand {
  id: string;
}

export type FetchTaskById = (id: TaskId) => ResultAsync<UnitTask, Error>;

export type GetTask = (
  fetchTaskById: FetchTaskById,
) => (command: GetTaskCommand) => Result<UnitTask, Error>;
