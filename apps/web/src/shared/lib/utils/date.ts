import { parseISO, formatDistanceToNow } from 'date-fns';

export const formatElapsedTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'a while ago';
    }

    const distance = formatDistanceToNow(dateObj, { addSuffix: true });

    if (distance.includes('hour') || distance.includes('day') || distance.includes('week') || distance.includes('month') || distance.includes('year')) {
        return distance.replace(/^(\d+)/, 'over $1');
    }

    return distance;
};

export const formatRelativeTime = (timestamp: string): string => {
    const date = parseISO(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
};
