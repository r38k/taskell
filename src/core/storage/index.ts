import type { ScheduledTask, Task, TaskSet } from "../type";
import { Result } from "neverthrow";

export interface TaskStorage {
    // タスク操作系
    addTask(task: Task): Result<string, Error>;
    addScheduledTask(task: ScheduledTask): Result<string, Error>;
    addTaskSet(taskSet: TaskSet): Result<string, Error>;
    completeTask(id: string): Result<string, Error>;
    
    // タスク取得系
    getTaskById(id: string): Promise<Result<Task, Error>>;
    getTaskSetById(id: string): Promise<Result<TaskSet, Error>>;

    // 複数タスク取得系
    getTasks(): Promise<Result<Task[], Error>>;
    getScheduledTasks(): Promise<Result<ScheduledTask[], Error>>;
    getTaskSets(): Promise<Result<TaskSet[], Error>>;
}
