import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMediaPlayback } from '@/shared/contexts/media-playback-context';
import { isServer } from '@/web/utils/env-utils';

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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const volumeOpenTimeoutRef = useRef<NodeJS.Timeout>();
    const volumeCloseTimeoutRef = useRef<NodeJS.Timeout>();
    const volumeContainerRef = useRef<HTMLDivElement>(null);

    const { volume, isMuted, setVolume, setMuted, register, unregister, notifyPlay } = useMediaPlayback();

    const isTouchDevice = !isServer() && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

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

        video.volume = isMuted ? 0 : volume;

        const instanceId = instanceIdRef.current;
        register(instanceId, video, 'video');

        const handlePlay = () => {
            notifyPlay(instanceId);
        };

        video.addEventListener('play', handlePlay);

        return () => {
            video.removeEventListener('play', handlePlay);
            unregister(instanceId);
        };
    }, [register, unregister, notifyPlay, volume, isMuted]);

    useEffect(() => {
        return () => {
            clearTimeout(volumeOpenTimeoutRef.current);
            clearTimeout(volumeCloseTimeoutRef.current);
        };
    }, []);

    const handleVolumeMouseEnter = () => {
        if (isTouchDevice) return;
        clearTimeout(volumeCloseTimeoutRef.current);
        volumeOpenTimeoutRef.current = setTimeout(() => {
            setIsVolumeOpen(true);
        }, 150);
    };

    const handleVolumeMouseLeave = () => {
        if (isTouchDevice) return;
        clearTimeout(volumeOpenTimeoutRef.current);
        volumeCloseTimeoutRef.current = setTimeout(() => {
            setIsVolumeOpen(false);
        }, 100);
    };

    const handleVolumeFocus = () => {
        if (isTouchDevice) return;
        setIsVolumeOpen(true);
    };

    const handleVolumeBlur = (e: React.FocusEvent) => {
        if (isTouchDevice) return;
        const container = volumeContainerRef.current;
        if (container && e.relatedTarget && container.contains(e.relatedTarget as Node)) {
            return;
        }
        volumeCloseTimeoutRef.current = setTimeout(() => {
            setIsVolumeOpen(false);
        }, 100);
    };

    const toggleVolumePopover = () => {
        if (!isTouchDevice) return;
        setIsVolumeOpen((prev) => !prev);
    };

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
        resetHideControlsTimer();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isMuted) {
            video.volume = volume || 1;
            setMuted(false);
        } else {
            video.volume = 0;
            setMuted(true);
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
            className={cn('relative w-full overflow-hidden bg-black', className)}
            style={{ aspectRatio }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <div onClick={handleContainerClick} className="absolute inset-0 cursor-pointer">
                <video ref={videoRef} src={src} autoPlay={autoPlay} muted={isMuted} preload="metadata" className="h-full w-full object-contain" />
            </div>

            <div
                className={cn(
                    'absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-black/60 p-4 transition-opacity duration-300',
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
                        {isFullscreen ? (
                            <>
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
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                                />
                            </>
                        ) : (
                            <div
                                ref={volumeContainerRef}
                                onMouseEnter={handleVolumeMouseEnter}
                                onMouseLeave={handleVolumeMouseLeave}
                            >
                                <Popover open={isVolumeOpen} onOpenChange={setIsVolumeOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white"
                                            aria-label={`Volume: ${Math.round(volume * 100)}%${isMuted ? ' (muted)' : ''}`}
                                            aria-expanded={isVolumeOpen}
                                            onFocus={handleVolumeFocus}
                                            onBlur={handleVolumeBlur}
                                            onClick={toggleVolumePopover}
                                        >
                                            {isMuted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="top"
                                        align="center"
                                        className="w-12 p-2"
                                        sideOffset={8}
                                        onMouseEnter={handleVolumeMouseEnter}
                                        onMouseLeave={handleVolumeMouseLeave}
                                        onOpenAutoFocus={(e) => e.preventDefault()}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-muted-foreground text-xs">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                                            <Slider
                                                orientation="vertical"
                                                value={[isMuted ? 0 : volume]}
                                                max={1}
                                                step={0.01}
                                                onValueChange={handleVolumeChange}
                                                className="h-24"
                                                aria-label="Volume"
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={toggleMute}
                                                className="h-6 w-6"
                                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                            >
                                                {isMuted ? <VolumeX className="h-3 w-3" aria-hidden="true" /> : <Volume2 className="h-3 w-3" aria-hidden="true" />}
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

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
