import { useRef, useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Props = {
    src: string;
    className?: string;
};

export function AudioPlayer({ src, className }: Props) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleProgressChange = (value: number[]) => {
        const audio = audioRef.current;
        if (!audio || !value[0]) return;

        audio.currentTime = value[0];
        setCurrentTime(value[0]);
    };

    const handleVolumeChange = (value: number[]) => {
        const audio = audioRef.current;
        if (!audio || value[0] === undefined) return;

        const newVolume = value[0];
        audio.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMuted) {
            audio.volume = volume || 1;
            setIsMuted(false);
        } else {
            audio.volume = 0;
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
            <audio ref={audioRef} src={src} preload="metadata" />

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
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleProgressChange}
                        className="cursor-pointer"
                        aria-label="Audio progress"
                    />

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
