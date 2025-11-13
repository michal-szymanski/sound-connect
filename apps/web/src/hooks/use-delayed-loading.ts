import { useEffect, useState } from 'react';

type Props = {
    isLoading: boolean;
    delay?: number;
};

export function useDelayedLoading({ isLoading, delay = 2000 }: Props): boolean {
    const [shouldShowLoading, setShouldShowLoading] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setShouldShowLoading(false);
            return;
        }

        const timer = setTimeout(() => {
            setShouldShowLoading(true);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [isLoading, delay]);

    return shouldShowLoading;
}
