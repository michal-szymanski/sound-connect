import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import Hover from 'wavesurfer.js/plugins/hover';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMediaPlayback } from '@/shared/contexts/media-playback-context';
import { isServer } from '@/web/utils/env-utils';

type Props = {
    src: string;
    className?: string;
};

type ChannelData = Array<Float32Array | number[]>;

export function AudioPlayer({ src, className }: Props) {
    const waveformRef = useRef<HTMLDivElement>(null);
    const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
    const instanceIdRef = useRef<string>(`audio-${src}`);
    const barDataRef = useRef<Array<{ x: number; y: number; height: number }>>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 64 });
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const mediaPlayback = useMediaPlayback();

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

        const instanceId = instanceIdRef.current;
        mediaPlayback.register(instanceId, wavesurfer, 'audio');

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
            mediaPlayback.notifyPlay(instanceId);
        };

        wavesurfer.on('ready', onReady);
        wavesurfer.on('seeking', onSeeking);
        wavesurfer.on('play', onPlay);

        return () => {
            wavesurfer.un('ready', onReady);
            wavesurfer.un('seeking', onSeeking);
            wavesurfer.un('play', onPlay);
            mediaPlayback.unregister(instanceId);
        };
    }, [wavesurfer, mediaPlayback]);

    const togglePlayPause = () => {
        if (!wavesurfer) return;
        wavesurfer.playPause();
    };

    const handleVolumeChange = (value: number[]) => {
        if (!wavesurfer || value[0] === undefined) return;

        const newVolume = value[0];
        wavesurfer.setVolume(newVolume);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
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

    return (
        <div className={cn('border-border/40 bg-muted/30 flex w-full flex-col gap-3 rounded-lg border p-4', className)}>
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayPause}
                    className={cn(
                        'h-10 w-10 shrink-0 rounded-full border bg-background transition-none hover:border-primary hover:bg-primary/20',
                        isPlaying ? 'border-primary' : 'border-border'
                    )}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <Pause className="text-primary h-5 w-5" aria-hidden="true" /> : <Play className="text-primary h-5 w-5" aria-hidden="true" />}
                </Button>

                <div className="flex flex-1 flex-col gap-2">
                    <div className="relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                        <div ref={waveformRef} className="cursor-pointer" aria-label="Audio waveform, click to seek" role="slider" tabIndex={0} />
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
