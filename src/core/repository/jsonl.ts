import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { errAsync, ok, Result, ResultAsync } from 'neverthrow';
import { resultAsyncFromResult } from '../../util/result';
import {
	type ScheduledTask,
	type Task,
	type TaskId,
	type TaskSet,
	type TaskSetId,
	type TaskSetName,
	type TaskStatus,
	type TaskType,
	taskDelta,
	taskDueDate,
	taskId,
	taskName,
	taskSetId,
	type UnitTask,
	TaskDelta,
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
const STATUSES: ReadonlyArray<TaskStatus> = ['inbox', 'active', 'done'];

const toRepositoryError = (
	kind: RepositoryErrorKind,
	message: string,
	cause?: unknown,
): RepositoryError => ({ kind, message, cause });

const wrapUnknownError =
	(kind: RepositoryErrorKind, message: string) =>
	(cause: unknown): RepositoryError =>
		toRepositoryError(kind, message, cause);

const directoryFor = (basePath: string, type: TaskType, status: TaskStatus): string =>
	join(basePath, TASK_DIR, type, status);

const taskFilePath = (basePath: string, type: TaskType, status: TaskStatus, id: string): string =>
	join(directoryFor(basePath, type, status), `${id}${FILE_EXTENSION}`);

type SerializedUnitTask = {
	type: 'unit';
	id: string;
	name: string;
	delta?: string;
};

type SerializedScheduledTask = {
	type: 'scheduled';
	id: string;
	name: string;
	delta?: string;
	dueDate: string;
};

type SerializedTask = SerializedUnitTask | SerializedScheduledTask;

type SerializedTaskSet = {
	type: 'taskset';
	id: string;
	name: string;
	tasks: SerializedTask[];
};

const serializeUnitTask = (task: UnitTask): SerializedUnitTask => ({
	type: 'unit',
	id: task.id,
	name: task.name,
	delta: task.delta,
});

const serializeScheduledTask = (task: ScheduledTask): SerializedScheduledTask => ({
	type: 'scheduled',
	id: task.id,
	name: task.name,
	delta: task.delta,
	dueDate: task.dueDate.toString(),
});

const serializeTask = (task: Task): SerializedTask =>
	task.type === 'unit' ? serializeUnitTask(task) : serializeScheduledTask(task);

const serializeTaskSet = (taskSet: TaskSet): SerializedTaskSet => ({
	type: 'taskset',
	id: taskSet.id,
	name: taskSet.name,
	tasks: taskSet.tasks.map(serializeTask),
});

const parseTaskId = (raw: string, context: string) =>
	taskId(raw).mapErr((cause) => toRepositoryError('Validation', context, cause));

const parseTaskName = (raw: string, context: string) =>
	taskName(raw).mapErr((cause) => toRepositoryError('Validation', context, cause));

const parseTaskSetId = (raw: string, context: string) =>
	taskSetId(raw).mapErr((cause) => toRepositoryError('Validation', context, cause));

const parseTaskDelta = (
	raw: string | undefined,
	context: string,
): Result<TaskDelta | undefined, RepositoryError> => {
	if (raw === undefined) {
		return ok<undefined, RepositoryError>(undefined);
	}
	return taskDelta(raw)
		.mapErr((cause) => toRepositoryError('Validation', context, cause))
		.map((delta) => delta as TaskDelta | undefined);
};

const parseTaskDueDate = (raw: string, context: string) =>
	taskDueDate(raw).mapErr((cause) => toRepositoryError('Validation', context, cause));

const parseSerializedUnitTask = (input: SerializedUnitTask): Result<UnitTask, RepositoryError> => {
	const idResult = parseTaskId(input.id, `Invalid task id: ${input.id}`);
	const nameResult = parseTaskName(input.name, `Invalid task name: ${input.name}`);
	const deltaResult = parseTaskDelta(input.delta, `Invalid task delta for ${input.id}`);

	return Result.combine([idResult, nameResult, deltaResult]).map(([id, name, delta]) => ({
		type: 'unit',
		id,
		name,
		delta,
	}));
};

const parseSerializedScheduledTask = (
	input: SerializedScheduledTask,
): Result<ScheduledTask, RepositoryError> => {
	const idResult = parseTaskId(input.id, `Invalid task id: ${input.id}`);
	const nameResult = parseTaskName(input.name, `Invalid task name: ${input.name}`);
	const deltaResult = parseTaskDelta(input.delta, `Invalid task delta for ${input.id}`);
	const dueDateResult = parseTaskDueDate(input.dueDate, `Invalid due date for ${input.id}`);

	return Result.combine([idResult, nameResult, deltaResult, dueDateResult]).map(
		([id, name, delta, dueDate]) => ({
			type: 'scheduled',
			id,
			name,
			delta,
			dueDate,
		}),
	);
};

const parseSerializedTask = (input: SerializedTask): Result<Task, RepositoryError> =>
	input.type === 'unit' ? parseSerializedUnitTask(input) : parseSerializedScheduledTask(input);

const parseTaskSetName = (raw: string, context: string): Result<TaskSetName, RepositoryError> =>
	parseTaskName(raw, context).map((value) => value as unknown as TaskSetName);

const parseSerializedTaskSet = (input: SerializedTaskSet): Result<TaskSet, RepositoryError> => {
	const idResult = parseTaskSetId(input.id, `Invalid task set id: ${input.id}`);
	const nameResult = parseTaskSetName(input.name, `Invalid task set name: ${input.name}`);
	const tasksResult = Result.combine(input.tasks.map(parseSerializedTask)).map(
		(tasks) => tasks as ReadonlyArray<Task>,
	);

	return Result.combine([idResult, nameResult, tasksResult]).map(([id, name, tasks]) => ({
		type: 'taskset',
		id,
		name,
		tasks,
	}));
};

const readJsonFile = (path: string, fileDescription: string): RepositoryResult<unknown> =>
	ResultAsync.fromPromise(
		readFile(path, ENCODING),
		wrapUnknownError('IO', `Failed to read ${fileDescription} at ${path}`),
	).andThen((content) =>
		resultAsyncFromResult(
			Result.fromThrowable(
				() => JSON.parse(content),
				(cause) => toRepositoryError('Parse', `Failed to parse JSON at ${path}`, cause),
			)(),
		),
	);

const writeJsonFile = (path: string, data: unknown, description: string): RepositoryResult<void> =>
	ResultAsync.fromPromise(
		(async () => {
			await mkdir(dirname(path), { recursive: true });
			const content = `${JSON.stringify(data)}\n`;
			await writeFile(path, content, ENCODING);
		})(),
		wrapUnknownError('IO', `Failed to write ${description} to ${path}`),
	);

const listIds = (directory: string, description: string): RepositoryResult<ReadonlyArray<string>> =>
	ResultAsync.fromPromise(
		(async () => {
			await mkdir(directory, { recursive: true });
			const entries = await readdir(directory);
			return entries
				.filter((entry) => entry.endsWith(FILE_EXTENSION))
				.map((entry) => entry.slice(0, -FILE_EXTENSION.length));
		})(),
		wrapUnknownError('IO', `Failed to list ${description} in ${directory}`),
	);

type SerializedTaskForType<T extends 'unit' | 'scheduled'> = T extends 'unit'
	? SerializedUnitTask
	: SerializedScheduledTask;

function readSerializedTask<T extends 'unit' | 'scheduled'>(
	basePath: string,
	type: T,
	status: TaskStatus,
	id: string,
): RepositoryResult<SerializedTaskForType<T>> {
	const path = taskFilePath(basePath, type, status, id);
	return readJsonFile(path, `${type} task`)
		.andThen((raw) => {
			if (typeof raw !== 'object' || raw === null) {
				return errAsync(
					toRepositoryError('Parse', `Task file ${path} is not a JSON object`),
				);
			}
			const serialized = raw as SerializedTask;
			if (serialized.type !== type) {
				return errAsync(
					toRepositoryError(
						'Parse',
						`Task file ${path} contains unexpected type ${serialized.type}`,
					),
				);
			}
			return resultAsyncFromResult(ok(serialized as SerializedTaskForType<T>));
		})
		.orElse((error) => {
			if (
				error.kind === 'IO' &&
				(error.cause as NodeJS.ErrnoException | undefined)?.code === 'ENOENT'
			) {
				return errAsync(
					toRepositoryError('NotFound', `Task file not found at ${path}`, error.cause),
				);
			}
			return errAsync(error);
		});
}

const readSerializedTaskSet = (
	basePath: string,
	status: TaskStatus,
	id: string,
): RepositoryResult<SerializedTaskSet> => {
	const path = taskFilePath(basePath, 'taskset', status, id);
	return readJsonFile(path, 'task set')
		.andThen((raw) => {
			if (typeof raw !== 'object' || raw === null) {
				return errAsync(
					toRepositoryError('Parse', `Task set file ${path} is not a JSON object`),
				);
			}
			const serialized = raw as SerializedTaskSet;
			if (serialized.type !== 'taskset') {
				return errAsync(
					toRepositoryError(
						'Parse',
						`Task set file ${path} contains unexpected type ${serialized.type}`,
					),
				);
			}
			return resultAsyncFromResult(ok(serialized));
		})
		.orElse((error) => {
			if (
				error.kind === 'IO' &&
				(error.cause as NodeJS.ErrnoException | undefined)?.code === 'ENOENT'
			) {
				return errAsync(
					toRepositoryError(
						'NotFound',
						`Task set file not found at ${path}`,
						error.cause,
					),
				);
			}
			return errAsync(error);
		});
};

const listSerializedTasks = <T extends 'unit' | 'scheduled'>(
	basePath: string,
	type: T,
	status: TaskStatus,
): RepositoryResult<ReadonlyArray<SerializedTaskForType<T>>> =>
	listIds(directoryFor(basePath, type, status), `${type} tasks`).andThen((ids) =>
		ResultAsync.combine(ids.map((id) => readSerializedTask(basePath, type, status, id))),
	);

const listSerializedTaskSets = (
	basePath: string,
	status: TaskStatus,
): RepositoryResult<ReadonlyArray<SerializedTaskSet>> =>
	listIds(directoryFor(basePath, 'taskset', status), 'task sets').andThen((ids) =>
		ResultAsync.combine(ids.map((id) => readSerializedTaskSet(basePath, status, id))),
	);

const writeSerializedTask = (
	basePath: string,
	type: TaskType,
	status: TaskStatus,
	id: string,
	payload: SerializedTask | SerializedTaskSet,
): RepositoryResult<void> =>
	writeJsonFile(taskFilePath(basePath, type, status, id), payload, `${type} task`);

const findAcrossStatuses = <T>(
	reader: (status: TaskStatus) => RepositoryResult<T>,
	notFoundMessage: string,
): RepositoryResult<T> => {
	const iterate = (statuses: ReadonlyArray<TaskStatus>): RepositoryResult<T> => {
		const [status, ...rest] = statuses;
		if (status === undefined) {
			return errAsync(toRepositoryError('NotFound', notFoundMessage));
		}
		return reader(status).orElse((error) => {
			if (error.kind === 'NotFound') {
				return iterate(rest);
			}
			return errAsync(error);
		});
	};
	return iterate(STATUSES);
};

export const createJsonlTaskRepository = (basePath: string = DEFAULT_BASE_PATH): TaskRepository => {
	const saveUnitTask = (task: UnitTask, status: TaskStatus = 'inbox') =>
		writeSerializedTask(basePath, 'unit', status, task.id, serializeUnitTask(task)).map(
			() => task,
		);

	const saveScheduledTask = (task: ScheduledTask, status: TaskStatus = 'inbox') =>
		writeSerializedTask(
			basePath,
			'scheduled',
			status,
			task.id,
			serializeScheduledTask(task),
		).map(() => task);

	const saveTaskSet = (taskSet: TaskSet, status: TaskStatus = 'inbox') =>
		writeSerializedTask(basePath, 'taskset', status, taskSet.id, serializeTaskSet(taskSet)).map(
			() => taskSet,
		);

	const findUnitTask = (id: TaskId) =>
		findAcrossStatuses(
			(status) => readSerializedTask(basePath, 'unit', status, id),
			`unit task ${id} not found`,
		).andThen((serialized) => resultAsyncFromResult(parseSerializedUnitTask(serialized)));

	const findScheduledTask = (id: TaskId) =>
		findAcrossStatuses(
			(status) => readSerializedTask(basePath, 'scheduled', status, id),
			`scheduled task ${id} not found`,
		).andThen((serialized) => resultAsyncFromResult(parseSerializedScheduledTask(serialized)));

	const findTaskSet = (id: TaskSetId) =>
		findAcrossStatuses(
			(status) => readSerializedTaskSet(basePath, status, id),
			`task set ${id} not found`,
		).andThen((serialized) => resultAsyncFromResult(parseSerializedTaskSet(serialized)));

	const listUnitTasks = (status: TaskStatus) =>
		listSerializedTasks(basePath, 'unit', status)
			.andThen((serialized) =>
				resultAsyncFromResult(Result.combine(serialized.map(parseSerializedUnitTask))),
			)
			.map((tasks) => tasks as ReadonlyArray<UnitTask>);

	const listScheduledTasks = (status: TaskStatus) =>
		listSerializedTasks(basePath, 'scheduled', status)
			.andThen((serialized) =>
				resultAsyncFromResult(Result.combine(serialized.map(parseSerializedScheduledTask))),
			)
			.map((tasks) => tasks as ReadonlyArray<ScheduledTask>);

	const listTaskSets = (status: TaskStatus) =>
		listSerializedTaskSets(basePath, status)
			.andThen((serialized) =>
				resultAsyncFromResult(Result.combine(serialized.map(parseSerializedTaskSet))),
			)
			.map((taskSets) => taskSets as ReadonlyArray<TaskSet>);

	const updateTaskStatus = (input: {
		id: TaskId | TaskSetId;
		type: TaskType;
		from: TaskStatus;
		to: TaskStatus;
	}) => {
		const source = taskFilePath(basePath, input.type, input.from, input.id);
		const destinationDir = directoryFor(basePath, input.type, input.to);
		const destination = taskFilePath(basePath, input.type, input.to, input.id);
		return ResultAsync.fromPromise(
			(async () => {
				await mkdir(destinationDir, { recursive: true });
				await rename(source, destination);
			})(),
			wrapUnknownError('IO', `Failed to move ${input.type} task ${input.id}`),
		).orElse((error) => {
			if ((error.cause as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
				return errAsync(
					toRepositoryError(
						'NotFound',
						`${input.type} task ${input.id} not found`,
						error.cause,
					),
				);
			}
			return errAsync(error);
		});
	};

	const removeTask = (task: { id: TaskId | TaskSetId; type: TaskType; status: TaskStatus }) => {
		const path = taskFilePath(basePath, task.type, task.status, task.id);
		return ResultAsync.fromPromise(
			rm(path),
			wrapUnknownError('IO', `Failed to remove ${task.type} task ${task.id}`),
		).orElse((error) => {
			if ((error.cause as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
				return errAsync(
					toRepositoryError(
						'NotFound',
						`${task.type} task ${task.id} not found`,
						error.cause,
					),
				);
			}
			return errAsync(error);
		});
	};

	return {
		saveUnitTask,
		saveScheduledTask,
		saveTaskSet,
		findUnitTask,
		findScheduledTask,
		findTaskSet,
		listUnitTasks,
		listScheduledTasks,
		listTaskSets,
		updateTaskStatus,
		removeTask,
	};
};
