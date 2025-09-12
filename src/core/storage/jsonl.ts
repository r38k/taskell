import type { TaskStorage } from "./index";
import type { ScheduledTask, Task, TaskSet } from "../type";
import { readFile, rename, writeFile } from "node:fs/promises";
import { ok, err } from "neverthrow";

// TODO: XDG対応?
const BASE_PATH = "~/.config/taskell";

export const jsonLinesStorage: TaskStorage = {

    async addTask(task: Task) {
        try {
            const filePath = `${BASE_PATH}/${task.id}.jsonl`;
            const fileContent = `${JSON.stringify(task)}\n`;
            writeFile(filePath, fileContent);
            return ok(filePath);
        } catch (error) {
            return err(error);
        }
    },

    async addScheduledTask(task: ScheduledTask) {
        try {
            const filePath = `${BASE_PATH}/${task.id}.jsonl`;
            const fileContent = `${JSON.stringify(task)}\n`;
            writeFile(filePath, fileContent);
            return ok(filePath);
        } catch (error) {
            return err(error);
        }
    },

    async addTaskSet(taskSet: TaskSet) {
        try {
            const filePath = `${BASE_PATH}/${taskSet.id}.jsonl`;
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
    async completeTask(id: string) {
        try {
            const filePath = `${BASE_PATH}/${id}.jsonl`;
            const doneFilePath = `${BASE_PATH}/done/${id}.jsonl`;
            rename(filePath, doneFilePath);
            return ok(doneFilePath);
        } catch (error) {
            return err(error);
        }
    },

    async getTaskById(id: string) {
        try {
            const filePath = `${BASE_PATH}/${id}.jsonl`;
            const fileContent = await readFile(filePath, "utf-8");
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getTaskSetById(id: string) {
        try {
            const filePath = `${BASE_PATH}/${id}.jsonl`;
            const fileContent = await readFile(filePath, "utf-8");
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getTasks() {
        try {
            const filePath = `${BASE_PATH}/*.jsonl`;
            const fileContent = await readFile(filePath, "utf-8");
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getScheduledTasks() {
        try {
            const filePath = `${BASE_PATH}/*.jsonl`;
            const fileContent = await readFile(filePath, "utf-8");
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },

    async getTaskSets() {
        try {
            const filePath = `${BASE_PATH}/*.jsonl`;
            const fileContent = await readFile(filePath, "utf-8");
            return ok(JSON.parse(fileContent));
        } catch (error) {
            return err(error);
        }
    },
}
