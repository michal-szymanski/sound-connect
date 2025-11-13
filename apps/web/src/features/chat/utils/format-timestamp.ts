export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const daysDiff = Math.floor((startOfToday.getTime() - startOfMessageDay.getTime()) / (1000 * 60 * 60 * 24));

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (daysDiff === 0) {
        return timeStr;
    }

    if (daysDiff === 1) {
        return `Yesterday ${timeStr}`;
    }

    if (daysDiff <= 7) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return `${dayName} ${timeStr}`;
    }

    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day} ${timeStr}`;
}
