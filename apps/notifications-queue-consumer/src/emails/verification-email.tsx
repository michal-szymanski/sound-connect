import React from 'react';
import { Html, Head, Body, Text, Hr } from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';
import { EmailButton } from './components/email-button';
import { EmailFallbackLink } from './components/email-fallback-link';
import { EmailContainer } from './components/email-container';
import { colors, typography, fontFamily } from './styles';

type Props = {
    name: string;
    verificationUrl: string;
};

export function VerificationEmail({ name, verificationUrl }: Props) {
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
                        Welcome to Sound Connect, {name}! 🎵
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 24px 0',
                            fontFamily
                        }}
                    >
                        We're excited to have you join our community of musicians! To get started, please verify your email address by clicking the button
                        below.
                    </Text>
                    <EmailButton href={verificationUrl}>Verify Email Address</EmailButton>
                    <EmailFallbackLink url={verificationUrl} />
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
                            margin: '0',
                            fontFamily
                        }}
                    >
                        If you didn't create a Sound Connect account, you can safely ignore this email.
                    </Text>
                </EmailContainer>
                <EmailFooter />
            </Body>
        </Html>
    );
}
