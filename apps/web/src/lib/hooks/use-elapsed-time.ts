import { useState, useEffect } from 'react';
import { formatElapsedTime } from '../utils/date';

export const useElapsedTime = (date: string | Date): string => {
    const [elapsedTime, setElapsedTime] = useState(() => formatElapsedTime(date));

    useEffect(() => {
        const updateElapsedTime = () => {
            setElapsedTime(formatElapsedTime(date));
        };

        // Update immediately
        updateElapsedTime();

        // Calculate time difference to determine update frequency
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

        // If less than 2 minutes old, update every 30 seconds to catch the transition
        // Otherwise, update every minute
        const updateInterval = diffInSeconds < 120 ? 30000 : 60000;

        const interval = setInterval(updateElapsedTime, updateInterval);

        return () => clearInterval(interval);
    }, [date]);

    return elapsedTime;
};
