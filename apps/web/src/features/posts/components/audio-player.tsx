import { useRef, useState, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Props = {
    src: string;
    className?: string;
};

export function AudioPlayer({ src, className }: Props) {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!waveformRef.current) return;

        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            url: src,
            progressColor: 'oklch(0.72 0.14 200)',
            barWidth: 3,
            barGap: 1,
            barRadius: 2,
            height: 64,
            normalize: true,
            hideScrollbar: true,
            cursorWidth: 0,
            barHeight: 1
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
        });

        wavesurfer.on('audioprocess', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('seeking', (currentTime) => {
            setCurrentTime(currentTime);
        });

        wavesurfer.on('finish', () => {
            setIsPlaying(false);
        });

        return () => {
            wavesurfer.destroy();
        };
    }, [src]);

    const togglePlayPause = () => {
        const wavesurfer = wavesurferRef.current;
        if (!wavesurfer) return;

        if (isPlaying) {
            wavesurfer.pause();
        } else {
            wavesurfer.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChange = (value: number[]) => {
        const wavesurfer = wavesurferRef.current;
        if (!wavesurfer || value[0] === undefined) return;

        const newVolume = value[0];
        wavesurfer.setVolume(newVolume);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        const wavesurfer = wavesurferRef.current;
        if (!wavesurfer) return;

        if (isMuted) {
            wavesurfer.setVolume(volume || 1);
            setIsMuted(false);
        } else {
            wavesurfer.setVolume(0);
            setIsMuted(true);
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={cn('border-border/40 bg-card flex w-full flex-col gap-3 rounded-lg border p-4', className)}>
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlayPause}
                    className="h-10 w-10 shrink-0 rounded-full"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
                </Button>

                <div className="flex flex-1 flex-col gap-2">
                    <div ref={waveformRef} className="cursor-pointer" aria-label="Audio waveform, click to seek" role="slider" tabIndex={0} />

                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon-sm" onClick={toggleMute} className="h-8 w-8 shrink-0" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
                    </Button>

                    <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-20 cursor-pointer"
                        aria-label="Volume"
                    />
                </div>
            </div>
        </div>
    );
}
