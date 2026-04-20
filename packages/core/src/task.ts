import { ok } from "neverthrow";
import { createTaskWorkflow } from "./workflows/createTask.js";
import { saveTask } from "./workflows/saveTask.js";
import type { UnitTask } from "./type.js";

const repos = {
  create: async (input: UnitTask) => {
    console.log(input.name);
    return input.id;
  },
};

export function addTask({ name, delta }: { name: string; delta?: string }) {
  const unvalidatedTask = {
    kind: "unvalidated" as const,
    name,
    delta,
  };

  const result = ok(unvalidatedTask).andThen(createTaskWorkflow).asyncAndThen(saveTask(repos));

  void result.match(
    (id) => console.log(`Success: ${id}`),
    () => console.log("Failed"),
  );
}

// function setSchedule({id, dueDate}: {id: string, dueDate: string}) {
//
// }
