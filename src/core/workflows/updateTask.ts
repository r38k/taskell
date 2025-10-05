import { Result } from 'neverthrow';
import { type Task, taskDueDate, type TaskDueDateError, type TaskSet, taskSetId, type TaskSetIdError, taskSetName, type TaskSetNameError, type ScheduledTask, type UnitTask } from '../type.js';
import { nanoid } from 'nanoid';

// Adding due date to a unit task

export interface WithDueDateInput {
	task: UnitTask;
	dueDate: string;
};

export interface WithDueDateError extends TaskDueDateError {};

export type WithDueDate = (input: WithDueDateInput) => Result<ScheduledTask, WithDueDateError>;

export const withDueDate: WithDueDate = (input): Result<ScheduledTask, WithDueDateError> => {
	return taskDueDate(input.dueDate).map((parsedDueDate) => ({
		...input.task,
		type: 'scheduled',
		dueDate: parsedDueDate,
	}));
};

// Grouping tasks into a task set

interface GroupTasks {
	name: string;
	tasks: ReadonlyArray<Task>;
}

interface GroupTasksError extends TaskSetIdError, TaskSetNameError {};

export type groupTasks = (input: GroupTasks) => Result<TaskSet, GroupTasksError>;

export const groupTasks: groupTasks = (input) => {
	const id = taskSetId(nanoid());
	const name = taskSetName(input.name);

	const values = Result.combine([id, name]);

	return values.map(([id, name]) => ({
		type: 'taskset' as const,
		id,
		name: name,
		tasks: input.tasks,
	}));
}
