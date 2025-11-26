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
