import { useState } from 'react';
import { isServer } from '@/web/utils/env-utils';

type WindowWithFlag = Window & { __loginHeroAnimated?: boolean };

export function useAnimateOnce() {
    const [animate] = useState(() => {
        if (isServer()) {
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
