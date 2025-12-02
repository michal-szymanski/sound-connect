import { betterAuth } from 'better-auth';
import { jwt, openAPI, admin, username } from 'better-auth/plugins';
import { DB, drizzleAdapter } from 'better-auth/adapters/drizzle';
import { schema } from '@/drizzle';
import { appConfig } from '@sound-connect/common/app-config';
import { isUsernameAvailable } from '@/api/db/queries/users-queries';

const generateUsername = async (): Promise<string> => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username: string;
    let attempts = 0;

    do {
        username = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        attempts++;
    } while (!(await isUsernameAvailable(username)) && attempts < 10);

    if (attempts >= 10) {
        username = username + Date.now().toString(36).slice(-2);
    }

    return username;
};

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
    db: DB;
    queue: Queue;
    apiUrl: string;
    clientUrl: string;
    adminUrl: string;
    secret: string;
};

export const createAuth = ({ db, queue, apiUrl, clientUrl, adminUrl, secret }: CreateAuthOptions) => {
    return betterAuth({
        baseURL: apiUrl,
        secret,
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema,
            usePlural: true
        }),
        trustedOrigins: [clientUrl, adminUrl],
        databaseHooks: {
            user: {
                create: {
                    before: async (user) => {
                        const username = await generateUsername();
                        return {
                            data: {
                                ...user,
                                username
                            }
                        };
                    }
                }
            }
        },
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: appConfig.emailsEnabled,
            minPasswordLength: 1,
            sendResetPassword: async ({ user, url }) => {
                if (!appConfig.emailsEnabled) return;
                await queuePasswordResetEmail(user.email, url, user.name, user.id, queue);
            }
        },
        emailVerification: {
            sendOnSignUp: appConfig.emailsEnabled,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ user, url }) => {
                if (!appConfig.emailsEnabled) return;
                await queueVerificationEmail(user.email, url, user.name, user.id, queue);
            }
        },
        user: {
            additionalFields: {
                lastActiveAt: {
                    type: 'string',
                    input: false
                },
                backgroundImage: {
                    type: 'string',
                    required: false,
                    input: false
                },
                username: {
                    type: 'string',
                    required: false,
                    input: false
                }
            }
        },
        advanced: {
            defaultCookieAttributes: {
                sameSite: 'none',
                secure: true
            },
            cookiePrefix: appConfig.appNameNormalized
        },
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 5 * 60
            }
        },
        plugins: [
            admin({
                defaultRole: 'user',
                adminRoles: ['admin']
            }),
            username(),
            openAPI(),
            jwt({
                jwt: {
                    expirationTime: `${appConfig.jwtExpirationTimeInSeconds}s`
                }
            })
        ]
    });
};

export type Auth = ReturnType<typeof createAuth>;
