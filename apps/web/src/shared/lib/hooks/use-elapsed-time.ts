import { useState, useEffect } from 'react';
import { formatElapsedTime } from '../utils/date';

export const useElapsedTime = (date: string | Date): string => {
    const [elapsedTime, setElapsedTime] = useState(() => formatElapsedTime(date));

    useEffect(() => {
        const updateElapsedTime = () => {
            setElapsedTime(formatElapsedTime(date));
        };

        updateElapsedTime();

        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

        const updateInterval = diffInSeconds < 120 ? 30000 : 60000;

        const interval = setInterval(updateElapsedTime, updateInterval);

        return () => clearInterval(interval);
    }, [date]);

    return elapsedTime;
};
