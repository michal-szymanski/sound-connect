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
        <div className={cn('w-full overflow-hidden rounded-lg', className)} style={{ aspectRatio }}>
            <ReactPlayer
                {...{
                    url: src,
                    width: '100%',
                    height: '100%',
                    controls,
                    playing: autoPlay,
                    muted,
                    style: {
                        backgroundColor: 'hsl(var(--muted))'
                    }
                }}
            />
        </div>
    );
}
