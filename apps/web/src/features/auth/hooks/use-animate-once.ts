import { useState } from 'react';

type WindowWithFlag = Window & { __loginHeroAnimated?: boolean };

export function useAnimateOnce() {
    const [animate] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        const flag = (window as WindowWithFlag).__loginHeroAnimated;
        if (!flag) {
            (window as WindowWithFlag).__loginHeroAnimated = true;
            return true;
        }
        return false;
    });

    return animate;
}
