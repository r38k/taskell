import type { ResultAsync } from 'neverthrow';
import { resultAsyncFromResult } from '../../util/result';
import type { RepositoryError, TaskRepository } from '../repository';
import { type ScheduleUnitTaskError, scheduleUnitTask } from '../task';
import type { ScheduledTask, UnitTask } from '../type';

export type WithDueDateInput = {
	task: UnitTask;
	dueDate: string;
};

export type WithDueDateError = ScheduleUnitTaskError | RepositoryError;

type SaveScheduledTaskPort = Pick<TaskRepository, 'saveScheduledTask'>;

export const withDueDate =
	(repository: SaveScheduledTaskPort) =>
	(input: WithDueDateInput): ResultAsync<ScheduledTask, WithDueDateError> =>
		resultAsyncFromResult(scheduleUnitTask(input.task, input.dueDate)).andThen(
			(scheduledTask) => repository.saveScheduledTask(scheduledTask),
		);
