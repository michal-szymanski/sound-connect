import { Badge } from '@/shared/components/ui/badge';
import { AudioPlayer } from '@/features/posts/components/audio-player';
import { VideoPlayer } from '@/features/posts/components/video-player';
import { formatInstrument } from '../lib/profile-utils';
import type { MusicSample } from '@sound-connect/common/types/music-samples';

type Props = {
    sample: MusicSample;
    compact?: boolean;
    hideTitle?: boolean;
};

export const MusicSamplePlayer = ({ sample, compact = false, hideTitle = false }: Props) => {
    const mediaUrl = `/media/${sample.r2Key}`;
    const isAudio = sample.mediaType === 'audio';

    return (
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    {!hideTitle && <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{sample.title}</h3>}
                    {sample.description && <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{sample.description}</p>}
                </div>
                {sample.instrument && <Badge variant="secondary">{formatInstrument(sample.instrument)}</Badge>}
            </div>

            {isAudio ? <AudioPlayer src={mediaUrl} /> : <VideoPlayer src={mediaUrl} controls />}
        </div>
    );
};
