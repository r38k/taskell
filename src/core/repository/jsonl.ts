import type { TaskStorage } from "./index";
import type { ScheduledTask, Task, TaskSet, TaskStatus, TaskType } from "../type";
import { readFile, rename, writeFile } from "node:fs/promises";
import { ok, err } from "neverthrow";

// TODO: XDG対応?
const BASE_PATH = "~/.config/taskell";

const FILE_EXTENSION = "jsonl";
const ENCODING = "utf-8";

type TaskPath = {
    [T in TaskType]: {
        [S in TaskStatus]: `${typeof BASE_PATH}/task/${T}/${S}`;
    }
}

function getTaskPath<T extends TaskType, S extends TaskStatus>(
    type: T,
    status: S
): TaskPath[T][S] {
    // TODO
    return `${BASE_PATH}/task/${type}/${status}` as TaskPath[T][S];
}

const initialStatus = "inbox" as const;


export const jsonLinesStorage: TaskStorage = {

    async addTask(task: Task) {
        try {
            const dirPath = getTaskPath("unit", initialStatus);
            const filePath = `${dirPath}/${task.id}.${FILE_EXTENSION}`;
            const fileContent = `${JSON.stringify(task)}\n`;
            writeFile(filePath, fileContent);
            return ok(filePath);
        } catch (error) {
            return err(error);
        }
    },

    async addScheduledTask(task: ScheduledTask) {
        try {
            const dirPath = getTaskPath("scheduled", initialStatus);
            const filePath = `${dirPath}/${task.id}.${FILE_EXTENSION}`;
            const fileContent = `${JSON.stringify(task)}\n`;
            writeFile(filePath, fileContent);
            return ok(filePath);
        } catch (error) {
            return err(error);
        }
    },

    async addTaskSet(taskSet: TaskSet) {
        try {
            const dirPath = getTaskPath("taskset", initialStatus);
            const filePath = `${dirPath}/${taskSet.id}.${FILE_EXTENSION}`;
            const fileContent = `${JSON.stringify(taskSet)}\n`;
            writeFile(filePath, fileContent);
            return ok(taskSet.id);
        } catch (error) {
            return err(error);
        }
    },

    /**
     * タスクファイルを完了ディレクトリへ移動
     * @param id 
     */
    async updateTaskStatus(id: string, type: TaskType, currentStatus: TaskStatus, targetStatus: TaskStatus) {
        try {
            const dirPath = getTaskPath(type, currentStatus);
            const currentFilePath = `${dirPath}/${id}.${FILE_EXTENSION}`;
            const targetFilePath = `${dirPath}/${targetStatus}/${id}.${FILE_EXTENSION}`;
            rename(currentFilePath, targetFilePath);
            return ok(targetFilePath);
        } catch (error) {
            return err(error);
        }
    },

    async getTaskById(id: string) {
        try {
            const filePath = `${BASE_PATH}/${id}.${FILE_EXTENSION}`;
            const fileContent = await readFile(filePath, ENCODING);
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getTaskSetById(id: string) {
        try {
            const filePath = `${BASE_PATH}/${id}.${FILE_EXTENSION}`;
            const fileContent = await readFile(filePath, ENCODING);
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getTasks() {
        try {
            const filePath = `${BASE_PATH}/*.${FILE_EXTENSION}`;
            const fileContent = await readFile(filePath, ENCODING);
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getScheduledTasks() {
        try {
            const filePath = `${BASE_PATH}/*.${FILE_EXTENSION}`;
            const fileContent = await readFile(filePath, ENCODING);
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getTaskSets() {
        try {
            const filePath = `${BASE_PATH}/*.${FILE_EXTENSION}`;
            const fileContent = await readFile(filePath, ENCODING);
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },
}
