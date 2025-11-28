import ReactPlayer from 'react-player';
import { cn } from '@/shared/lib/utils';

type Props = {
    src: string;
    className?: string;
    autoPlay?: boolean;
    muted?: boolean;
    controls?: boolean;
    aspectRatio?: string;
};

export function VideoPlayer({ src, className, autoPlay = false, muted = false, controls = true, aspectRatio = '16/9' }: Props) {
    return (
        <div className={cn('bg-muted w-full overflow-hidden rounded-lg', className)} style={{ aspectRatio }}>
            <ReactPlayer src={src} controls={controls} playing={autoPlay} muted={muted} width="100%" height="100%" />
        </div>
    );
}
