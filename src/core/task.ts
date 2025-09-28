import type { Result } from 'neverthrow';
import { type ScheduledTask, type TaskDueDateError, taskDueDate, type UnitTask } from './type';

export type ScheduleUnitTaskError = TaskDueDateError;

export const scheduleUnitTask = (
	task: UnitTask,
	dueDate: string,
): Result<ScheduledTask, ScheduleUnitTaskError> => {
	return taskDueDate(dueDate).map((parsedDueDate) => ({
		...task,
		type: 'scheduled',
		dueDate: parsedDueDate,
	}));
};
