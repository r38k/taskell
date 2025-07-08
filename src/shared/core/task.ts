import { Task, TaskStatus, TaskList, TaskMeta, TaskDue } from "./types.ts";
import { generateId } from "./utils.ts";

export function createTask(content: string): Task {
    const now = new Date();
    return {
        id: generateId(),
        content,
        status: "pending",
        createdAt: now,
        updatedAt: now,
    };
}

export function startTask(task: Task): Task {
    if (task.status === "completed") {
        throw new Error("Cannot start a completed task");
    }
    
    return {
        ...task,
        status: "inProgress",
        updatedAt: new Date(),
    };
}

export function completeTask(task: Task): Task {
    if (task.status === "pending") {
        throw new Error("Cannot complete a task that hasn't been started");
    }
    
    return {
        ...task,
        status: "completed",
        updatedAt: new Date(),
    };
}

export function updateTaskContent(task: Task, content: string): Task {
    if (task.status === "completed") {
        throw new Error("Cannot update a completed task");
    }
    
    return {
        ...task,
        content,
        updatedAt: new Date(),
    };
}

export function getTasksByStatus(tasks: TaskList, status: TaskStatus): TaskList {
    return tasks.filter(task => task.status === status);
}

export function getInProgressTasks(tasks: TaskList): TaskList {
    return getTasksByStatus(tasks, "inProgress");
}

export function createTaskMeta(taskId: string, due?: TaskDue, tags?: string[], notes?: string): TaskMeta {
    return {
        taskId,
        due,
        tags,
        notes,
    };
}

export function updateTaskMeta(meta: TaskMeta, updates: Partial<TaskMeta>): TaskMeta {
    return {
        ...meta,
        ...updates,
    };
}

export function isTaskOverdue(task: Task, meta?: TaskMeta): boolean {
    if (!meta || !meta.due || !meta.due.deadline) {
        return false;
    }
    
    if (task.status === "completed") {
        return false;
    }
    
    return new Date() > meta.due.deadline;
}