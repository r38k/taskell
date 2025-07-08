export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function parseDate(dateString: string): Date {
    return new Date(dateString);
}