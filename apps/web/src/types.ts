import { betterAuth } from 'better-auth';

type AuthErrorCodes = ReturnType<typeof betterAuth>['$ERROR_CODES'];

export type AuthError = {
    [K in keyof AuthErrorCodes]: {
        code: K;
        message: AuthErrorCodes[K];
    };
}[keyof AuthErrorCodes];
