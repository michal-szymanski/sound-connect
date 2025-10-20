import { z } from 'zod';
import { userSchema, sessionSchema } from './drizzle';

export const authErrorSchema = z.discriminatedUnion('code', [
    z.object({
        code: z.literal('USER_NOT_FOUND'),
        message: z.literal('User not found')
    }),
    z.object({
        code: z.literal('FAILED_TO_CREATE_USER'),
        message: z.literal('Failed to create user')
    }),
    z.object({
        code: z.literal('FAILED_TO_CREATE_SESSION'),
        message: z.literal('Failed to create session')
    }),
    z.object({
        code: z.literal('FAILED_TO_UPDATE_USER'),
        message: z.literal('Failed to update user')
    }),
    z.object({
        code: z.literal('FAILED_TO_GET_SESSION'),
        message: z.literal('Failed to get session')
    }),
    z.object({
        code: z.literal('INVALID_PASSWORD'),
        message: z.literal('Invalid password')
    }),
    z.object({
        code: z.literal('INVALID_EMAIL'),
        message: z.literal('Invalid email')
    }),
    z.object({
        code: z.literal('INVALID_EMAIL_OR_PASSWORD'),
        message: z.literal('Invalid email or password')
    }),
    z.object({
        code: z.literal('SOCIAL_ACCOUNT_ALREADY_LINKED'),
        message: z.literal('Social account already linked')
    }),
    z.object({
        code: z.literal('PROVIDER_NOT_FOUND'),
        message: z.literal('Provider not found')
    }),
    z.object({
        code: z.literal('INVALID_TOKEN'),
        message: z.literal('invalid token')
    }),
    z.object({
        code: z.literal('ID_TOKEN_NOT_SUPPORTED'),
        message: z.literal('id_token not supported')
    }),
    z.object({
        code: z.literal('FAILED_TO_GET_USER_INFO'),
        message: z.literal('Failed to get user info')
    }),
    z.object({
        code: z.literal('USER_EMAIL_NOT_FOUND'),
        message: z.literal('User email not found')
    }),
    z.object({
        code: z.literal('EMAIL_NOT_VERIFIED'),
        message: z.literal('Email not verified')
    }),
    z.object({
        code: z.literal('PASSWORD_TOO_SHORT'),
        message: z.literal('Password too short')
    }),
    z.object({
        code: z.literal('PASSWORD_TOO_LONG'),
        message: z.literal('Password too long')
    }),
    z.object({
        code: z.literal('USER_ALREADY_EXISTS'),
        message: z.literal('User already exists')
    }),
    z.object({
        code: z.literal('EMAIL_CAN_NOT_BE_UPDATED'),
        message: z.literal('Email can not be updated')
    }),
    z.object({
        code: z.literal('CREDENTIAL_ACCOUNT_NOT_FOUND'),
        message: z.literal('Credential account not found')
    }),
    z.object({
        code: z.literal('SESSION_EXPIRED'),
        message: z.literal('Session expired. Re-authenticate to perform this action.')
    }),
    z.object({
        code: z.literal('FAILED_TO_UNLINK_LAST_ACCOUNT'),
        message: z.literal("You can't unlink your last account")
    }),
    z.object({
        code: z.literal('ACCOUNT_NOT_FOUND'),
        message: z.literal('Account not found')
    })
]);

export type AuthError = z.infer<typeof authErrorSchema>;

export const userApiSchema = userSchema.omit({ createdAt: true, updatedAt: true }).extend({
    createdAt: z.string(),
    updatedAt: z.string()
});

export type UserApi = z.infer<typeof userApiSchema>;

export const sessionApiSchema = sessionSchema.omit({ expiresAt: true, createdAt: true, updatedAt: true }).extend({
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export type SessionApi = z.infer<typeof sessionApiSchema>;
