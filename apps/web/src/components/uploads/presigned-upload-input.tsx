import { useRef, useState } from 'react';
import type { UploadPurpose } from '@sound-connect/common/types/uploads';
import { appConfig } from '@sound-connect/common/app-config';
import { usePresignedUpload } from '@/web/hooks/use-presigned-upload';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { cn } from '@/shared/lib/utils';

type Props = {
    purpose: UploadPurpose;
    bandId?: number;
    accept?: string;
    maxSize?: number;
    onUploadComplete?: (result: { publicUrl: string; key: string }) => void;
    currentImageUrl?: string;
    className?: string;
};

type ValidationError = {
    type: 'size' | 'type';
    message: string;
};

const validateFile = (file: File, purpose: UploadPurpose, maxSize?: number): ValidationError | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (purpose === 'post-media') {
        if (!isImage && !isVideo) {
            return {
                type: 'type',
                message: 'Invalid file type. Use JPG, PNG, WebP, or MP4, WebM, MOV videos'
            };
        }

        if (isImage && !appConfig.allowedImageTypes.includes(file.type as (typeof appConfig.allowedImageTypes)[number])) {
            return {
                type: 'type',
                message: 'Invalid image type. Use JPG, PNG, or WebP'
            };
        }

        if (isVideo && !appConfig.allowedVideoTypes.includes(file.type as (typeof appConfig.allowedVideoTypes)[number])) {
            return {
                type: 'type',
                message: 'Invalid video type. Use MP4, WebM, or MOV'
            };
        }

        const maxFileSize = maxSize || (isVideo ? appConfig.maxVideoSize : appConfig.maxImageSize);
        if (file.size > maxFileSize) {
            const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
            return {
                type: 'size',
                message: `File too large (${Math.round(file.size / (1024 * 1024))}MB). Max size: ${maxSizeMB}MB`
            };
        }
    } else {
        if (!isImage) {
            return {
                type: 'type',
                message: 'Invalid file type. Use JPG, PNG, or WebP images'
            };
        }

        if (!appConfig.allowedImageTypes.includes(file.type as (typeof appConfig.allowedImageTypes)[number])) {
            return {
                type: 'type',
                message: 'Invalid image type. Use JPG, PNG, or WebP'
            };
        }

        const maxFileSize = maxSize || appConfig.maxImageSize;
        if (file.size > maxFileSize) {
            const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
            return {
                type: 'size',
                message: `File too large (${Math.round(file.size / (1024 * 1024))}MB). Max size: ${maxSizeMB}MB`
            };
        }
    }

    return null;
};

export const PresignedUploadInput = (props: Props) => {
    const { purpose, bandId, accept, maxSize, onUploadComplete, currentImageUrl, className } = props;

    const [validationError, setValidationError] = useState<ValidationError | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload, progress, state, error, cancel } = usePresignedUpload({
        purpose,
        bandId,
        onSuccess: (result: { publicUrl: string; key: string }) => {
            setPreviewUrl(result.publicUrl);
            setValidationError(null);
            onUploadComplete?.(result);
        },
        onError: () => {
            setPreviewUrl(null);
        }
    });

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validationResult = validateFile(file, purpose, maxSize);
        if (validationResult) {
            setValidationError(validationResult);
            return;
        }

        setValidationError(null);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }

        await upload(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRetry = () => {
        fileInputRef.current?.click();
    };

    const isUploading = state === 'uploading' || state === 'requesting' || state === 'confirming';
    const hasError = state === 'error' || validationError !== null;
    const isSuccess = state === 'success';

    const displayUrl = previewUrl || currentImageUrl;

    return (
        <div className={cn('space-y-4', className)}>
            <input ref={fileInputRef} type="file" accept={accept || 'image/*'} onChange={handleFileChange} className="hidden" disabled={isUploading} />

            {displayUrl && purpose !== 'post-media' && (
                <div className="border-input relative h-32 w-32 overflow-hidden rounded-lg border">
                    <img src={displayUrl} alt="Preview" className="h-full w-full object-cover" />
                    {isUploading && (
                        <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
                            <div className="text-sm font-medium">Uploading...</div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                {isUploading && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {state === 'requesting' && 'Preparing upload...'}
                                {state === 'uploading' && `Uploading... ${progress}%`}
                                {state === 'confirming' && 'Processing...'}
                            </span>
                            <Button variant="ghost" size="sm" onClick={cancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {isSuccess && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                        <AlertDescription className="text-green-700 dark:text-green-300">Upload successful!</AlertDescription>
                    </Alert>
                )}

                {hasError && (
                    <Alert variant="destructive">
                        <AlertDescription>{error || validationError?.message}</AlertDescription>
                    </Alert>
                )}

                {!isUploading && (
                    <div className="flex gap-2">
                        <Button onClick={handleClick} disabled={isUploading}>
                            {currentImageUrl || previewUrl ? 'Change Image' : 'Upload Image'}
                        </Button>
                        {hasError && (
                            <Button variant="outline" onClick={handleRetry}>
                                Retry
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
