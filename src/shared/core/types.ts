export type TaskStatus = "pending" | "inProgress" | "completed";

export type Task = {
    id: string;
    content: string;
    status: TaskStatus;
    createdAt: Date;
    updatedAt: Date;
};

export type TaskDue = {
    targetDate?: Date;
    deadline?: Date;
};

export type TaskMeta = {
    taskId: string;
    due?: TaskDue;
    tags?: string[];
    notes?: string;
};

export type TaskList = Task[];

export type TaskSet = {
    id: string;
    name: string;
    description?: string;
    tasks: TaskList;
    createdAt: Date;
    updatedAt: Date;
};

export type Project = {
    id: string;
    name: string;
    description?: string;
    taskSets: TaskSet[];
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type TaskSetSchedule = {
    id: string;
    taskSetId: string;
    scheduledDate: Date;
    recurring?: {
        interval: "daily" | "weekly" | "monthly";
        endDate?: Date;
    };
    createdAt: Date;
};

export type TaskHistory = {
    id: string;
    taskId: string;
    action: "created" | "started" | "completed" | "updated" | "deleted";
    timestamp: Date;
    previousStatus?: TaskStatus;
    newStatus?: TaskStatus;
    previousContent?: string;
    newContent?: string;
    metadata?: Record<string, any>;
};

export type DataStore = {
    projects: Project[];
    taskMetas: TaskMeta[];
    schedules: TaskSetSchedule[];
    history: TaskHistory[];
    lastUpdated: Date;
};