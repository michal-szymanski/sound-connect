import { Hono } from 'hono';
import { HonoContext } from 'types';
import crypto from 'crypto';
const mediaRoutes = new Hono<HonoContext>();

mediaRoutes.put('/media', async (c) => {
    try {
        const key = crypto.randomUUID();
        const body = await c.req.arrayBuffer();

        const r2Object = await c.env.UsersBucket.put(key, body, {
            onlyIf: c.req.header(),
            httpMetadata: c.req.header()
        });

        if (!r2Object) {
            return c.json({ success: false, body: { message: 'Failed to upload media' } }, 500);
        }

        return c.json({
            success: true,
            body: {
                key: r2Object.key
            }
        });
    } catch (error) {
        console.error(`[Server] Error uploading media:`, error);
        return c.json({ message: 'Internal Server Error' }, 500);
    }
});

mediaRoutes.get('/media/:key', async (c) => {
    try {
        const { key } = c.req.param();
        const r2Object = await c.env.UsersBucket.get(key);

        if (!r2Object) {
            return c.json({ success: false, body: { message: 'Media not found' } }, 404);
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
    } catch (error) {
        console.error(`[Server] Error getting media:`, error);
        return c.json({ message: 'Internal Server Error' }, 500);
    }
});

mediaRoutes.delete('/media/:key', async (c) => {
    const { key } = c.req.param();
    try {
        await c.env.UsersBucket.delete(key);
        return c.json({ success: true });
    } catch (error) {
        console.error(`[Server] Error deleting media:`, error);
        return c.json({ message: 'Internal Server Error' }, 500);
    }
});

export { mediaRoutes };
