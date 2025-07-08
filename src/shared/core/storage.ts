import { DataStore, Project, TaskMeta, TaskSetSchedule, TaskHistory } from "./types.ts";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "taskell");
const DATA_FILE = join(CONFIG_DIR, "data.json");

export async function ensureConfigDir(): Promise<void> {
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
        console.error("Failed to create config directory:", error);
        throw error;
    }
}

export async function loadData(): Promise<DataStore> {
    try {
        await ensureConfigDir();
        const data = await fs.readFile(DATA_FILE, "utf-8");
        const parsed = JSON.parse(data);
        
        return {
            projects: parsed.projects || [],
            taskMetas: parsed.taskMetas || [],
            schedules: parsed.schedules || [],
            history: parsed.history || [],
            lastUpdated: new Date(parsed.lastUpdated || Date.now()),
        };
    } catch (error) {
        if ((error as any).code === "ENOENT") {
            return {
                projects: [],
                taskMetas: [],
                schedules: [],
                history: [],
                lastUpdated: new Date(),
            };
        }
        console.error("Failed to load data:", error);
        throw error;
    }
}

export async function saveData(data: DataStore): Promise<void> {
    try {
        await ensureConfigDir();
        
        const dataToSave = {
            ...data,
            lastUpdated: new Date(),
        };
        
        const jsonData = JSON.stringify(dataToSave, null, 2);
        
        const tempFile = `${DATA_FILE}.tmp`;
        await fs.writeFile(tempFile, jsonData, "utf-8");
        
        await fs.rename(tempFile, DATA_FILE);
    } catch (error) {
        console.error("Failed to save data:", error);
        throw error;
    }
}

export async function createBackup(): Promise<string> {
    try {
        await ensureConfigDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFile = join(CONFIG_DIR, `backup-${timestamp}.json`);
        
        const data = await fs.readFile(DATA_FILE, "utf-8");
        await fs.writeFile(backupFile, data, "utf-8");
        
        return backupFile;
    } catch (error) {
        console.error("Failed to create backup:", error);
        throw error;
    }
}

export async function restoreFromBackup(backupFile: string): Promise<void> {
    try {
        const backupData = await fs.readFile(backupFile, "utf-8");
        JSON.parse(backupData);
        
        await fs.writeFile(DATA_FILE, backupData, "utf-8");
    } catch (error) {
        console.error("Failed to restore from backup:", error);
        throw error;
    }
}

export async function exportData(exportPath: string): Promise<void> {
    try {
        const data = await loadData();
        const jsonData = JSON.stringify(data, null, 2);
        await fs.writeFile(exportPath, jsonData, "utf-8");
    } catch (error) {
        console.error("Failed to export data:", error);
        throw error;
    }
}

export async function importData(importPath: string): Promise<void> {
    try {
        const importedData = await fs.readFile(importPath, "utf-8");
        const parsed = JSON.parse(importedData);
        
        if (!parsed.projects || !Array.isArray(parsed.projects)) {
            throw new Error("Invalid data format: missing projects array");
        }
        
        await saveData(parsed);
    } catch (error) {
        console.error("Failed to import data:", error);
        throw error;
    }
}

export class DataManager {
    private data: DataStore;
    private autoSave: boolean;
    
    constructor(autoSave: boolean = true) {
        this.data = {
            projects: [],
            taskMetas: [],
            schedules: [],
            lastUpdated: new Date(),
        };
        this.autoSave = autoSave;
    }
    
    async initialize(): Promise<void> {
        this.data = await loadData();
    }
    
    async save(): Promise<void> {
        await saveData(this.data);
    }
    
    getProjects(): Project[] {
        return this.data.projects;
    }
    
    async setProjects(projects: Project[]): Promise<void> {
        this.data.projects = projects;
        if (this.autoSave) {
            await this.save();
        }
    }
    
    async addProject(project: Project): Promise<void> {
        this.data.projects.push(project);
        if (this.autoSave) {
            await this.save();
        }
    }
    
    async updateProject(project: Project): Promise<void> {
        const index = this.data.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
            this.data.projects[index] = project;
            if (this.autoSave) {
                await this.save();
            }
        }
    }
    
    async removeProject(projectId: string): Promise<void> {
        this.data.projects = this.data.projects.filter(p => p.id !== projectId);
        if (this.autoSave) {
            await this.save();
        }
    }
    
    getTaskMetas(): TaskMeta[] {
        return this.data.taskMetas;
    }
    
    async addTaskMeta(meta: TaskMeta): Promise<void> {
        this.data.taskMetas.push(meta);
        if (this.autoSave) {
            await this.save();
        }
    }
    
    async updateTaskMeta(meta: TaskMeta): Promise<void> {
        const index = this.data.taskMetas.findIndex(m => m.taskId === meta.taskId);
        if (index !== -1) {
            this.data.taskMetas[index] = meta;
            if (this.autoSave) {
                await this.save();
            }
        }
    }
    
    getSchedules(): TaskSetSchedule[] {
        return this.data.schedules;
    }
    
    async addSchedule(schedule: TaskSetSchedule): Promise<void> {
        this.data.schedules.push(schedule);
        if (this.autoSave) {
            await this.save();
        }
    }
    
    async removeSchedule(scheduleId: string): Promise<void> {
        this.data.schedules = this.data.schedules.filter(s => s.id !== scheduleId);
        if (this.autoSave) {
            await this.save();
        }
    }
}