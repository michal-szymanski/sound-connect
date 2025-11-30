import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';
import { presignedUrlRequestSchema, uploadConfirmRequestSchema, batchConfirmRequestSchema } from '@sound-connect/common/types/uploads';
import { appConfig } from '@sound-connect/common/app-config';
import { isBandAdmin } from '@/api/db/queries/bands-queries';
import {
    createUploadSession,
    getUploadSession,
    confirmUploadSession,
    getExpiredUnconfirmedSessions,
    deleteUploadSessions
} from '@/api/db/queries/upload-sessions-queries';
import {
    generatePresignedPutUrl,
    moveR2Object,
    deleteR2Object,
    validateR2Object,
    validateMagicNumbers,
    constructPublicUrl,
    sanitizeFileName
} from '@/api/services/r2-service';

const uploadsRoutes = new Hono<HonoContext>();

uploadsRoutes.post('/uploads/presigned-url', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const data = presignedUrlRequestSchema.parse(body);

    const allowedTypes = [...appConfig.allowedImageTypes, ...appConfig.allowedVideoTypes, ...appConfig.allowedAudioTypes];
    if (!allowedTypes.includes(data.fileType as never)) {
        throw new HTTPException(400, {
            message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        });
    }

    const isImage = appConfig.allowedImageTypes.includes(data.fileType as never);
    const isVideo = appConfig.allowedVideoTypes.includes(data.fileType as never);
    const isAudio = appConfig.allowedAudioTypes.includes(data.fileType as never);

    const maxSize = isImage ? appConfig.maxImageSize : isVideo ? appConfig.maxVideoSize : isAudio ? appConfig.maxAudioSize : 0;

    if (data.fileSize > maxSize) {
        const fileTypeName = isImage ? 'images' : isVideo ? 'videos' : isAudio ? 'audio files' : 'files';
        throw new HTTPException(400, {
            message: `File size exceeds maximum (${maxSize} bytes for ${fileTypeName})`
        });
    }

    if (data.purpose === 'band-image') {
        if (!data.bandId) {
            throw new HTTPException(400, { message: 'Band ID is required for band image uploads' });
        }

        const isAdmin = await isBandAdmin(data.bandId, user.id);
        if (!isAdmin) {
            throw new HTTPException(403, { message: 'You must be a band admin to upload band images' });
        }
    }

    if (data.purpose === 'band-background') {
        if (!data.bandId) {
            throw new HTTPException(400, { message: 'Band ID is required for band background uploads' });
        }

        const isAdmin = await isBandAdmin(data.bandId, user.id);
        if (!isAdmin) {
            throw new HTTPException(403, { message: 'You must be a band admin to upload band backgrounds' });
        }
    }

    const sessionId = crypto.randomUUID();
    const sanitizedName = sanitizeFileName(data.fileName);
    const extension = sanitizedName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const tempKey = `temp/${user.id}/${timestamp}-${sessionId}.${extension}`;

    const expiresAt = new Date(Date.now() + appConfig.presignedUrlExpiryMinutes * 60 * 1000).toISOString();

    await createUploadSession({
        id: sessionId,
        userId: user.id,
        uploadType: data.purpose,
        bandId: data.bandId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        contentType: data.fileType,
        tempKey,
        expiresAt
    });

    const isLocal = !c.env.R2_ACCESS_KEY_ID || c.env.R2_ACCESS_KEY_ID === 'placeholder';

    let uploadUrl: string;

    if (isLocal) {
        uploadUrl = `${c.env.API_URL}/api/uploads/upload?sessionId=${sessionId}`;
        console.log('[Presigned URL] Using local upload endpoint', { uploadUrl });
    } else {
        uploadUrl = await generatePresignedPutUrl(
            c.env.R2_ACCOUNT_ID,
            c.env.R2_ACCESS_KEY_ID,
            c.env.R2_SECRET_ACCESS_KEY,
            c.env.R2_BUCKET_NAME,
            tempKey,
            data.fileType,
            appConfig.presignedUrlExpiryMinutes * 60
        );
        console.log('[Presigned URL] Using R2 presigned URL');
    }

    return c.json({
        uploadUrl,
        key: tempKey,
        sessionId,
        expiresAt,
        maxFileSize: maxSize
    });
});

uploadsRoutes.post('/uploads/upload', async (c) => {
    const user = c.get('user');

    const sessionId = c.req.query('sessionId');
    if (!sessionId) {
        throw new HTTPException(400, { message: 'Session ID is required' });
    }

    const session = await getUploadSession(sessionId);

    if (!session) {
        throw new HTTPException(404, { message: 'Upload session not found' });
    }

    if (session.userId !== user.id) {
        throw new HTTPException(403, { message: 'Not authorized to upload to this session' });
    }

    if (new Date(session.expiresAt) < new Date()) {
        throw new HTTPException(410, { message: 'Upload session has expired' });
    }

    const body = await c.req.arrayBuffer();

    await c.env.ASSETS.put(session.tempKey, body, {
        httpMetadata: {
            contentType: session.contentType
        }
    });

    return c.json({ success: true });
});

