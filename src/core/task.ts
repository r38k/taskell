import type { ScheduledTask, Task, TaskSet } from "./type";
import { jsonLinesStorage } from "./storage/jsonl";
import { v4 as uuidv4 } from "uuid";
import { err, ok, Result } from "neverthrow";

export async function addTask(name: string, delta?: string): Promise<Result<Task, Error>> {
    const task = {
        id: uuidv4(),
        name,
        delta,
    };
    const result = await jsonLinesStorage.addTask(task);
    if (result.isErr()) {
        return err(result.error);
    }
    return ok(task);
}

export async function setSchedule(task: Task, dueDate: Date): Promise<Result<ScheduledTask, Error>> {
    const scheduledTask = {
        ...task,
        dueDate,
    };

    // スケジュールタスク自体もディレクトリ分ける？
    // 単にファイル編集するか，移動するか
    const result = await jsonLinesStorage.addScheduledTask(scheduledTask);
    if (result.isErr()) {
        return err(result.error);
    }
    return ok(scheduledTask);
}

export async function addScheduledTask(name: string, dueDate: Date, delta?: string): Promise<Result<ScheduledTask, Error>> {
    const scheduledTask = {
        id: uuidv4(),
        name,
        dueDate,
        delta,
    };
    const result = await jsonLinesStorage.addScheduledTask(scheduledTask);
    if (result.isErr()) {
        return err(result.error);
    }
    return ok(scheduledTask);
}


export async function addTaskSet(name: string, tasks: ReadonlyArray<Task>): Promise<Result<TaskSet, Error>> {
    const taskSet = {
        id: uuidv4(),
        name,
        tasks,
    };
    const result = await jsonLinesStorage.addTaskSet(taskSet);
    if (result.isErr()) {
        return err(result.error);
    }
    return ok(taskSet);
}

export async function doneTask(task: Task): Promise<Result<Task, Error>> {
    const result = await jsonLinesStorage.completeTask(task.id);
    if (result.isErr()) {
        return err(result.error);
    }
    return ok(task);
}
