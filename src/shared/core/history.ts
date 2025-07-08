import { Task, TaskHistory, TaskStatus } from "./types.ts";
import { generateId } from "./utils.ts";

export function createHistoryEntry(
    taskId: string,
    action: TaskHistory["action"],
    metadata?: {
        previousStatus?: TaskStatus;
        newStatus?: TaskStatus;
        previousContent?: string;
        newContent?: string;
        [key: string]: any;
    }
): TaskHistory {
    return {
        id: generateId(),
        taskId,
        action,
        timestamp: new Date(),
        ...metadata,
    };
}

export function recordTaskCreated(task: Task): TaskHistory {
    return createHistoryEntry(task.id, "created", {
        newStatus: task.status,
        newContent: task.content,
    });
}

export function recordTaskStarted(previousTask: Task, newTask: Task): TaskHistory {
    return createHistoryEntry(newTask.id, "started", {
        previousStatus: previousTask.status,
        newStatus: newTask.status,
    });
}

export function recordTaskCompleted(previousTask: Task, newTask: Task): TaskHistory {
    return createHistoryEntry(newTask.id, "completed", {
        previousStatus: previousTask.status,
        newStatus: newTask.status,
    });
}

export function recordTaskUpdated(previousTask: Task, newTask: Task): TaskHistory {
    const metadata: any = {};
    
    if (previousTask.content !== newTask.content) {
        metadata.previousContent = previousTask.content;
        metadata.newContent = newTask.content;
    }
    
    if (previousTask.status !== newTask.status) {
        metadata.previousStatus = previousTask.status;
        metadata.newStatus = newTask.status;
    }
    
    return createHistoryEntry(newTask.id, "updated", metadata);
}

export function recordTaskDeleted(task: Task): TaskHistory {
    return createHistoryEntry(task.id, "deleted", {
        previousStatus: task.status,
        previousContent: task.content,
    });
}

export function getTaskHistory(history: TaskHistory[], taskId: string): TaskHistory[] {
    return history
        .filter(entry => entry.taskId === taskId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function getHistoryByDateRange(
    history: TaskHistory[],
    startDate: Date,
    endDate: Date
): TaskHistory[] {
    return history.filter(entry => 
        entry.timestamp >= startDate && entry.timestamp <= endDate
    );
}

export function getHistoryByAction(
    history: TaskHistory[],
    action: TaskHistory["action"]
): TaskHistory[] {
    return history.filter(entry => entry.action === action);
}

export function getRecentHistory(
    history: TaskHistory[],
    limit: number = 10
): TaskHistory[] {
    return history
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
}

export function formatHistoryEntry(entry: TaskHistory): string {
    const timestamp = entry.timestamp.toLocaleString();
    
    switch (entry.action) {
        case "created":
            return `[${timestamp}] タスク作成: "${entry.newContent}"`;
        case "started":
            return `[${timestamp}] タスク開始: ${entry.previousStatus} → ${entry.newStatus}`;
        case "completed":
            return `[${timestamp}] タスク完了: ${entry.previousStatus} → ${entry.newStatus}`;
        case "updated":
            if (entry.previousContent && entry.newContent) {
                return `[${timestamp}] タスク更新: "${entry.previousContent}" → "${entry.newContent}"`;
            } else if (entry.previousStatus && entry.newStatus) {
                return `[${timestamp}] ステータス変更: ${entry.previousStatus} → ${entry.newStatus}`;
            }
            return `[${timestamp}] タスク更新`;
        case "deleted":
            return `[${timestamp}] タスク削除: "${entry.previousContent}"`;
        default:
            return `[${timestamp}] ${entry.action}`;
    }
}