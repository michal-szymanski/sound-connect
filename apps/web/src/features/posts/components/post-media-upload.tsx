import { useRef, useState } from 'react';
import { appConfig } from '@sound-connect/common/app-config';
import { useBatchPresignedUpload } from '@/web/hooks/use-batch-presigned-upload';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { cn } from '@/shared/lib/utils';

type Props = {
    onMediaKeysChange?: (keys: string[]) => void;
    maxFiles?: number;
    className?: string;
};

type MediaPreview = {
    id: string;
    file: File;
    previewUrl: string;
    type: 'image' | 'video' | 'audio';
};

export const PostMediaUpload = (props: Props) => {
    const { onMediaKeysChange, maxFiles = appConfig.maxPostMediaCount, className } = props;

    const [previews, setPreviews] = useState<MediaPreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload, progress, overallProgress, state, error } = useBatchPresignedUpload({
        purpose: 'post-media',
        maxFiles,
        onSuccess: (results: Array<{ publicUrl: string; key: string }>) => {
            const keys = results.map((r) => r.key);
            onMediaKeysChange?.(keys);
        }
    });

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        if (previews.length + files.length > maxFiles) {
            return;
        }

        const newPreviews: MediaPreview[] = [];

        for (const file of files) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const isAudio = file.type.startsWith('audio/');

            if (!isImage && !isVideo && !isAudio) continue;

            const previewUrl = URL.createObjectURL(file);
            newPreviews.push({
                id: Math.random().toString(36).substring(7),
                file,
                previewUrl,
                type: isImage ? 'image' : isVideo ? 'video' : 'audio'
            });
        }

        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);

        await upload(updatedPreviews.map((p) => p.file));
    };

    const handleRemove = (id: string) => {
        const preview = previews.find((p) => p.id === id);
        if (preview) {
            URL.revokeObjectURL(preview.previewUrl);
        }

        const updatedPreviews = previews.filter((p) => p.id !== id);
        setPreviews(updatedPreviews);

        if (updatedPreviews.length === 0) {
            onMediaKeysChange?.([]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const isUploading = state === 'uploading' || state === 'requesting' || state === 'confirming';
    const hasError = state === 'error';
    const isSuccess = state === 'success';
    const canAddMore = previews.length < maxFiles && !isUploading;

    return (
        <div className={cn('space-y-4', className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/webm"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading || previews.length >= maxFiles}
                multiple
            />

            {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {previews.map((preview, index) => (
                        <div key={preview.id} className="group relative">
                            <div className="border-input bg-muted relative aspect-square overflow-hidden rounded-lg border">
                                {preview.type === 'image' ? (
                                    <img src={preview.previewUrl} alt={`Media ${index + 1}`} className="h-full w-full object-cover" />
                                ) : preview.type === 'video' ? (
                                    <video src={preview.previewUrl} className="h-full w-full object-cover" controls={false} />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="text-muted-foreground h-12 w-12"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                                            />
                                        </svg>
                                        <span className="text-muted-foreground text-sm font-medium">Audio</span>
                                    </div>
                                )}

                                {isUploading && progress[index] !== undefined && (
                                    <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
                                        <Progress value={progress[index]} className="h-2 w-full" />
                                        <span className="text-sm font-medium">{progress[index]}%</span>
                                    </div>
                                )}

                                {!isUploading && (
                                    <button
                                        onClick={() => handleRemove(preview.id)}
                                        className="bg-destructive absolute top-2 right-2 rounded-full p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                        type="button"
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
                            </div>

                            {preview.type === 'video' && <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">Video</div>}
                            {preview.type === 'audio' && <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">Audio</div>}
                        </div>
                    ))}
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
