import type { ScheduledTask, Task, TaskSet } from "../type";

export interface TaskStorage {
    // タスク操作系
    addTask(task: Task): void;
    addScheduledTask(task: ScheduledTask): void;
    addTaskSet(taskSet: TaskSet): void;
    completeTask(id: string): void;
    
    // タスク取得系
    getTaskById(id: string): Task;
    getTaskSetById(id: string): TaskSet;

    // 複数タスク取得系
    getTasks(): Task[];
    getScheduledTasks(): ScheduledTask[];
    getTaskSets(): TaskSet[];
}
