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
                    <Section
                        style={{
                            textAlign: 'center',
                            margin: '0 0 24px 0'
                        }}
                    >
                        <Text
                            style={{
                                display: 'inline-block',
                                backgroundColor: colors.primaryBlueLight,
                                color: colors.primaryBlueDark,
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: `2px solid ${colors.primaryBlue}`,
                                fontSize: '13px',
                                fontWeight: '600',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                margin: '0',
                                fontFamily
                            }}
                        >
                            Welcome
                        </Text>
                    </Section>
                    <Text
                        style={{
                            ...typography.h2,
                            color: colors.textPrimary,
                            marginTop: '0',
                            marginBottom: '20px',
                            fontFamily,
                            textAlign: 'center'
                        }}
                    >
                        Hey {name}, let's verify your email
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 32px 0',
                            fontFamily
                        }}
                    >
                        We're excited to have you join our community of musicians! To get started and unlock all features, please verify your email address by clicking the button below.
                    </Text>
                    <EmailButton href={verificationUrl}>Verify My Email</EmailButton>
                    <Hr
                        style={{
                            borderColor: colors.border,
                            margin: '40px 0 32px 0'
                        }}
                    />
                    <Text
                        style={{
                            ...typography.h2,
                            fontSize: '20px',
                            color: colors.textPrimary,
                            margin: '0 0 20px 0',
                            fontFamily
                        }}
                    >
                        What's next?
                    </Text>
                    <Section
                        style={{
                            margin: '0 0 12px 0'
                        }}
                    >
                        <Text
                            style={{
                                ...typography.body,
                                color: colors.textSecondary,
                                margin: '0',
                                fontFamily
                            }}
                        >
                            👤 <strong style={{ color: colors.textPrimary }}>Complete your profile</strong> - Add your instruments, genres, and location
                        </Text>
                    </Section>
                    <Section
                        style={{
                            margin: '0 0 12px 0'
                        }}
                    >
                        <Text
                            style={{
                                ...typography.body,
                                color: colors.textSecondary,
                                margin: '0',
                                fontFamily
                            }}
                        >
                            🔍 <strong style={{ color: colors.textPrimary }}>Find musicians near you</strong> - Search by instrument, genre, and distance
                        </Text>
                    </Section>
                    <Section
                        style={{
                            margin: '0 0 32px 0'
                        }}
                    >
                        <Text
                            style={{
                                ...typography.body,
                                color: colors.textSecondary,
                                margin: '0',
                                fontFamily
                            }}
                        >
                            🎵 <strong style={{ color: colors.textPrimary }}>Start connecting</strong> - Follow musicians, join bands, and share your music
                        </Text>
                    </Section>
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
                        {verificationUrl}
                    </Text>
                    <Hr
                        style={{
                            borderColor: colors.border,
                            margin: '32px 0 20px 0'
                        }}
                    />
                    <Text
                        style={{
                            ...typography.small,
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
