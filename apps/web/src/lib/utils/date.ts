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
