import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMediaPlayback } from '@/shared/contexts/media-playback-context';

type Props = {
    src: string;
    className?: string;
    autoPlay?: boolean;
    muted?: boolean;
    controls?: boolean;
    aspectRatio?: string;
};

export function VideoPlayer({ src, className, autoPlay = false, muted = false, aspectRatio = '16/9' }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const instanceIdRef = useRef<string>(`video-${Math.random().toString(36).substring(2, 11)}`);

    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(muted);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const mediaPlayback = useMediaPlayback();

    const resetHideControlsTimer = useCallback(() => {
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current);
        }

        setShowControls(true);

        if (isPlaying) {
            hideControlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => {
            if (video.duration && isFinite(video.duration)) {
                setDuration(video.duration);
            }
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('durationchange', updateDuration);
        video.addEventListener('loadeddata', updateDuration);
        video.addEventListener('canplay', updateDuration);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);

        if (video.readyState >= 1) {
            updateDuration();
        }

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('durationchange', updateDuration);
            video.removeEventListener('loadeddata', updateDuration);
            video.removeEventListener('canplay', updateDuration);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const instanceId = instanceIdRef.current;
        mediaPlayback.register(instanceId, video, 'video');

        const handlePlay = () => {
            mediaPlayback.notifyPlay(instanceId);
        };

        video.addEventListener('play', handlePlay);

        return () => {
            video.removeEventListener('play', handlePlay);
            mediaPlayback.unregister(instanceId);
        };
    }, [mediaPlayback]);

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        resetHideControlsTimer();
    };

    const handleProgressChange = (value: number[]) => {
        const video = videoRef.current;
        if (!video || value[0] === undefined) return;

        video.currentTime = value[0];
        setCurrentTime(value[0]);
        resetHideControlsTimer();
    };

    const handleVolumeChange = (value: number[]) => {
        const video = videoRef.current;
        if (!video || value[0] === undefined) return;

        const newVolume = value[0];
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        resetHideControlsTimer();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isMuted) {
            video.volume = volume || 1;
            setIsMuted(false);
        } else {
            video.volume = 0;
            setIsMuted(true);
        }
        resetHideControlsTimer();
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            await containerRef.current.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
        resetHideControlsTimer();
    };

    const handleContainerClick = () => {
        togglePlayPause();
    };

    const handleMouseMove = () => {
        resetHideControlsTimer();
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            ref={containerRef}
            className={cn('relative w-full overflow-hidden rounded-lg bg-black', className)}
            style={{ aspectRatio }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <div onClick={handleContainerClick} className="absolute inset-0 cursor-pointer">
                <video ref={videoRef} src={src} autoPlay={autoPlay} muted={isMuted} preload="metadata" className="h-full w-full object-contain" />
            </div>

            <div
                className={cn(
                    'absolute inset-x-0 bottom-0 flex flex-col gap-2 rounded-b-lg bg-black/60 p-4 transition-opacity duration-300',
                    showControls ? 'opacity-100' : 'opacity-0'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={togglePlayPause}
                        className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                    </Button>

                    <div className="flex flex-1 items-center gap-2">
                        <Slider
                            value={[currentTime]}
                            max={duration > 0 ? duration : 1}
                            step={0.1}
                            onValueChange={handleProgressChange}
                            className="flex-1 cursor-pointer"
                            aria-label="Video progress"
                            disabled={duration === 0}
                        />

                        <div className="flex items-center gap-2 text-xs text-white">
                            <span>{formatTime(currentTime)}</span>
                            <span>/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={toggleMute}
                            className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white"
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
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

                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={toggleFullscreen}
                            className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white"
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            {isFullscreen ? <Minimize className="h-4 w-4" aria-hidden="true" /> : <Maximize className="h-4 w-4" aria-hidden="true" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
