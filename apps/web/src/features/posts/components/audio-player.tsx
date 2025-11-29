import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import Hover from 'wavesurfer.js/plugins/hover';
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
    const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
    const peaksRef = useRef<number[] | null>(null);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 64 });

    const plugins = useMemo(
        () => [
            Hover.create({
                lineColor: 'oklch(0.72 0.14 200 / 0.35)',
                lineWidth: 2,
                labelBackground: 'oklch(0.72 0.14 200)',
                labelColor: 'oklch(0.965 0.005 240)',
                labelSize: '11px'
            })
        ],
        []
    );

    const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
        container: waveformRef,
        url: src,
        progressColor: 'oklch(0.72 0.14 200)',
        barWidth: 3,
        barGap: 1,
        barRadius: 2,
        height: 64,
        normalize: true,
        hideScrollbar: true,
        cursorWidth: 0,
        barHeight: 1,
        plugins
    });

    const drawHoverWaveform = useCallback(
        (hoverX: number) => {
            const canvas = hoverCanvasRef.current;
            const peaks = peaksRef.current;
            if (!canvas || !peaks || peaks.length === 0 || canvasSize.displayWidth === 0) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (hoverX <= 0) return;

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.beginPath();
            ctx.rect(0, 0, hoverX, canvasSize.displayHeight);
            ctx.clip();

            ctx.fillStyle = 'oklch(0.80 0.12 200)';

            const barWidth = 3;
            const barGap = 1;
            const barRadius = 2;
            const totalBarWidth = barWidth + barGap;
            const numBars = Math.round(canvasSize.displayWidth / totalBarWidth);
            const samplesPerBar = peaks.length / numBars;

            for (let i = 0; i < numBars; i++) {
                const startSample = Math.floor(i * samplesPerBar);
                const endSample = Math.floor((i + 1) * samplesPerBar);

                let maxPeak = 0;
                for (let j = startSample; j < endSample; j++) {
                    maxPeak = Math.max(maxPeak, Math.abs(peaks[j] ?? 0));
                }

                const barHeight = Math.max(barRadius * 2, maxPeak * canvasSize.displayHeight);
                const x = i * totalBarWidth + barGap / 2;
                const y = (canvasSize.displayHeight - barHeight) / 2;

                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, barRadius);
                ctx.fill();
            }

            ctx.restore();
        },
        [canvasSize.displayWidth, canvasSize.displayHeight]
    );

    useEffect(() => {
        if (!wavesurfer) return;

        const onReady = () => {
            setDuration(wavesurfer.getDuration());

            const exportedPeaks = wavesurfer.exportPeaks();
            if (exportedPeaks && exportedPeaks[0]) {
                peaksRef.current = Array.from(exportedPeaks[0]);
            }

            const wrapper = wavesurfer.getWrapper();
            if (wrapper) {
                const dpr = window.devicePixelRatio || 1;
                const displayWidth = wrapper.clientWidth;
                const displayHeight = 64;
                setCanvasSize({
                    width: displayWidth * dpr,
                    height: displayHeight * dpr,
                    displayWidth,
                    displayHeight
                });
            }
        };

        wavesurfer.on('ready', onReady);

        return () => {
            wavesurfer.un('ready', onReady);
        };
    }, [wavesurfer]);

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
                    <div
                        className="relative"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
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
