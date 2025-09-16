import type { ScheduledTask, Task, TaskSet, TaskStatus, TaskType } from "../type";
import { Result } from "neverthrow";

export interface TaskStorage {
    // タスク追加
    addTask(task: Task): Promise<Result<string, Error>>;
    addScheduledTask(task: ScheduledTask): Promise<Result<string, Error>>;
    addTaskSet(taskSet: TaskSet): Promise<Result<string, Error>>;
    
    // タスク編集

    // タスク状態変更
    updateTaskStatus(id: string, type: TaskType, currentStatus: TaskStatus, targetStatus: TaskStatus): Promise<Result<string, Error>>;

    // タスク取得
    getTaskById(id: string): Promise<Result<Task, Error>>;
    getTaskSetById(id: string): Promise<Result<TaskSet, Error>>;

    // 複数タスク取得
    getTasks(): Promise<Result<Task[], Error>>;
    getScheduledTasks(): Promise<Result<ScheduledTask[], Error>>;
    getTaskSets(): Promise<Result<TaskSet[], Error>>;
}
