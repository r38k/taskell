import { TaskSet, Task, TaskList } from "./types.ts";
import { generateId } from "./utils.ts";
import { createTask } from "./task.ts";

export function createTaskSet(name: string, description?: string): TaskSet {
    const now = new Date();
    return {
        id: generateId(),
        name,
        description,
        tasks: [],
        createdAt: now,
        updatedAt: now,
    };
}

export function createTaskSetWithTasks(name: string, taskContents: string[], description?: string): TaskSet {
    const taskSet = createTaskSet(name, description);
    const tasks = taskContents.map(content => createTask(content));
    
    return {
        ...taskSet,
        tasks,
    };
}

export function addTaskToTaskSet(taskSet: TaskSet, task: Task): TaskSet {
    const taskExists = taskSet.tasks.some(t => t.id === task.id);
    if (taskExists) {
        throw new Error("Task already exists in task set");
    }
    
    return {
        ...taskSet,
        tasks: [...taskSet.tasks, task],
        updatedAt: new Date(),
    };
}

export function removeTaskFromTaskSet(taskSet: TaskSet, taskId: string): TaskSet {
    const taskExists = taskSet.tasks.some(t => t.id === taskId);
    if (!taskExists) {
        throw new Error("Task not found in task set");
    }
    
    return {
        ...taskSet,
        tasks: taskSet.tasks.filter(t => t.id !== taskId),
        updatedAt: new Date(),
    };
}

export function updateTaskInTaskSet(taskSet: TaskSet, updatedTask: Task): TaskSet {
    const taskIndex = taskSet.tasks.findIndex(t => t.id === updatedTask.id);
    if (taskIndex === -1) {
        throw new Error("Task not found in task set");
    }
    
    const newTasks = [...taskSet.tasks];
    newTasks[taskIndex] = updatedTask;
    
    return {
        ...taskSet,
        tasks: newTasks,
        updatedAt: new Date(),
    };
}

export function getTaskSetProgress(taskSet: TaskSet): {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    completionRate: number;
} {
    const total = taskSet.tasks.length;
    const pending = taskSet.tasks.filter(t => t.status === "pending").length;
    const inProgress = taskSet.tasks.filter(t => t.status === "inProgress").length;
    const completed = taskSet.tasks.filter(t => t.status === "completed").length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
        total,
        pending,
        inProgress,
        completed,
        completionRate,
    };
}

export function isTaskSetCompleted(taskSet: TaskSet): boolean {
    return taskSet.tasks.length > 0 && taskSet.tasks.every(t => t.status === "completed");
}

export function getActiveTasksFromTaskSet(taskSet: TaskSet): TaskList {
    return taskSet.tasks.filter(t => t.status !== "completed");
}