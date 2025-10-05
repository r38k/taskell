import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { errAsync, ResultAsync } from 'neverthrow';
import {
	type ScheduledTask,
	type TaskId,
	type TaskSet,
	type TaskSetId,
	type TaskStatus,
	type UnitTask,
} from '../type';
import type {
	RepositoryError,
	RepositoryErrorKind,
	RepositoryResult,
	TaskRepository,
} from './index';

const FILE_EXTENSION = '.jsonl' as const;
const ENCODING = 'utf-8' as const;
const DEFAULT_BASE_PATH = join(homedir(), '.config', 'taskell');
const TASK_DIR = 'task' as const;

const toRepositoryError = (
	kind: RepositoryErrorKind,
	message: string,
	cause?: unknown,
): RepositoryError => ({ kind, message, cause });

const wrapUnknownError =
	(kind: RepositoryErrorKind, message: string) =>
	(cause: unknown): RepositoryError =>
		toRepositoryError(kind, message, cause);

const taskFilePath = (basePath: string, type: string, status: TaskStatus, id: string): string =>
	join(basePath, TASK_DIR, type, status, `${id}${FILE_EXTENSION}`);

const readJsonFile = (path: string): RepositoryResult<unknown> =>
	ResultAsync.fromPromise(
		readFile(path, ENCODING).then((content) => JSON.parse(content)),
		wrapUnknownError('IO', `Failed to read file at ${path}`),
	).orElse((error) => {
		if ((error.cause as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
			return errAsync(toRepositoryError('NotFound', `File not found at ${path}`, error.cause));
		}
		return errAsync(error);
	});

const writeJsonFile = (path: string, data: unknown): RepositoryResult<void> =>
	ResultAsync.fromPromise(
		(async () => {
			await mkdir(dirname(path), { recursive: true });
			const content = `${JSON.stringify(data)}\n`;
			await writeFile(path, content, ENCODING);
		})(),
		wrapUnknownError('IO', `Failed to write file to ${path}`),
	);

export const createJsonlTaskRepository = (basePath: string = DEFAULT_BASE_PATH): TaskRepository => {
	const saveUnitTask = (task: UnitTask, status: TaskStatus = 'inbox') =>
		writeJsonFile(taskFilePath(basePath, 'unit', status, task.id), task).map(() => task);

	const saveScheduledTask = (task: ScheduledTask, status: TaskStatus = 'inbox') =>
		writeJsonFile(
			taskFilePath(basePath, 'scheduled', status, task.id),
			{
				...task,
				dueDate: task.dueDate.toString(),
			},
		).map(() => task);

	const saveTaskSet = (taskSet: TaskSet, status: TaskStatus = 'inbox') =>
		writeJsonFile(
			taskFilePath(basePath, 'taskset', status, taskSet.id),
			{
				...taskSet,
				tasks: taskSet.tasks.map((t) =>
					t.type === 'scheduled'
						? { ...t, dueDate: t.dueDate.toString() }
						: t
				),
			},
		).map(() => taskSet);

	const findUnitTask = (id: TaskId): RepositoryResult<UnitTask> =>
		errAsync(toRepositoryError('NotFound', 'Not implemented'));

	const findScheduledTask = (id: TaskId): RepositoryResult<ScheduledTask> =>
		errAsync(toRepositoryError('NotFound', 'Not implemented'));

	const findTaskSet = (id: TaskSetId): RepositoryResult<TaskSet> =>
		errAsync(toRepositoryError('NotFound', 'Not implemented'));

	return {
		saveUnitTask,
		saveScheduledTask,
		saveTaskSet,
		findUnitTask,
		findScheduledTask,
		findTaskSet,
	};
};
