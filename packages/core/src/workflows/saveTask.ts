import { ResultAsync } from "neverthrow";
import type { CreatedTask } from "./createTask.js";
import type { UnitTask } from "../type.js";

type RepositoryError = undefined;

type Repository = {
  create: (task: UnitTask) => Promise<string>;
};

type saveTask = (
  repository: Repository,
) => (input: CreatedTask) => ResultAsync<string, RepositoryError>;

export const saveTask: saveTask = (repository) => (input) => {
  return ResultAsync.fromPromise(
    repository.create({
      type: "unit" as const,
      id: input.id,
      name: input.name,
      delta: input.delta,
    }),
    () => undefined,
  );
};
