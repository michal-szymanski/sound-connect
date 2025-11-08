import { betterAuth } from 'better-auth';
import { jwt, openAPI } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { schema } from '@/drizzle';
import { APP_NAME_NORMALIZED, JWT_EXPIRATION_TIME_IN_SECONDS } from '@/common/constants';
import { db } from '@/api/db';
import { env } from 'cloudflare:workers';

export const auth = betterAuth({
    baseURL: env.API_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema,
        usePlural: true
    }),
    trustedOrigins: [env.CLIENT_URL],
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            lastActiveAt: {
                type: 'string',
                input: false
            }
        }
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
    plugins: [
        openAPI(),
        jwt({
            jwt: {
                expirationTime: `${JWT_EXPIRATION_TIME_IN_SECONDS}s`
            }
        })
    ]
});
