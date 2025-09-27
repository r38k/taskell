import { err, ok, Result } from "neverthrow";
import { Temporal } from "temporal-polyfill";

declare const __newtype: unique symbol;

export type NewType<Constructor, Type> = Type & {
    readonly [__newtype]: Constructor;
}

export type TaskId = NewType<'TaskId', string>;
export type TaskIdError = {
    kind: "Validation";
}
export const taskId = (id: string): Result<TaskId, TaskIdError> => { 
    return /^[a-zA-Z0-9_\-]{21}$/.test(id) ? ok(id as TaskId) : err({kind: "Validation"})
}

export type TaskName = NewType<'TaskName', string>;
export type TaskNameError = {
    kind: "Validation"
}
export const taskName = (name: string): Result<TaskName, TaskNameError> => {
    return name.length > 0 ? ok(name as TaskName) : err({kind: "Validation"})
}

export type TaskDelta = NewType<'TaskDelta', string>;
export type TaskDeltaError = {}
export const taskDelta = (delta: string): Result<TaskDelta, TaskDeltaError> => {
    return ok(delta as TaskDelta);
}

export type TaskDueDate = NewType<'TaskDueDate', Temporal.PlainDate>;
type TaskDueDateError = {
    kind: "Validation"
}
export const taskDueDate = (date: string): Result<TaskDueDate, TaskDueDateError> => {
    // 存在する日付であること
    // 今日以降の日付であること

    try {
        return ok(Temporal.PlainDate.from(date) as TaskDueDate)
    } catch {
        return err({kind: "Validation"})
    }
}

export type TaskSetId = NewType<'TaskSetId', string>;
type TaskSetIdError = {
    kind: "Validation";
}
export const taskSetId = (id: string): Result<TaskSetId, TaskSetIdError> => { 
    return /^[a-zA-Z0-9_\-]{21}$/.test(id) ? ok(id as TaskSetId) : err({kind: "Validation"})
}
export type TaskSetName = NewType<'TaskSetName', string>;

// TODO: Baseという表現が気に入ってない
type BaseTask = {
    id: TaskId;
    name: TaskName;
    delta?: TaskDelta;
}

export type TaskType = "unit" | "scheduled" | "taskset";
export type TaskStatus = "inbox" | "active" | "done";
interface Inbox { status: "inbox" }
interface Active { status: "active" }
interface Done { status: "done" }

export type Task = UnitTask | ScheduledTask

export type UnitTask = {
    type: "unit";
} & BaseTask

export type ScheduledTask = { 
    type: "scheduled";
    dueDate: TaskDueDate;
} & BaseTask

export type TaskSet = {
    type: "taskset";
    id: TaskSetId;
    name: TaskSetName;
    tasks: ReadonlyArray<Task>;
}

interface UnitTaskInbox extends Inbox , UnitTask {}
interface UnitTaskActive extends Active, UnitTask {}
interface UnitTaskDone extends Done, UnitTask {}

interface ScheduledTaskInbox extends Inbox , ScheduledTask {}
interface ScheduledTaskActive extends Active, ScheduledTask {}
interface ScheduledTaskDone extends Done, ScheduledTask {}

interface TaskSetInbox extends Inbox , TaskSet {}
interface TaskSetActive extends Active, TaskSet {}
interface TaskSetDone extends Done, TaskSet {}
