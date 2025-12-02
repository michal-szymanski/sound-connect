import { cn } from '@/shared/lib/utils';

type Props = {
    count: number;
    current: number;
};

export function CarouselDots({ count, current }: Props) {
    if (count <= 1) return null;

    return (
        <div
            className="absolute bottom-4 left-1/2 z-[101] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-2 backdrop-blur-sm"
            role="group"
            aria-hidden="true"
        >
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} className={cn('h-1.5 w-1.5 rounded-full transition-colors duration-200', i === current ? 'bg-white' : 'bg-white/40')} />
            ))}
        </div>
    );
}
