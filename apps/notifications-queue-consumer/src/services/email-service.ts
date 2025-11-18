import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { EmailVerificationMessage, PasswordResetMessage } from '@sound-connect/common/types/notifications';
import { VerificationEmail } from '../emails/verification-email';
import { PasswordResetEmail } from '../emails/password-reset-email';
import { FollowerEmail } from '../emails/follower-email';
import { CommentEmail } from '../emails/comment-email';
import { BandApplicationReceivedEmail } from '../emails/band-application-received-email';
import { BandApplicationAcceptedEmail } from '../emails/band-application-accepted-email';
import { BandApplicationRejectedEmail } from '../emails/band-application-rejected-email';

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

    const result = await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to: message.email,
        subject: 'Verify Your Email - Sound Connect',
        html,
        text
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(result));

    if (result.error) {
        console.error('[EMAIL] Failed to send verification email:', result.error);
        throw new Error(`Failed to send verification email: ${result.error.message}`);
    }

    console.log(`[EMAIL] Successfully sent verification email to ${message.email} for user ${message.userId}, ID: ${result.data?.id}`);
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

    const result = await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to: message.email,
        subject: 'Reset Your Password - Sound Connect',
        html,
        text
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(result));

    if (result.error) {
        console.error('[EMAIL] Failed to send password reset email:', result.error);
        throw new Error(`Failed to send password reset email: ${result.error.message}`);
    }

    console.log(`[EMAIL] Successfully sent password reset email to ${message.email} for user ${message.userId}, ID: ${result.data?.id}`);
};

const getFollowerEmailText = (actorName: string, actorProfileUrl: string): string => {
    return `
${actorName} started following you

${actorName} is now following you on Sound Connect. Check out their profile to see if you want to follow back!

View Profile: ${actorProfileUrl}

© ${new Date().getFullYear()} Sound Connect. All rights reserved.
    `.trim();
};

export const sendFollowerEmail = async (to: string, actorName: string, actorProfileUrl: string, resendApiKey: string): Promise<void> => {
    const resend = new Resend(resendApiKey);

    const html = await render(
        FollowerEmail({
            actorName,
            actorProfileUrl
        })
    );
    const text = getFollowerEmailText(actorName, actorProfileUrl);

    const result = await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to,
        subject: `${actorName} started following you`,
        html,
        text
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(result));

    if (result.error) {
        console.error('[EMAIL] Failed to send follower email:', result.error);
        throw new Error(`Failed to send follower email: ${result.error.message}`);
    }

    console.log(`[EMAIL] Successfully sent follower email to ${to}, ID: ${result.data?.id}`);
};

const getCommentEmailText = (actorName: string, postContent: string, commentUrl: string): string => {
    return `
${actorName} commented on your post

${actorName} commented on your post: "${postContent}..."

View Comment: ${commentUrl}

© ${new Date().getFullYear()} Sound Connect. All rights reserved.
    `.trim();
};

export const sendCommentEmail = async (
    to: string,
    actorName: string,
    postContent: string,
    commentUrl: string,
    resendApiKey: string
): Promise<void> => {
    const resend = new Resend(resendApiKey);

    const html = await render(
        CommentEmail({
            actorName,
            postContent,
            commentUrl
        })
    );
    const text = getCommentEmailText(actorName, postContent, commentUrl);

    const result = await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to,
        subject: `${actorName} commented on your post`,
        html,
        text
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(result));

    if (result.error) {
        console.error('[EMAIL] Failed to send comment email:', result.error);
        throw new Error(`Failed to send comment email: ${result.error.message}`);
    }

    console.log(`[EMAIL] Successfully sent comment email to ${to}, ID: ${result.data?.id}`);
};

