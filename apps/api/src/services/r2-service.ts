import { AwsClient } from 'aws4fetch';

export const generatePresignedPutUrl = async (
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucketName: string,
    key: string,
    contentType: string,
    expiresIn = 900
): Promise<string> => {
    const r2Client = new AwsClient({
        accessKeyId,
        secretAccessKey,
        service: 's3',
        region: 'auto'
    });

    const baseUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;
    const url = new URL(baseUrl);
    url.searchParams.set('X-Amz-Expires', expiresIn.toString());

    const signedRequest = await r2Client.sign(url.toString(), {
        method: 'PUT',
        headers: {
            'Content-Type': contentType
        },
        aws: {
            signQuery: true,
            allHeaders: true
        }
    });

    return signedRequest.url;
};

export const moveR2Object = async (bucket: R2Bucket, fromKey: string, toKey: string): Promise<void> => {
    const object = await bucket.get(fromKey);

    if (!object) {
        throw new Error(`Object not found: ${fromKey}`);
    }

    await bucket.put(toKey, object.body, {
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata
    });

    await bucket.delete(fromKey);
};

export const deleteR2Object = async (bucket: R2Bucket, key: string): Promise<void> => {
    await bucket.delete(key);
};

export const validateR2Object = async (bucket: R2Bucket, key: string, expectedSize: number, expectedType: string): Promise<boolean> => {
    console.log('[R2 Validation] Starting validation', { key, expectedSize, expectedType });

    const object = await bucket.head(key);

    if (!object) {
        console.error('[R2 Validation] Object not found in bucket', { key });
        return false;
    }

    const actualSize = object.size;
    const actualType = object.httpMetadata?.contentType;

    console.log('[R2 Validation] Object metadata', {
        key,
        actualSize,
        expectedSize,
        sizeDiff: actualSize - expectedSize,
        actualType,
        expectedType,
        typeMatch: actualType === expectedType
    });

    const sizeTolerance = expectedSize * 0.01;
    const sizeMatch = Math.abs(actualSize - expectedSize) <= sizeTolerance;
    const typeMatch = actualType === expectedType;

    if (!sizeMatch) {
        console.error('[R2 Validation] Size mismatch', {
            key,
            actualSize,
            expectedSize,
            diff: actualSize - expectedSize,
            tolerance: sizeTolerance
        });
    }

    if (!typeMatch) {
        console.error('[R2 Validation] Content-Type mismatch', {
            key,
            actualType,
            expectedType
        });
    }

    const isValid = sizeMatch && typeMatch;
    console.log('[R2 Validation] Result', { key, isValid, sizeMatch, typeMatch });

    return isValid;
};

const MAGIC_NUMBERS: Record<string, number[]> = {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'image/gif': [0x47, 0x49, 0x46],
    'video/mp4': [0x00, 0x00, 0x00],
    'video/webm': [0x1a, 0x45, 0xdf, 0xa3],
    'video/quicktime': [0x00, 0x00, 0x00],
    'audio/mpeg': [0x49, 0x44, 0x33],
    'audio/wav': [0x52, 0x49, 0x46, 0x46],
    'audio/ogg': [0x4f, 0x67, 0x67, 0x53],
    'audio/webm': [0x1a, 0x45, 0xdf, 0xa3]
};

export const validateMagicNumbers = async (bucket: R2Bucket, key: string, expectedType: string): Promise<boolean> => {
    const object = await bucket.get(key);

    if (!object || !object.body) {
        return false;
    }

    const reader = object.body.getReader();
    const { value } = await reader.read();
    reader.releaseLock();

    if (!value || value.length < 16) {
        return false;
    }

    const magicNumbers = MAGIC_NUMBERS[expectedType];
    if (!magicNumbers) {
        return true;
    }

    for (let i = 0; i < magicNumbers.length; i++) {
        if (value[i] !== magicNumbers[i]) {
            return false;
        }
    }

    return true;
};

export const constructPublicUrl = (clientUrl: string, key: string): string => {
    return `${clientUrl}/media/${key}`;
};

export const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 255);
};
