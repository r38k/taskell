import { ok, ResultAsync } from "neverthrow";
import { ScheduledTask, taskDelta, UnitTask } from "../type";


// 仮置き
interface TaskRepository {

}

export const withDueDate = (repos: TaskRepository) => (input: {task: UnitTask, date: string}): ResultAsync<ScheduledTask, Error> => {
    const scheduledTask = {
        ...input.task,
        type: "scheduled",
        dueDate: input.date,    
    }
}
