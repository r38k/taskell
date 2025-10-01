import { ok } from "neverthrow"
import { createTaskWorkflow } from "./workflows/createTask"


export function addTask({name, delta}: {name: string, delta?: string}) {
    const unvalidatedTask = {
        kind: "unvalidated" as const,
        name,
        delta
    }

    const result = ok(unvalidatedTask).andThen(createTaskWorkflow)

}
