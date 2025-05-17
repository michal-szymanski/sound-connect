import { betterAuth } from 'better-auth';
import { openAPI } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '@/api/db/schema';
import { DrizzleDB } from 'types';

export const auth = (db: DrizzleDB, { API_URL, CLIENT_URL }: CloudflareBindings) =>
    betterAuth({
        baseURL: API_URL,
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema,
            usePlural: true
        }),
        trustedOrigins: [CLIENT_URL],
        emailAndPassword: {
            enabled: true
        },
        advanced: {
            defaultCookieAttributes: {
                sameSite: 'none',
                secure: true,
                partitioned: true // New browser standards will mandate this for foreign cookies
            },
            cookiePrefix: 'sound-connect'
        },
        plugins: [openAPI()]
        // socialProviders: {
        //     spotify: {
        //         clientId: SPOTIFY_CLIENT_ID,
        //         clientSecret: SPOTIFY_CLIENT_SECRET
        //     }
        // }
    });
