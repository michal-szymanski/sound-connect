import { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'motion/react';

import { cn } from '@/web/shared/lib/utils';

interface WordRotateProps {
    words: string[];
    duration?: number;
    motionProps?: MotionProps;
    className?: string;
    loop?: boolean;
}

export function WordRotate({
    words,
    duration = 2500,
    motionProps = {
        initial: { opacity: 0, y: -50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
        transition: { duration: 0.25, ease: 'easeOut' }
    },
    className,
    loop = true
}: WordRotateProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (!loop && nextIndex >= words.length) {
                    return words.length - 1;
                }
                return nextIndex % words.length;
            });
        }, duration);

        return () => clearInterval(interval);
    }, [words, duration, loop]);

    return (
        <div className="overflow-hidden py-2">
            <AnimatePresence mode="wait">
                <motion.h1 key={words[index]} className={cn(className)} {...motionProps}>
                    {words[index]}
                </motion.h1>
            </AnimatePresence>
        </div>
    );
}
