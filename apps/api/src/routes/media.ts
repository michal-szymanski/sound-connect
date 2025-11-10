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

mediaRoutes.get('/media/:key', async (c) => {
    const { key } = c.req.param();
    const r2Object = await c.env.ASSETS.get(key);

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

mediaRoutes.delete('/media/:key', async (c) => {
    const { key } = c.req.param();
    await c.env.ASSETS.delete(key);
    return c.json({ success: true });
});

export { mediaRoutes };
