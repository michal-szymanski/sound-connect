import { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import Hover from 'wavesurfer.js/plugins/hover';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMediaPlayback } from '@/shared/contexts/media-playback-context';
import { isServer, isTouchDevice } from '@/utils/env-utils';
import { AudioPlayButton } from '@/shared/components/audio-play-button';

export type AudioPlayerHandle = {
    togglePlayPause: () => void;
    play: () => void;
    pause: () => void;
};

type Props = {
    src: string;
    className?: string;
    context?: string;
    title?: string | null;
    trackNumber?: number;
    totalTracks?: number;
    showPlayButton?: boolean;
    onPlayStateChange?: (isPlaying: boolean) => void;
};

type ChannelData = Array<Float32Array | number[]>;

export const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(function AudioPlayer(
    { src, className, context = 'default', title, trackNumber, totalTracks, showPlayButton = true, onPlayStateChange },
    ref
) {
    const waveformRef = useRef<HTMLDivElement>(null);
    const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
    const barDataRef = useRef<Array<{ x: number; y: number; height: number }>>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 64 });
    const [duration, setDuration] = useState(0);
    const volumeOpenTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const volumeCloseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const volumeContainerRef = useRef<HTMLDivElement>(null);
    const isHoveringVolumeRef = useRef(false);
    const isClosingRef = useRef(false);
    const popoverContentRef = useRef<HTMLDivElement>(null);
    const { volume, isMuted, setVolume, setMuted, register, unregister, notifyPlay, activeVolumePopoverId, setActiveVolumePopover } = useMediaPlayback();

    const instanceId = useMemo(() => `audio-${context}-${src}`, [context, src]);
    const isVolumeOpen = activeVolumePopoverId === instanceId;

    const touchDevice = isTouchDevice();

    const plugins = useMemo(() => {
        if (isServer()) return [];

        return [
            Hover.create({
                lineColor: 'oklch(0.72 0.14 200 / 0.35)',
                lineWidth: 2,
                labelBackground: 'oklch(0.72 0.14 200)',
                labelColor: 'oklch(0.965 0.005 240)',
                labelSize: '11px'
            })
        ];
    }, []);

    const renderFunction = useCallback((channelData: ChannelData, ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        const barWidth = 3;
        const barGap = 1;
        const barRadius = 2;

        const dpr = window.devicePixelRatio || 1;
        const displayWidth = width / dpr;
        const displayHeight = height / dpr;

        const barCount = Math.floor(displayWidth / (barWidth + barGap));
        const peaksData = channelData[0];
        if (!peaksData) return;
        const step = peaksData.length / barCount;

        let maxPeak = 0;
        for (let i = 0; i < peaksData.length; i++) {
            maxPeak = Math.max(maxPeak, Math.abs(peaksData[i] ?? 0));
        }
        const normalizer = maxPeak > 0 ? 1 / maxPeak : 1;

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.scale(dpr, dpr);

        for (let i = 0; i < barCount; i++) {
            const startIndex = Math.floor(i * step);
            const endIndex = Math.floor((i + 1) * step);

            let barMax = 0;
            for (let j = startIndex; j < endIndex; j++) {
                barMax = Math.max(barMax, Math.abs(peaksData[j] ?? 0));
            }

            const normalized = barMax * normalizer;
            const barHeight = Math.max(barRadius * 2, normalized * displayHeight);
            const x = i * (barWidth + barGap);
            const y = (displayHeight - barHeight) / 2;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
        }

        ctx.restore();

        const hoverCanvas = hoverCanvasRef.current;
        if (hoverCanvas) {
            hoverCanvas.width = width;
            hoverCanvas.height = height;
            hoverCanvas.style.width = `${displayWidth}px`;
            hoverCanvas.style.height = `${displayHeight}px`;
        }
    }, []);

    const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
        container: waveformRef,
        url: src,
        waveColor: 'oklch(0.55 0.02 240)',
        progressColor: 'oklch(0.72 0.14 200)',
        height: 64,
        normalize: true,
        hideScrollbar: true,
        cursorWidth: 0,
        barHeight: 1,
        plugins,
        renderFunction
    });

    useImperativeHandle(
        ref,
        () => ({
            togglePlayPause: () => wavesurfer?.playPause(),
            play: () => wavesurfer?.play(),
            pause: () => wavesurfer?.pause()
        }),
        [wavesurfer]
    );

    const drawHoverWaveform = useCallback(
        (hoverX: number) => {
            const canvas = hoverCanvasRef.current;
            const bars = barDataRef.current;

            if (!canvas || bars.length === 0 || !wavesurfer) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const { displayWidth, displayHeight } = canvasSize;
            const dpr = window.devicePixelRatio || 1;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (hoverX <= 0) return;

            const duration = wavesurfer.getDuration();
            const currentTime = wavesurfer.getCurrentTime();
            const progressX = duration > 0 ? (currentTime / duration) * displayWidth : 0;

            const barWidth = 3;
            const barRadius = 2;

            ctx.save();
            ctx.scale(dpr, dpr);

            const isHoverAfterProgress = hoverX > progressX;

            if (isHoverAfterProgress) {
                ctx.beginPath();
                ctx.rect(progressX, 0, hoverX - progressX, displayHeight);
                ctx.clip();
            } else {
                ctx.beginPath();
                ctx.rect(hoverX, 0, progressX - hoverX, displayHeight);
                ctx.clip();
            }

            ctx.fillStyle = 'oklch(0.80 0.12 200)';

            for (const bar of bars) {
                ctx.beginPath();
                ctx.roundRect(bar.x, bar.y, barWidth, bar.height, barRadius);
                ctx.fill();
            }

            ctx.restore();
        },
        [canvasSize, wavesurfer]
    );

    useEffect(() => {
        if (!wavesurfer) return;

        wavesurfer.setVolume(isMuted ? 0 : volume);

        register(instanceId, wavesurfer, 'audio');
        console.log('[AudioPlayer] Registered:', instanceId);

        const onReady = () => {
            setDuration(wavesurfer.getDuration());

            const wrapper = wavesurfer.getWrapper();
            if (!wrapper) return;

            const dpr = window.devicePixelRatio || 1;
            const displayWidth = wrapper.clientWidth;
            const displayHeight = 64;

            setCanvasSize({
                width: displayWidth * dpr,
                height: displayHeight * dpr,
                displayWidth,
                displayHeight
            });

            const decodedData = wavesurfer.getDecodedData();
            if (!decodedData) return;

            const channelData = decodedData.getChannelData(0);

            const barWidth = 3;
            const barGap = 1;
            const barRadius = 2;
            const barCount = Math.floor(displayWidth / (barWidth + barGap));
            const step = channelData.length / barCount;

            let maxPeak = 0;
            for (let i = 0; i < channelData.length; i++) {
                maxPeak = Math.max(maxPeak, Math.abs(channelData[i] ?? 0));
            }
            const normalizer = maxPeak > 0 ? 1 / maxPeak : 1;

            const bars: Array<{ x: number; y: number; height: number }> = [];
            for (let i = 0; i < barCount; i++) {
                const startIndex = Math.floor(i * step);
                const endIndex = Math.floor((i + 1) * step);

                let barMax = 0;
                for (let j = startIndex; j < endIndex; j++) {
                    barMax = Math.max(barMax, Math.abs(channelData[j] ?? 0));
                }

                const normalized = barMax * normalizer;
                const barHeight = Math.max(barRadius * 2, normalized * displayHeight);
                const x = i * (barWidth + barGap);
                const y = (displayHeight - barHeight) / 2;

                bars.push({ x, y, height: barHeight });
            }
            barDataRef.current = bars;
        };

        const onSeeking = () => {
            const canvas = hoverCanvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        };

        const onPlay = () => {
            notifyPlay(instanceId);
            onPlayStateChange?.(true);
        };

        const onPause = () => {
            onPlayStateChange?.(false);
        };

        wavesurfer.on('ready', onReady);
        wavesurfer.on('seeking', onSeeking);
        wavesurfer.on('play', onPlay);
        wavesurfer.on('pause', onPause);

        return () => {
            wavesurfer.un('ready', onReady);
            wavesurfer.un('seeking', onSeeking);
            wavesurfer.un('play', onPlay);
            wavesurfer.un('pause', onPause);
            unregister(instanceId);
        };
    }, [wavesurfer, register, unregister, notifyPlay, volume, isMuted, instanceId, onPlayStateChange]);

    useEffect(() => {
        return () => {
            clearTimeout(volumeOpenTimeoutRef.current);
            clearTimeout(volumeCloseTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isVolumeOpen) return;

        const handlePointerMove = (e: PointerEvent) => {
            const trigger = volumeContainerRef.current;
            const popoverEl = popoverContentRef.current;
            if (!trigger || !popoverEl) return;

            const triggerRect = trigger.getBoundingClientRect();
            const isOverTrigger =
                e.clientX >= triggerRect.left && e.clientX <= triggerRect.right && e.clientY >= triggerRect.top && e.clientY <= triggerRect.bottom;

            let isOverPopover = false;
            if (popoverEl) {
                const popoverRect = popoverEl.getBoundingClientRect();
                isOverPopover =
                    e.clientX >= popoverRect.left && e.clientX <= popoverRect.right && e.clientY >= popoverRect.top && e.clientY <= popoverRect.bottom;
            }

            if (!isOverTrigger && !isOverPopover) {
                isHoveringVolumeRef.current = false;
                isClosingRef.current = true;
                clearTimeout(volumeOpenTimeoutRef.current);
                clearTimeout(volumeCloseTimeoutRef.current);
                volumeCloseTimeoutRef.current = setTimeout(() => {
                    setActiveVolumePopover((current) => (current === instanceId ? null : current));
                    setTimeout(() => {
                        isClosingRef.current = false;
                    }, 300);
                }, 100);
            } else {
                isHoveringVolumeRef.current = true;
                isClosingRef.current = false;
                clearTimeout(volumeCloseTimeoutRef.current);
            }
        };

        document.addEventListener('pointermove', handlePointerMove);
        return () => document.removeEventListener('pointermove', handlePointerMove);
    }, [isVolumeOpen, instanceId, setActiveVolumePopover]);

    const handleVolumeMouseEnter = () => {
        if (touchDevice) return;
        isHoveringVolumeRef.current = true;
        isClosingRef.current = false;
        clearTimeout(volumeCloseTimeoutRef.current);
        volumeOpenTimeoutRef.current = setTimeout(() => {
            setActiveVolumePopover(instanceId);
        }, 150);
    };

    const handleVolumeMouseLeave = () => {
        if (touchDevice) return;
        isHoveringVolumeRef.current = false;
        clearTimeout(volumeOpenTimeoutRef.current);
        isClosingRef.current = true;
        volumeCloseTimeoutRef.current = setTimeout(() => {
            if (!isHoveringVolumeRef.current) {
                setActiveVolumePopover((current) => (current === instanceId ? null : current));
            }
            setTimeout(() => {
                isClosingRef.current = false;
            }, 300);
        }, 100);
    };

    const handleVolumeFocus = () => {
        if (touchDevice) return;
        if (isClosingRef.current) return;
        setActiveVolumePopover(instanceId);
    };

    const handleVolumeBlur = (e: React.FocusEvent) => {
        if (touchDevice) return;
        const container = volumeContainerRef.current;
        if (container && e.relatedTarget && container.contains(e.relatedTarget as Node)) {
            return;
        }
        volumeCloseTimeoutRef.current = setTimeout(() => {
            setActiveVolumePopover((current) => (current === instanceId ? null : current));
        }, 100);
    };

    const toggleVolumePopover = () => {
        if (!touchDevice) return;
        if (isVolumeOpen) {
            setActiveVolumePopover((current) => (current === instanceId ? null : current));
        } else {
            setActiveVolumePopover(instanceId);
        }
    };

    const togglePlayPause = () => {
        if (!wavesurfer) return;
        wavesurfer.playPause();
    };

    const handleVolumeChange = (value: number[]) => {
        if (!wavesurfer || value[0] === undefined) return;

        const newVolume = value[0];
        wavesurfer.setVolume(newVolume);
        setVolume(newVolume);
    };

    const toggleMute = () => {
        if (!wavesurfer) return;

        if (isMuted) {
            wavesurfer.setVolume(volume || 1);
            setMuted(false);
        } else {
            wavesurfer.setVolume(0);
            setMuted(true);
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!waveformRef.current) return;

        const rect = waveformRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

        drawHoverWaveform(x);
    };

    const handleMouseLeave = () => {
        const canvas = hoverCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const handleWaveformKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            togglePlayPause();
        }
    };

    const displayTitle = title || (totalTracks && totalTracks > 1 ? `Track ${trackNumber}` : null);
    const hidePlayButton = totalTracks !== undefined && totalTracks > 1;

    return (
        <div className={cn('border-border/40 bg-muted/30 flex w-full flex-col gap-3 rounded-lg border p-4', className)}>
            {displayTitle && (
                <div className="text-sm font-semibold">
                    {displayTitle}
                </div>
            )}
            <div className="flex items-center gap-3">
                {showPlayButton && !hidePlayButton && (
                    <AudioPlayButton
                        isPlaying={isPlaying}
                        onClick={togglePlayPause}
                        size="md"
                        variant="default"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    />
                )}

                <div className="flex flex-1 flex-col gap-2">
                    <div className="relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                        <div
                            ref={waveformRef}
                            className="cursor-pointer"
                            aria-label={`Audio waveform, click to seek. Press Space or Enter to ${isPlaying ? 'pause' : 'play'}`}
                            role="slider"
                            tabIndex={0}
                            onKeyDown={handleWaveformKeyDown}
                        />
                        {canvasSize.width > 0 && (
                            <canvas
                                ref={hoverCanvasRef}
                                width={canvasSize.width}
                                height={canvasSize.height}
                                style={{
                                    width: `${canvasSize.displayWidth}px`,
                                    height: `${canvasSize.displayHeight}px`
                                }}
                                className="pointer-events-none absolute inset-0 z-50"
                            />
                        )}
                    </div>

                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div ref={volumeContainerRef} onMouseEnter={handleVolumeMouseEnter} onMouseLeave={handleVolumeMouseLeave}>
                    <Popover
                        open={isVolumeOpen}
                        onOpenChange={(open) => {
                            if (open && isClosingRef.current) return;
                            if (open) {
                                setActiveVolumePopover(instanceId);
                            } else {
                                setActiveVolumePopover((current) => (current === instanceId ? null : current));
                            }
                        }}
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8 shrink-0"
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
                            ref={popoverContentRef}
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
                                <Button variant="ghost" size="icon-sm" onClick={toggleMute} className="h-6 w-6" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                                    {isMuted ? <VolumeX className="h-3 w-3" aria-hidden="true" /> : <Volume2 className="h-3 w-3" aria-hidden="true" />}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
});
