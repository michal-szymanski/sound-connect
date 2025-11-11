import { betterAuth } from 'better-auth';
import { jwt, openAPI } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { schema } from '@/drizzle';
import { APP_NAME_NORMALIZED, JWT_EXPIRATION_TIME_IN_SECONDS } from '@/common/constants';
import { db } from '@/api/db';

const queueVerificationEmail = async (email: string, verificationUrl: string, name: string, userId: string, queue: Queue) => {
    await queue.send({
        type: 'email_verification',
        userId,
        email,
        name,
        verificationUrl
    });
};

const queuePasswordResetEmail = async (email: string, resetUrl: string, name: string, userId: string, queue: Queue) => {
    await queue.send({
        type: 'password_reset',
        userId,
        email,
        name,
        resetUrl
    });
};

type CreateAuthOptions = {
    queue: Queue;
    apiUrl: string;
    clientUrl: string;
    secret: string;
};

const createAuthInstance = ({ queue, apiUrl, clientUrl, secret }: CreateAuthOptions) => {
    return betterAuth({
        baseURL: apiUrl,
        secret,
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema,
            usePlural: true
        }),
        trustedOrigins: [clientUrl],
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
            sendResetPassword: async ({ user, url }) => {
                await queuePasswordResetEmail(user.email, url, user.name, user.id, queue);
            }
        },
        emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ user, url }) => {
                await queueVerificationEmail(user.email, url, user.name, user.id, queue);
            }
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
};

export const createAuth = createAuthInstance;

export type Auth = ReturnType<typeof createAuthInstance>;
