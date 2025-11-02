import { betterAuth } from 'better-auth';
import { bearer, openAPI } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { schema } from '@/drizzle';
import { APP_NAME_NORMALIZED } from '@/common/constants';
import type { createDb } from '@/api/db';

export const createAuth = (db: ReturnType<typeof createDb>, baseURL: string, secret: string) =>
    betterAuth({
        baseURL,
        secret,
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema,
            usePlural: true
        }),
        trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
        emailAndPassword: {
            enabled: true
        },
        advanced: {
            defaultCookieAttributes: {
                sameSite: 'none',
                secure: true,
                partitioned: true
            },
            cookiePrefix: APP_NAME_NORMALIZED
        },
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 5 * 60
            }
        },
        plugins: [openAPI(), bearer()]
    });

let _auth: ReturnType<typeof createAuth> | null = null;

export const initAuth = (db: ReturnType<typeof createDb>, baseURL: string, secret: string) => {
    if (!_auth) {
        _auth = createAuth(db, baseURL, secret);
    }
    return _auth;
};

export const getAuth = () => {
    if (!_auth) {
        throw new Error('Auth not initialized. Call initAuth first.');
    }
    return _auth;
};

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
    get(_, prop) {
        return getAuth()[prop as keyof ReturnType<typeof createAuth>];
    }
});
