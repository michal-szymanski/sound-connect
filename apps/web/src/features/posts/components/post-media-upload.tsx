import { useEffect, useRef, useState } from 'react';
import { appConfig } from '@sound-connect/common/app-config';
import { useBatchPresignedUpload } from '@/web/hooks/use-batch-presigned-upload';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { VideoPlayer } from './video-player';

export type MediaWithType = {
    key: string;
    type: 'image' | 'video' | 'audio';
};

type Props = {
    onMediaKeysChange?: (keysWithTypes: MediaWithType[]) => void;
    maxFiles?: number;
    className?: string;
    existingMedia?: Array<{ id: string; key: string; type: 'image' | 'video' | 'audio' }>;
    onExistingMediaRemove?: (key: string) => void;
    onUploadStateChange?: (state: 'idle' | 'uploading' | 'success' | 'error') => void;
    disabled?: boolean;
};

type MediaPreview = {
    id: string;
    file?: File;
    previewUrl: string;
    type: 'image' | 'video' | 'audio';
    key?: string;
    isExisting?: boolean;
};

export const PostMediaUpload = (props: Props) => {
    const { onMediaKeysChange, maxFiles = appConfig.maxPostMediaCount, className, existingMedia, onExistingMediaRemove, onUploadStateChange, disabled } = props;

    const [previews, setPreviews] = useState<MediaPreview[]>([]);
    const [newMediaKeysWithTypes, setNewMediaKeysWithTypes] = useState<MediaWithType[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingUploadTypesRef = useRef<Array<'image' | 'video' | 'audio'>>([]);

    const { upload, progress, overallProgress, state, error } = useBatchPresignedUpload({
        purpose: 'post-media',
        maxFiles,
        onSuccess: (results: Array<{ publicUrl: string; key: string }>) => {
            const keys = results.map((r, index) => {
                const type = pendingUploadTypesRef.current[index];
                return {
                    key: r.key,
                    type: type || 'image'
                };
            });
            setNewMediaKeysWithTypes((prev) => {
                const accumulated = [...prev, ...keys];
                onMediaKeysChange?.(accumulated);
                return accumulated;
            });
            setPreviews((prev) => {
                return prev.map((p, index) => {
                    if (!p.isExisting && !p.key) {
                        const matchingKeyIndex = prev.filter((preview) => !preview.isExisting && !preview.key).indexOf(p);
                        if (matchingKeyIndex !== -1 && results[matchingKeyIndex]) {
                            return { ...p, key: results[matchingKeyIndex].key };
                        }
                    }
                    return p;
                });
            });
            pendingUploadTypesRef.current = [];
        }
    });

    useEffect(() => {
        if (existingMedia && existingMedia.length > 0) {
            const existingPreviews: MediaPreview[] = existingMedia.map((m) => ({
                id: m.id,
                previewUrl: `/media/${m.key}`,
                type: m.type,
                key: m.key,
                isExisting: true
            }));
            setPreviews(existingPreviews);
        }
    }, [existingMedia]);

    useEffect(() => {
        if (state === 'uploading' || state === 'requesting' || state === 'confirming') {
            onUploadStateChange?.('uploading');
        } else if (state === 'success') {
            onUploadStateChange?.('success');
        } else if (state === 'error') {
            onUploadStateChange?.('error');
        } else {
            onUploadStateChange?.('idle');
        }
    }, [state, onUploadStateChange]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        if (previews.length + files.length > maxFiles) {
            return;
        }

        const newPreviews: MediaPreview[] = [];
        const fileTypes: Array<'image' | 'video' | 'audio'> = [];

        for (const file of files) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const isAudio = file.type.startsWith('audio/');

            if (!isImage && !isVideo && !isAudio) continue;

            const type: 'image' | 'video' | 'audio' = isImage ? 'image' : isVideo ? 'video' : 'audio';
            const previewUrl = URL.createObjectURL(file);

            newPreviews.push({
                id: crypto.randomUUID(),
                file,
                previewUrl,
                type,
                isExisting: false
            });

            fileTypes.push(type);
        }

        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);

        pendingUploadTypesRef.current = fileTypes;
        await upload(files);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = (id: string) => {
        const preview = previews.find((p) => p.id === id);
        if (!preview) return;

        if (preview.isExisting && preview.key) {
            onExistingMediaRemove?.(preview.key);
        } else if (preview.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(preview.previewUrl);
        }

        const updatedPreviews = previews.filter((p) => p.id !== id);
        setPreviews(updatedPreviews);

        if (!preview.isExisting && preview.key) {
            const updatedKeys = newMediaKeysWithTypes.filter((k) => k.key !== preview.key);
            setNewMediaKeysWithTypes(updatedKeys);
            onMediaKeysChange?.(updatedKeys);
        } else if (updatedPreviews.filter((p) => !p.isExisting).length === 0) {
            setNewMediaKeysWithTypes([]);
            onMediaKeysChange?.([]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const isUploading = state === 'uploading' || state === 'requesting' || state === 'confirming';
    const hasError = state === 'error';
    const isSuccess = state === 'success';
    const canAddMore = previews.length < maxFiles && !isUploading && !disabled;

    return (
        <div className={cn('space-y-4', className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/webm"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading || previews.length >= maxFiles || disabled}
                multiple
            />

            {previews.length > 0 && (
                <div className="rounded-lg border border-border/40 bg-muted/30">
                    <ScrollArea className="max-h-[200px] md:max-h-[280px]">
                        <div className="grid grid-cols-3 gap-2 p-2 md:grid-cols-4">
                            {previews.map((preview, index) => (
                                <div key={preview.id} className="group relative">
                                    <div className="border-input bg-muted relative aspect-square overflow-hidden rounded-lg border">
                                        {preview.type === 'image' ? (
                                            <img src={preview.previewUrl} alt={`Media ${index + 1}`} className="w-full object-cover" />
                                        ) : preview.type === 'video' ? (
                                            <VideoPlayer src={preview.previewUrl} controls={false} muted aspectRatio="1/1" className="w-full" />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/20 to-primary/5 p-3">
                                                <div className="bg-primary/10 rounded-full p-3">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="text-primary h-8 w-8"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                                                        />
                                                    </svg>
                                                </div>
                                                <span className="text-muted-foreground truncate w-full text-center text-xs font-medium">
                                                    {preview.file?.name || 'Audio file'}
                                                </span>
                                            </div>
                                        )}

                                        {isUploading && progress[index] !== undefined && (
                                            <div className="bg-background/90 absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-sm">
                                                <Progress value={progress[index]} className="h-2 w-full" />
                                                <span className="text-xs font-semibold tabular-nums">{progress[index]}%</span>
                                            </div>
                                        )}

                                        {!isUploading && !disabled && (
                                            <button
                                                onClick={() => handleRemove(preview.id)}
                                                className="bg-destructive absolute top-2 right-2 rounded-full p-1.5 text-white shadow-lg transition-opacity md:opacity-0 md:group-hover:opacity-100"
                                                type="button"
                                                aria-label={`Remove ${preview.type}`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className="h-4 w-4"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}

                                        {preview.type === 'video' && (
                                            <Badge variant="secondary" className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm">
                                                Video
                                            </Badge>
                                        )}
                                        {preview.type === 'audio' && (
                                            <Badge variant="secondary" className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm">
                                                Audio
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="border-t border-border/40 px-3 py-2 text-xs text-muted-foreground">
                        {previews.length} of {maxFiles} files
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {state === 'requesting' && 'Preparing uploads...'}
                            {state === 'uploading' && `Uploading... ${overallProgress}%`}
                            {state === 'confirming' && 'Processing...'}
                        </span>
                    </div>
                </div>
            )}

            {isSuccess && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <AlertDescription className="text-green-700 dark:text-green-300">All files uploaded successfully!</AlertDescription>
                </Alert>
            )}

            {hasError && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {canAddMore && (
                <Button onClick={handleClick} variant="outline" className="w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Media ({previews.length}/{maxFiles})
                </Button>
            )}
        </div>
    );
};
