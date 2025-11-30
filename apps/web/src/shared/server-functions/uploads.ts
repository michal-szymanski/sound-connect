import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
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

export const uploadFile = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.any())
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            if (!(data instanceof FormData)) {
                return failure({ status: 400, message: 'FormData is required' });
            }

            const file = data.get('file');
            const sessionId = data.get('sessionId');

            if (!file || !(file instanceof File)) {
                return failure({ status: 400, message: 'File is required' });
            }

            if (!sessionId || typeof sessionId !== 'string') {
                return failure({ status: 400, message: 'Session ID is required' });
            }

            const response = await env.API.fetch(
                `${env.API_URL}/api/uploads/upload?sessionId=${sessionId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': file.type,
                        ...(auth.cookie && { Cookie: auth.cookie })
                    },
                    body: file
                }
            );

            if (!response.ok) {
                const error = await response.json() as { message?: string };
                return failure({ status: response.status, message: error.message || 'Upload failed' });
            }

            return success({ success: true });
        } catch (error) {
            console.error('uploadFile error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred during upload' });
        }
    });

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
