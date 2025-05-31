import { getBindings } from '@/web/lib/cloudflare-bindings';
import { deleteSessionCookies, errorHandler, getSessionFromCookie, setSessionCookies } from '@/web/server-functions/helpers';
import { userSchema } from '@sound-connect/common/types/models';
import { sessionSchema } from '@sound-connect/common/types/auth';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest, getHeader } from '@tanstack/react-start/server';
import { z } from 'zod';

export const getSession = createServerFn().handler(async () => {
    const session = getSessionFromCookie();

    if (session) {
        return { success: true, body: session.user } as const;
    }

    const { headers } = getWebRequest()!;
    const { API, API_URL } = await getBindings();

    const response = await API.fetch(`${API_URL}/api/auth/get-session`, {
        headers
    });

    if (!response.ok) {
        return await errorHandler(response);
    }

    try {
        setSessionCookies(response);

        const json = await response.json();
        const schema = z.object({ session: sessionSchema, user: userSchema });

        if (!json) {
            return { success: false, body: null } as const;
        }

        return { success: true, body: schema.parse(json).user } as const;
    } catch (error) {
        console.error(error);
        return { success: false, body: null } as const;
    }
});

export const signIn = createServerFn({ method: 'POST' })
    .validator((data: { email: string; password: string; rememberMe: boolean }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL, CLIENT_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/api/auth/sign-in/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                callbackURL: CLIENT_URL
            })
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        const isSessionCreated = setSessionCookies(response);

        if (!isSessionCreated) {
            return { success: false, body: null } as const;
        }

        try {
            const json = await response.json();
            const schema = z.object({
                user: userSchema,
                url: z.string(),
                redirect: z.boolean(),
                token: z.string()
            });

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const signOut = createServerFn({
    method: 'POST'
}).handler(async () => {
    const { API, API_URL } = await getBindings();
    const cookie = getHeader('Cookie');

    if (!cookie) {
        return { success: false, body: null } as const;
    }

    const response = await API.fetch(`${API_URL}/api/auth/sign-out`, {
        method: 'POST',
        headers: {
            Cookie: cookie
        },
        body: JSON.stringify({})
    });

    if (!response.ok) {
        return await errorHandler(response);
    }

    try {
        const json = await response.json();
        const schema = z.object({ success: z.boolean() });
        const result = schema.parse(json);

        if (result.success) {
            deleteSessionCookies();
        }

        return { success: true, body: schema.parse(json) } as const;
    } catch (error) {
        console.error(error);
        return { success: false, body: null } as const;
    }
});

export const signUp = createServerFn({
    method: 'POST'
})
    .validator((data: { name: string; email: string; password: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL, CLIENT_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                callbackURL: CLIENT_URL
            })
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        const isSessionCreated = setSessionCookies(response);

        if (!isSessionCreated) {
            return { success: false, body: null } as const;
        }

        try {
            const json = await response.json();
            const schema = z.object({
                token: z.string(),
                user: userSchema
            });

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });
