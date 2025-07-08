import { TaskSetSchedule } from "./types.ts";
import { generateId } from "./utils.ts";

export function createSchedule(
    taskSetId: string,
    scheduledDate: Date,
    recurring?: {
        interval: "daily" | "weekly" | "monthly";
        endDate?: Date;
    }
): TaskSetSchedule {
    return {
        id: generateId(),
        taskSetId,
        scheduledDate,
        recurring,
        createdAt: new Date(),
    };
}

export function getSchedulesForDate(schedules: TaskSetSchedule[], date: Date): TaskSetSchedule[] {
    const dateString = date.toDateString();
    
    return schedules.filter(schedule => {
        const scheduleDateString = schedule.scheduledDate.toDateString();
        
        if (scheduleDateString === dateString) {
            return true;
        }
        
        if (schedule.recurring) {
            return isDateInRecurringSchedule(date, schedule);
        }
        
        return false;
    });
}

export function isDateInRecurringSchedule(date: Date, schedule: TaskSetSchedule): boolean {
    if (!schedule.recurring) {
        return false;
    }
    
    const startDate = schedule.scheduledDate;
    const endDate = schedule.recurring.endDate || new Date("2100-01-01");
    
    if (date < startDate || date > endDate) {
        return false;
    }
    
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (schedule.recurring.interval) {
        case "daily":
            return true;
        case "weekly":
            return daysDiff % 7 === 0;
        case "monthly":
            return date.getDate() === startDate.getDate();
        default:
            return false;
    }
}

export function getUpcomingSchedules(
    schedules: TaskSetSchedule[],
    fromDate: Date = new Date(),
    days: number = 7
): TaskSetSchedule[] {
    const upcomingSchedules: TaskSetSchedule[] = [];
    const endDate = new Date(fromDate);
    endDate.setDate(endDate.getDate() + days);
    
    for (let d = new Date(fromDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dailySchedules = getSchedulesForDate(schedules, new Date(d));
        upcomingSchedules.push(...dailySchedules.filter(s => 
            !upcomingSchedules.some(existing => existing.id === s.id)
        ));
    }
    
    return upcomingSchedules.sort((a, b) => 
        a.scheduledDate.getTime() - b.scheduledDate.getTime()
    );
}

export function removeSchedule(schedules: TaskSetSchedule[], scheduleId: string): TaskSetSchedule[] {
    return schedules.filter(s => s.id !== scheduleId);
}

export function updateSchedule(
    schedule: TaskSetSchedule,
    updates: Partial<Omit<TaskSetSchedule, "id" | "createdAt">>
): TaskSetSchedule {
    return {
        ...schedule,
        ...updates,
    };
}

export function getSchedulesByTaskSetId(
    schedules: TaskSetSchedule[],
    taskSetId: string
): TaskSetSchedule[] {
    return schedules.filter(s => s.taskSetId === taskSetId);
}

export function getNextOccurrence(schedule: TaskSetSchedule, afterDate: Date = new Date()): Date | null {
    const scheduledDate = schedule.scheduledDate;
    
    if (!schedule.recurring) {
        return scheduledDate > afterDate ? scheduledDate : null;
    }
    
    if (schedule.recurring.endDate && afterDate > schedule.recurring.endDate) {
        return null;
    }
    
    let nextDate = new Date(scheduledDate);
    
    while (nextDate <= afterDate) {
        switch (schedule.recurring.interval) {
            case "daily":
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case "weekly":
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case "monthly":
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }
    }
    
    if (schedule.recurring.endDate && nextDate > schedule.recurring.endDate) {
        return null;
    }
    
    return nextDate;
}