import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';
import crypto from 'crypto';
const mediaRoutes = new Hono<HonoContext>();

mediaRoutes.put('/media', async (c) => {
    const key = crypto.randomUUID();
    const body = await c.req.arrayBuffer();

    const r2Object = await c.env.ASSETS.put(key, body, {
        onlyIf: c.req.header(),
        httpMetadata: c.req.header()
    });

    if (!r2Object) {
        throw new HTTPException(500, { message: 'Failed to upload media' });
    }

    return c.json({
        success: true,
        body: {
            key: r2Object.key
        }
    });
});

mediaRoutes.get('/media/*', async (c) => {
    const fullPath = c.req.path;
    const key = fullPath.replace('/api/media/', '');

    console.log('[MEDIA GET] Request path:', fullPath);
    console.log('[MEDIA GET] Extracted key:', key);

    if (!key) {
        throw new HTTPException(400, { message: 'Missing media key' });
    }

    const r2Object = await c.env.ASSETS.get(key);

    console.log('[MEDIA GET] R2 object found:', !!r2Object);
    if (r2Object) {
        console.log('[MEDIA GET] R2 object size:', r2Object.size);
        console.log('[MEDIA GET] R2 object key:', r2Object.key);
    }

    if (!r2Object) {
        throw new HTTPException(404, { message: 'Media not found' });
    }

    const headers = new Headers();
    r2Object.writeHttpMetadata(headers);

    for (const [headerKey, value] of headers.entries()) {
        c.header(headerKey, value);
    }

    c.header('etag', r2Object.httpEtag);

    c.header('Cache-Control', 'public, max-age=31536000');

    return new Response(r2Object.body, {
        headers: c.res.headers
    });
});

mediaRoutes.delete('/media/*', async (c) => {
    const fullPath = c.req.path;
    const key = fullPath.replace('/api/media/', '');

    if (!key) {
        throw new HTTPException(400, { message: 'Missing media key' });
    }

    await c.env.ASSETS.delete(key);
    return c.json({ success: true });
});

export { mediaRoutes };
