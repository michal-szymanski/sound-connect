import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { EmailVerificationMessage, PasswordResetMessage } from '@sound-connect/common/types/notifications';
import { VerificationEmail } from '../emails/verification-email';
import { PasswordResetEmail } from '../emails/password-reset-email';

const getVerificationEmailText = (verificationUrl: string, name: string): string => {
    return `
Welcome to Sound Connect, ${name}!

Please verify your email address to complete your registration.

Click the link below to verify your email:
${verificationUrl}

If you didn't create a Sound Connect account, you can safely ignore this email.

© ${new Date().getFullYear()} Sound Connect. All rights reserved.
    `.trim();
};

const getPasswordResetEmailText = (resetUrl: string, name: string): string => {
    return `
Reset Your Password

Hi ${name}, we received a request to reset your password for your Sound Connect account.

Click the link below to reset your password:
${resetUrl}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

This link will expire in 1 hour for security reasons.

© ${new Date().getFullYear()} Sound Connect. All rights reserved.
    `.trim();
};

export const sendVerificationEmail = async (message: EmailVerificationMessage, resendApiKey: string): Promise<void> => {
    const resend = new Resend(resendApiKey);

    const html = await render(
        VerificationEmail({
            name: message.name,
            verificationUrl: message.verificationUrl
        })
    );
    const text = getVerificationEmailText(message.verificationUrl, message.name);

    await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to: message.email,
        subject: 'Verify Your Email - Sound Connect',
        html,
        text
    });

    console.log(`[EMAIL] Sent verification email to ${message.email} for user ${message.userId}`);
};

export const sendPasswordResetEmail = async (message: PasswordResetMessage, resendApiKey: string): Promise<void> => {
    const resend = new Resend(resendApiKey);

    const html = await render(
        PasswordResetEmail({
            name: message.name,
            resetUrl: message.resetUrl
        })
    );
    const text = getPasswordResetEmailText(message.resetUrl, message.name);

    await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to: message.email,
        subject: 'Reset Your Password - Sound Connect',
        html,
        text
    });

    console.log(`[EMAIL] Sent password reset email to ${message.email} for user ${message.userId}`);
};
