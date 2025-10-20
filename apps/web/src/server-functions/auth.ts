import { env } from 'cloudflare:workers';
import { userApiSchema, sessionApiSchema } from '@sound-connect/common/types/auth';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { deleteSessionCookies, errorHandler, getSessionFromCookie, setSessionCookies } from '@/web/server-functions/helpers';

export const getSession = createServerFn().handler(async () => {
    const session = getSessionFromCookie();

    if (session) {
        return { success: true, body: session.user } as const;
    }

    const { headers } = getRequest();
    const { API, API_URL } = env;

    const response = await API.fetch(`${API_URL}/api/auth/get-session`, {
        headers
    });

    if (!response.ok) {
        return await errorHandler(response);
    }

    try {
        setSessionCookies(response);

        const json = await response.json();
        const schema = z.object({ session: sessionApiSchema, user: userApiSchema });

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
    .inputValidator(z.object({ email: z.string(), password: z.string(), rememberMe: z.boolean() }))
    .handler(async ({ data }) => {
        const { API, API_URL, CLIENT_URL } = env;

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
                user: userApiSchema,
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
    const { API, API_URL } = env;
    const { headers } = getRequest();
    const cookie = headers.get('Cookie');

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
    .inputValidator(z.object({ name: z.string(), email: z.string(), password: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL, CLIENT_URL } = env;

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
                user: userApiSchema
            });

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });
