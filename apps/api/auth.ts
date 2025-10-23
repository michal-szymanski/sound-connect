import { betterAuth } from 'better-auth';
import { openAPI } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { schema } from '@/drizzle';
import { env } from 'cloudflare:workers';
import { db } from '@/api/db';
import { APP_NAME_NORMALIZED } from '@/common/constants';

export const auth = betterAuth({
    baseURL: env.API_URL,
    database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema,
        usePlural: true
    }),
    trustedOrigins: [env.CLIENT_URL],
    emailAndPassword: {
        enabled: true
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
            partitioned: true // New browser standards will mandate this for foreign cookies
        },
        cookiePrefix: APP_NAME_NORMALIZED
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration in seconds
        }
    },
    plugins: [openAPI()]
});