uploadsRoutes.post('/uploads/confirm', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const data = uploadConfirmRequestSchema.parse(body);

    const session = await getUploadSession(data.sessionId);

    if (!session) {
        throw new HTTPException(404, { message: 'Upload session not found or expired' });
    }

    if (session.userId !== user.id) {
        throw new HTTPException(403, { message: 'You do not have permission to confirm this upload' });
    }

    if (new Date(session.expiresAt) < new Date()) {
        throw new HTTPException(410, { message: 'Upload session has expired' });
    }

    const isValid = await validateR2Object(c.env.ASSETS, session.tempKey, session.fileSize, session.contentType);

    if (!isValid) {
        throw new HTTPException(400, { message: 'File validation failed: Size or type mismatch' });
    }

    const magicValid = await validateMagicNumbers(c.env.ASSETS, session.tempKey, session.contentType);

    if (!magicValid) {
        throw new HTTPException(400, { message: 'File validation failed: Invalid file type' });
    }

    const timestamp = Date.now();
    const extension = session.fileName.split('.').pop() || 'bin';

    let permanentKey: string;

    if (session.uploadType === 'profile-image') {
        permanentKey = `users/${user.id}/avatar-${timestamp}.${extension}`;
    } else if (session.uploadType === 'user-background') {
        permanentKey = `users/${user.id}/cover-${timestamp}.${extension}`;
    } else if (session.uploadType === 'band-image') {
        if (!session.bandId) {
            throw new HTTPException(400, { message: 'Band ID is missing' });
        }
        permanentKey = `bands/${session.bandId}/avatar-${timestamp}.${extension}`;
    } else if (session.uploadType === 'band-background') {
        if (!session.bandId) {
            throw new HTTPException(400, { message: 'Band ID is missing' });
        }
        permanentKey = `bands/${session.bandId}/cover-${timestamp}.${extension}`;
    } else if (session.uploadType === 'music-sample') {
        permanentKey = `music-samples/${user.id}/${timestamp}-${data.sessionId}.${extension}`;
    } else {
        permanentKey = `posts/pending/${data.sessionId}.${extension}`;
    }

    console.log('[CONFIRM] Moving from temp:', session.tempKey);
    console.log('[CONFIRM] Moving to permanent:', permanentKey);

    await moveR2Object(c.env.ASSETS, session.tempKey, permanentKey);

    console.log('[CONFIRM] Move completed successfully');

    await confirmUploadSession(data.sessionId);

    const publicUrl = constructPublicUrl(c.env.CLIENT_URL, permanentKey);

    return c.json({
        success: true,
        publicUrl,
        key: permanentKey
    });
});

uploadsRoutes.post('/uploads/confirm-batch', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const data = batchConfirmRequestSchema.parse(body);

    const results = await Promise.all(
        data.sessionIds.map(async (sessionId, index) => {
            const session = await getUploadSession(sessionId);

            if (!session) {
                throw new HTTPException(404, { message: `Upload session not found: ${sessionId}` });
            }

            if (session.userId !== user.id) {
                throw new HTTPException(403, { message: 'You do not have permission to confirm these uploads' });
            }

            if (new Date(session.expiresAt) < new Date()) {
                throw new HTTPException(410, { message: `Upload session has expired: ${sessionId}` });
            }

            const isValid = await validateR2Object(c.env.ASSETS, session.tempKey, session.fileSize, session.contentType);

            if (!isValid) {
                throw new HTTPException(400, { message: `File validation failed for ${data.keys[index]}` });
            }

            const magicValid = await validateMagicNumbers(c.env.ASSETS, session.tempKey, session.contentType);

            if (!magicValid) {
                throw new HTTPException(400, { message: `Invalid file type for ${data.keys[index]}` });
            }

            const extension = session.fileName.split('.').pop() || 'bin';
            const permanentKey = `posts/pending/${sessionId}.${extension}`;

            console.log('[CONFIRM-BATCH] Moving from temp:', session.tempKey);
            console.log('[CONFIRM-BATCH] Moving to permanent:', permanentKey);

            await moveR2Object(c.env.ASSETS, session.tempKey, permanentKey);

            console.log('[CONFIRM-BATCH] Move completed successfully');

            await confirmUploadSession(sessionId);

            const publicUrl = constructPublicUrl(c.env.CLIENT_URL, permanentKey);

            return {
                success: true,
                publicUrl,
                key: permanentKey
            };
        })
    );

    return c.json({ results });
});

uploadsRoutes.post('/uploads/cleanup', async (c) => {
    const before = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const expiredSessions = await getExpiredUnconfirmedSessions(before);

    let deletedCount = 0;

    for (const session of expiredSessions) {
        try {
            await deleteR2Object(c.env.ASSETS, session.tempKey);
            deletedCount++;
        } catch {
            continue;
        }
    }

    const sessionIds = expiredSessions.map((s) => s.id);
    await deleteUploadSessions(sessionIds);

    return c.json({
        success: true,
        deletedCount,
        message: `Cleaned up ${deletedCount} expired upload sessions`
    });
});

export { uploadsRoutes };
