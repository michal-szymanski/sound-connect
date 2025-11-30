import { useState, useCallback, useRef } from 'react';
import type { UploadPurpose } from '@sound-connect/common/types/uploads';
import { requestPresignedUrl, uploadFile, confirmUpload } from '@/shared/server-functions/uploads';

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

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setState('idle');
            setProgress(0);
            setError(null);
        }
    }, []);

    const upload = useCallback(
        async (file: File) => {
            try {
                abortControllerRef.current = new AbortController();
                setError(null);
                setProgress(0);

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

                if (!presignedResult.success) {
                    throw new Error(presignedResult.body?.message || 'Failed to request upload URL');
                }

                const { key, sessionId } = presignedResult.body;

                setState('uploading');
                const formData = new FormData();
                formData.append('file', file);
                formData.append('sessionId', sessionId);

                const uploadResult = await uploadFile({ data: formData });

                if (!uploadResult.success) {
                    throw new Error(uploadResult.body?.message || 'Upload failed');
                }

                setState('confirming');
                setProgress(100);

                const confirmResult = await confirmUpload({
                    data: {
                        sessionId,
                        key
                    }
                });

                if (!confirmResult.success) {
                    throw new Error(confirmResult.body?.message || 'Failed to confirm upload');
                }

                setState('success');
                onSuccess?.(confirmResult.body);

                setTimeout(() => {
                    setState('idle');
                    setProgress(0);
                }, 2000);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Upload failed';
                setError(errorMessage);
                setState('error');
                setProgress(0);
                onError?.(err instanceof Error ? err : new Error(errorMessage));
            }
        },
        [purpose, bandId, onSuccess, onError]
    );

    return {
        upload,
        progress,
        state,
        error,
        cancel
    };
};
