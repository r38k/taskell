import { Project, TaskSet } from "./types.ts";
import { generateId } from "./utils.ts";

export function createProject(name: string, description?: string): Project {
    const now = new Date();
    return {
        id: generateId(),
        name,
        description,
        taskSets: [],
        archived: false,
        createdAt: now,
        updatedAt: now,
    };
}

export function addTaskSetToProject(project: Project, taskSet: TaskSet): Project {
    const taskSetExists = project.taskSets.some(ts => ts.id === taskSet.id);
    if (taskSetExists) {
        throw new Error("TaskSet already exists in project");
    }
    
    return {
        ...project,
        taskSets: [...project.taskSets, taskSet],
        updatedAt: new Date(),
    };
}

export function removeTaskSetFromProject(project: Project, taskSetId: string): Project {
    const taskSetExists = project.taskSets.some(ts => ts.id === taskSetId);
    if (!taskSetExists) {
        throw new Error("TaskSet not found in project");
    }
    
    return {
        ...project,
        taskSets: project.taskSets.filter(ts => ts.id !== taskSetId),
        updatedAt: new Date(),
    };
}

export function updateTaskSetInProject(project: Project, updatedTaskSet: TaskSet): Project {
    const taskSetIndex = project.taskSets.findIndex(ts => ts.id === updatedTaskSet.id);
    if (taskSetIndex === -1) {
        throw new Error("TaskSet not found in project");
    }
    
    const newTaskSets = [...project.taskSets];
    newTaskSets[taskSetIndex] = updatedTaskSet;
    
    return {
        ...project,
        taskSets: newTaskSets,
        updatedAt: new Date(),
    };
}

export function archiveProject(project: Project): Project {
    if (project.archived) {
        throw new Error("Project is already archived");
    }
    
    return {
        ...project,
        archived: true,
        updatedAt: new Date(),
    };
}

export function unarchiveProject(project: Project): Project {
    if (!project.archived) {
        throw new Error("Project is not archived");
    }
    
    return {
        ...project,
        archived: false,
        updatedAt: new Date(),
    };
}

export function getProjectProgress(project: Project): {
    totalTaskSets: number;
    completedTaskSets: number;
    totalTasks: number;
    completedTasks: number;
    overallCompletionRate: number;
} {
    const totalTaskSets = project.taskSets.length;
    let completedTaskSets = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    
    for (const taskSet of project.taskSets) {
        const taskSetCompleted = taskSet.tasks.length > 0 && 
            taskSet.tasks.every(t => t.status === "completed");
        
        if (taskSetCompleted) {
            completedTaskSets++;
        }
        
        totalTasks += taskSet.tasks.length;
        completedTasks += taskSet.tasks.filter(t => t.status === "completed").length;
    }
    
    const overallCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
        totalTaskSets,
        completedTaskSets,
        totalTasks,
        completedTasks,
        overallCompletionRate,
    };
}

export function getActiveProjects(projects: Project[]): Project[] {
    return projects.filter(p => !p.archived);
}

export function getArchivedProjects(projects: Project[]): Project[] {
    return projects.filter(p => p.archived);
}

export function findProjectById(projects: Project[], projectId: string): Project | undefined {
    return projects.find(p => p.id === projectId);
}

export function findTaskSetInProject(project: Project, taskSetId: string): TaskSet | undefined {
    return project.taskSets.find(ts => ts.id === taskSetId);
}