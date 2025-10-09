import type { Result, ResultAsync } from "neverthrow";
import type { Task, TaskId, UnitTask } from "../type.js";

interface GetTaskCommand {
    id: string;
}

type FetchTaskById = (id: TaskId) => ResultAsync<UnitTask, Error>;

type getTask = (fetchTaskById: FetchTaskById) => (command: GetTaskCommand) => Result<UnitTask, Error>;
