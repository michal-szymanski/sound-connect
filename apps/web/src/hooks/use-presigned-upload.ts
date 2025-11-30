import { useState, useCallback, useRef } from 'react';
import type { UploadPurpose } from '@sound-connect/common/types/uploads';
import { requestPresignedUrl, confirmUpload } from '@/shared/server-functions/uploads';

type UploadState = 'idle' | 'requesting' | 'uploading' | 'confirming' | 'success' | 'error';

type UsePresignedUploadOptions = {
    purpose: UploadPurpose;
    bandId?: number;
    onSuccess?: (result: { publicUrl: string; key: string }) => void;
    onError?: (error: Error) => void;
};

type UsePresignedUploadResult = {
    upload: (file: File) => Promise<void>;
    progress: number;
    state: UploadState;
    error: string | null;
    cancel: () => void;
};

const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const usePresignedUpload = (options: UsePresignedUploadOptions): UsePresignedUploadResult => {
    const { purpose, bandId, onSuccess, onError } = options;

    const [state, setState] = useState<UploadState>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cancel = useCallback(() => {
        console.log('[Upload] Cancelling upload');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
        setState('idle');
        setProgress(0);
        setError(null);
    }, []);

    const resetToIdle = useCallback(() => {
        console.log('[Upload] Resetting to idle state');
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
        setState('idle');
        setProgress(0);
    }, []);

    const upload = useCallback(
        async (file: File) => {
            console.log('[Upload] Starting upload process', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                purpose
            });

            try {
                abortControllerRef.current = new AbortController();
                setError(null);
                setProgress(0);

                console.log('[Upload] State: requesting presigned URL');
                setState('requesting');

                const presignedResult = await requestPresignedUrl({
                    data: {
                        purpose,
                        fileType: file.type,
                        fileSize: file.size,
                        fileName: sanitizeFileName(file.name),
                        ...(bandId && { bandId })
                    }
                });

                console.log('[Upload] Presigned URL result:', {
                    success: presignedResult.success,
                    hasBody: !!presignedResult.body
                });

                if (!presignedResult.success) {
                    const errorMsg = presignedResult.body?.message || 'Failed to request upload URL';
                    console.error('[Upload] Failed to get presigned URL:', errorMsg);
                    throw new Error(errorMsg);
                }

                const { uploadUrl, key, sessionId } = presignedResult.body;
                console.log('[Upload] Got presigned URL', { sessionId, key });

                console.log('[Upload] State: uploading file directly to R2');
                setState('uploading');
                setProgress(50);

                console.log('[Upload] Uploading directly to R2 via presigned URL');

                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const percentComplete = Math.round((e.loaded / e.total) * 100);
                            const mappedProgress = 50 + Math.round(percentComplete * 0.4);
                            setProgress(mappedProgress);
                        }
                    });

                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setProgress(90);
                            resolve();
                        } else {
                            reject(new Error(`Upload failed with status ${xhr.status}`));
                        }
                    });

                    xhr.addEventListener('error', () => {
                        reject(new Error('Upload to R2 failed'));
                    });

                    xhr.addEventListener('abort', () => {
                        reject(new Error('Upload aborted'));
                    });

                    xhr.open('PUT', uploadUrl);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);
                });

                console.log('[Upload] State: confirming upload');
                setState('confirming');

                const confirmResult = await confirmUpload({
                    data: {
                        sessionId,
                        key
                    }
                });

                console.log('[Upload] Confirm result:', {
                    success: confirmResult.success,
                    hasBody: !!confirmResult.body
                });

                if (!confirmResult.success) {
                    const errorMsg = confirmResult.body?.message || 'Failed to confirm upload';
                    console.error('[Upload] Confirmation failed:', errorMsg);
                    throw new Error(errorMsg);
                }

                console.log('[Upload] Upload successful!', confirmResult.body);
                setState('success');
                setProgress(100);

                onSuccess?.(confirmResult.body);

                console.log('[Upload] Resetting to idle immediately');
                setState('idle');
                setProgress(0);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                console.error('[Upload] Error during upload:', {
                    error: err,
                    message: errorMessage,
                    stack: err instanceof Error ? err.stack : undefined
                });

                setError(errorMessage);
                setState('error');
                setProgress(0);

                onError?.(err instanceof Error ? err : new Error(errorMessage));

                console.log('[Upload] Scheduling reset to idle after error in 5 seconds');
                resetTimeoutRef.current = setTimeout(() => {
                    resetToIdle();
                }, 5000);
            } finally {
                abortControllerRef.current = null;
            }
        },
        [purpose, bandId, onSuccess, onError, resetToIdle]
    );

    return {
        upload,
        progress,
        state,
        error,
        cancel
    };
};
