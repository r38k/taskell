export type Task = {
    id: string;
    name: string;
    delta: string;
}

export type ScheduledTask = Task & { 
    dueDate: Date;
}

export type TaskSet = {
    id: string;
    name: string;
    tasks: ReadonlyArray<Task>;
}