const getBandApplicationReceivedEmailText = (applicantName: string, bandName: string, applicationUrl: string): string => {
    return `
New application to join ${bandName}

${applicantName} has applied to join ${bandName}. Review their application and profile to decide if they're a good fit for the band.

View Application: ${applicationUrl}

© ${new Date().getFullYear()} Sound Connect. All rights reserved.
    `.trim();
};

export const sendBandApplicationReceivedEmail = async (
    to: string,
    applicantName: string,
    bandName: string,
    applicationUrl: string,
    resendApiKey: string
): Promise<void> => {
    const resend = new Resend(resendApiKey);

    const html = await render(
        BandApplicationReceivedEmail({
            applicantName,
            bandName,
            applicationUrl
        })
    );
    const text = getBandApplicationReceivedEmailText(applicantName, bandName, applicationUrl);

    const result = await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to,
        subject: `New application to join ${bandName}`,
        html,
        text
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(result));

    if (result.error) {
        console.error('[EMAIL] Failed to send band application received email:', result.error);
        throw new Error(`Failed to send band application received email: ${result.error.message}`);
    }

    console.log(`[EMAIL] Successfully sent band application received email to ${to}, ID: ${result.data?.id}`);
};

const getBandApplicationAcceptedEmailText = (bandName: string, bandUrl: string): string => {
    return `
You've been accepted to ${bandName}!

Great news! Your application to join ${bandName} has been accepted. You're now a member of the band!

View Band: ${bandUrl}

© ${new Date().getFullYear()} Sound Connect. All rights reserved.
    `.trim();
};

export const sendBandApplicationAcceptedEmail = async (to: string, bandName: string, bandUrl: string, resendApiKey: string): Promise<void> => {
    const resend = new Resend(resendApiKey);

    const html = await render(
        BandApplicationAcceptedEmail({
            bandName,
            bandUrl
        })
    );
    const text = getBandApplicationAcceptedEmailText(bandName, bandUrl);

    const result = await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to,
        subject: `You've been accepted to ${bandName}!`,
        html,
        text
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(result));

    if (result.error) {
        console.error('[EMAIL] Failed to send band application accepted email:', result.error);
        throw new Error(`Failed to send band application accepted email: ${result.error.message}`);
    }

    console.log(`[EMAIL] Successfully sent band application accepted email to ${to}, ID: ${result.data?.id}`);
};

const getBandApplicationRejectedEmailText = (bandName: string, feedbackMessage: string | undefined, discoverBandsUrl: string): string => {
    return `
Update on your application to ${bandName}

Thanks for your interest in ${bandName}. After reviewing your application, they've decided not to move forward at this time.

${feedbackMessage ? `Feedback: ${feedbackMessage}\n\n` : ''}Don't be discouraged! There are many other bands looking for talented musicians like you. Keep exploring and you'll find the perfect match.

Find More Bands: ${discoverBandsUrl}

© ${new Date().getFullYear()} Sound Connect. All rights reserved.
    `.trim();
};

export const sendBandApplicationRejectedEmail = async (
    to: string,
    bandName: string,
    feedbackMessage: string | undefined,
    discoverBandsUrl: string,
    resendApiKey: string
): Promise<void> => {
    const resend = new Resend(resendApiKey);

    const html = await render(
        BandApplicationRejectedEmail({
            bandName,
            feedbackMessage,
            discoverBandsUrl
        })
    );
    const text = getBandApplicationRejectedEmailText(bandName, feedbackMessage, discoverBandsUrl);

    const result = await resend.emails.send({
        from: 'Sound Connect <onboarding@resend.dev>',
        to,
        subject: `Update on your application to ${bandName}`,
        html,
        text
    });

    console.log('[EMAIL] Resend API response:', JSON.stringify(result));

    if (result.error) {
        console.error('[EMAIL] Failed to send band application rejected email:', result.error);
        throw new Error(`Failed to send band application rejected email: ${result.error.message}`);
    }

    console.log(`[EMAIL] Successfully sent band application rejected email to ${to}, ID: ${result.data?.id}`);
};
