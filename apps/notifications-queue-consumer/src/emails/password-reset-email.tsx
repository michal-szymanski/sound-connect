import React from 'react';
import { Html, Head, Body, Text, Hr } from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';
import { EmailButton } from './components/email-button';
import { EmailFallbackLink } from './components/email-fallback-link';
import { EmailContainer } from './components/email-container';
import { InfoBox } from './components/info-box';
import { colors, typography, fontFamily } from './styles';

type Props = {
    name: string;
    resetUrl: string;
};

export function PasswordResetEmail({ name, resetUrl }: Props) {
    return (
        <Html>
            <Head />
            <Body
                style={{
                    backgroundColor: colors.backgroundLight,
                    fontFamily,
                    padding: '20px'
                }}
            >
                <EmailHeader />
                <EmailContainer>
                    <Text
                        style={{
                            ...typography.h2,
                            color: colors.textPrimary,
                            marginTop: '0',
                            marginBottom: '12px',
                            fontFamily,
                            textAlign: 'center'
                        }}
                    >
                        🔐 Reset Your Password
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 8px 0',
                            fontFamily,
                            textAlign: 'center'
                        }}
                    >
                        We received a request to reset your password
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 28px 0',
                            fontFamily
                        }}
                    >
                        Hi {name}, click the button below to create a new password for your Sound Connect account. This link will expire in 1 hour for security purposes.
                    </Text>
                    <EmailButton href={resetUrl}>Reset My Password</EmailButton>
                    <InfoBox variant="info" icon="⏱️">
                        This link expires in 1 hour
                    </InfoBox>
                    <Text
                        style={{
                            ...typography.small,
                            color: colors.textMuted,
                            margin: '24px 0 8px 0',
                            fontFamily
                        }}
                    >
                        If the button doesn't work, copy and paste this link into your browser:
                    </Text>
                    <Text
                        style={{
                            ...typography.small,
                            color: colors.primaryBlue,
                            backgroundColor: colors.backgroundLight,
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            wordBreak: 'break-all',
                            margin: '0 0 32px 0',
                            fontFamily
                        }}
                    >
                        {resetUrl}
                    </Text>
                    <Hr
                        style={{
                            borderColor: colors.border,
                            margin: '32px 0 24px 0'
                        }}
                    />
                    <Text
                        style={{
                            ...typography.small,
                            color: colors.textMuted,
                            margin: '0 0 16px 0',
                            fontFamily
                        }}
                    >
                        🛡️ Didn't request a password reset? You can safely ignore this email. Your password will remain unchanged.
                    </Text>
                    <Text
                        style={{
                            ...typography.tiny,
                            color: colors.textMuted,
                            margin: '0',
                            fontFamily
                        }}
                    >
                        Security tip: Never share your password with anyone. Sound Connect will never ask for your password via email.
                    </Text>
                </EmailContainer>
                <EmailFooter />
            </Body>
        </Html>
    );
}
