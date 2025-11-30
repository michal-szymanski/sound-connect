import { useState, useCallback, useRef } from 'react';
import type { UploadPurpose } from '@sound-connect/common/types/uploads';
import { requestPresignedUrl, uploadFile, confirmBatchUpload } from '@/shared/server-functions/uploads';

type UploadState = 'idle' | 'requesting' | 'uploading' | 'confirming' | 'success' | 'error';

type UseBatchPresignedUploadOptions = {
    purpose: Extract<UploadPurpose, 'post-media'>;
    maxFiles?: number;
    onSuccess?: (results: Array<{ publicUrl: string; key: string }>) => void;
    onError?: (error: Error) => void;
};

type UseBatchPresignedUploadResult = {
    upload: (files: File[]) => Promise<void>;
    progress: number[];
    overallProgress: number;
    state: UploadState;
    error: string | null;
    cancel: () => void;
};

type UploadSession = {
    sessionId: string;
    key: string;
};

const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const useBatchPresignedUpload = (options: UseBatchPresignedUploadOptions): UseBatchPresignedUploadResult => {
    const { purpose, maxFiles = 5, onSuccess, onError } = options;

    const [state, setState] = useState<UploadState>('idle');
    const [progress, setProgress] = useState<number[]>([]);
    const [overallProgress, setOverallProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cancel = useCallback(() => {
        console.log('[BatchUpload] Cancelling upload');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
        setState('idle');
        setProgress([]);
        setOverallProgress(0);
        setError(null);
    }, []);

    const resetToIdle = useCallback(() => {
        console.log('[BatchUpload] Resetting to idle state');
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
        setState('idle');
        setProgress([]);
        setOverallProgress(0);
    }, []);

    const upload = useCallback(
        async (files: File[]) => {
            console.log('[BatchUpload] Starting batch upload process', {
                fileCount: files.length,
                files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
                purpose
            });

            try {
                if (files.length > maxFiles) {
                    throw new Error(`Too many files. Maximum ${maxFiles} files allowed.`);
                }

                if (files.length === 0) {
                    throw new Error('No files selected');
                }

                abortControllerRef.current = new AbortController();
                setError(null);
                setProgress(files.map(() => 0));
                setOverallProgress(0);

                console.log('[BatchUpload] State: requesting presigned URLs');
                setState('requesting');
                const presignedResults = await Promise.all(
                    files.map((file) =>
                        requestPresignedUrl({
                            data: {
                                purpose,
                                fileType: file.type,
                                fileSize: file.size,
                                fileName: sanitizeFileName(file.name)
                            }
                        })
                    )
                );

                console.log('[BatchUpload] Presigned URL results:', {
                    total: presignedResults.length,
                    successful: presignedResults.filter(r => r.success).length
                });

                const failedRequest = presignedResults.find((result) => !result.success);
                if (failedRequest && !failedRequest.success) {
                    const errorMsg = failedRequest.body?.message || 'Failed to request upload URLs';
                    console.error('[BatchUpload] Failed to get presigned URLs:', errorMsg);
                    throw new Error(errorMsg);
                }

                const sessions: UploadSession[] = presignedResults.map((result) => {
                    if (!result.success) {
                        throw new Error('Unexpected error in presigned URL results');
                    }
                    return {
                        sessionId: result.body.sessionId,
                        key: result.body.key
                    };
                });

                console.log('[BatchUpload] State: uploading files', {
                    sessionCount: sessions.length
                });
                setState('uploading');

                const uploadPromises = sessions.map(async (session, index) => {
                    const file = files[index];
                    if (!file) {
                        throw new Error('File not found for session');
                    }

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('sessionId', session.sessionId);

                    const uploadResult = await uploadFile({ data: formData });

                    if (!uploadResult.success) {
                        throw new Error(uploadResult.body?.message || 'Upload failed');
                    }

                    setProgress((prev) => {
                        const newProgress = [...prev];
                        newProgress[index] = 100;
                        const overall = Math.round(newProgress.reduce((sum, p) => sum + p, 0) / newProgress.length);
                        setOverallProgress(overall);
                        return newProgress;
                    });
                });

                const batchSize = 3;
                for (let i = 0; i < uploadPromises.length; i += batchSize) {
                    await Promise.all(uploadPromises.slice(i, i + batchSize));
                }

                console.log('[BatchUpload] State: confirming uploads');
                setState('confirming');
                setProgress(files.map(() => 100));
                setOverallProgress(100);

                const confirmResult = await confirmBatchUpload({
                    data: {
                        sessionIds: sessions.map((s) => s.sessionId),
                        keys: sessions.map((s) => s.key)
                    }
                });

                console.log('[BatchUpload] Confirm result:', {
                    success: confirmResult.success,
                    hasBody: !!confirmResult.body
                });

                if (!confirmResult.success) {
                    const errorMsg = confirmResult.body?.message || 'Failed to confirm uploads';
                    console.error('[BatchUpload] Confirmation failed:', errorMsg);
                    throw new Error(errorMsg);
                }

                console.log('[BatchUpload] Upload successful!', confirmResult.body);
                setState('success');
                onSuccess?.(confirmResult.body.results);

                console.log('[BatchUpload] Scheduling reset to idle in 2 seconds');
                resetTimeoutRef.current = setTimeout(() => {
                    resetToIdle();
                }, 2000);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                console.error('[BatchUpload] Error during upload:', {
                    error: err,
                    message: errorMessage,
                    stack: err instanceof Error ? err.stack : undefined
                });

                setError(errorMessage);
                setState('error');
                setProgress([]);
                setOverallProgress(0);

                onError?.(err instanceof Error ? err : new Error(errorMessage));

                console.log('[BatchUpload] Scheduling reset to idle after error in 5 seconds');
                resetTimeoutRef.current = setTimeout(() => {
                    resetToIdle();
                }, 5000);
            } finally {
                abortControllerRef.current = null;
            }
        },
        [purpose, maxFiles, onSuccess, onError, resetToIdle]
    );

    return {
        upload,
        progress,
        overallProgress,
        state,
        error,
        cancel
    };
};
