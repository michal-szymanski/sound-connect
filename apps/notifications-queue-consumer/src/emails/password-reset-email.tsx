import React from 'react';
import { Html, Head, Body, Text, Hr, Section } from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';
import { EmailButton } from './components/email-button';
import { EmailFallbackLink } from './components/email-fallback-link';
import { EmailContainer } from './components/email-container';
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
                            marginBottom: '24px',
                            fontFamily
                        }}
                    >
                        Reset Your Password
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 24px 0',
                            fontFamily
                        }}
                    >
                        Hi {name}, we received a request to reset your password for your Sound Connect account. Click the button below to create a new password.
                    </Text>
                    <Section
                        style={{
                            backgroundColor: '#FEF3C7',
                            border: `1px solid ${colors.warningOrange}`,
                            borderRadius: '8px',
                            padding: '16px',
                            margin: '24px 0'
                        }}
                    >
                        <Text
                            style={{
                                ...typography.small,
                                color: colors.textPrimary,
                                margin: '0',
                                fontFamily,
                                fontWeight: '600'
                            }}
                        >
                            ⏱️ This link expires in 1 hour
                        </Text>
                    </Section>
                    <EmailButton href={resetUrl}>Reset Password</EmailButton>
                    <EmailFallbackLink url={resetUrl} />
                    <Hr
                        style={{
                            borderColor: colors.border,
                            margin: '32px 0 24px 0'
                        }}
                    />
                    <Text
                        style={{
                            ...typography.tiny,
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
