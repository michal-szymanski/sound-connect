import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export { formatElapsedTime } from './utils/date';
export { useElapsedTime } from './hooks/use-elapsed-time';
