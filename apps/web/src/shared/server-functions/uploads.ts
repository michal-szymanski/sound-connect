import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { success, failure, apiErrorHandler } from '@/shared/server-functions/helpers';
import {
    presignedUrlRequestSchema,
    presignedUrlResponseSchema,
    uploadConfirmRequestSchema,
    uploadConfirmResponseSchema,
    batchConfirmRequestSchema,
    batchConfirmResponseSchema
} from '@sound-connect/common/types/uploads';

export const requestPresignedUrl = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(presignedUrlRequestSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/uploads/presigned-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(presignedUrlResponseSchema.parse(json));
        } catch (error) {
            console.error('requestPresignedUrl error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const uploadToPresignedUrl = async (uploadUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const progress = Math.round((e.loaded / e.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
};

export const confirmUpload = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(uploadConfirmRequestSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/uploads/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(uploadConfirmResponseSchema.parse(json));
        } catch (error) {
            console.error('confirmUpload error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const confirmBatchUpload = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(batchConfirmRequestSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/uploads/confirm-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(batchConfirmResponseSchema.parse(json));
        } catch (error) {
            console.error('confirmBatchUpload error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
