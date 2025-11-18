import React from 'react';
import { Html, Head, Body, Text } from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';
import { EmailButton } from './components/email-button';
import { EmailContainer } from './components/email-container';
import { InfoBox } from './components/info-box';
import { EmailFallbackLink } from './components/email-fallback-link';
import { colors, typography, fontFamily } from './styles';

type Props = {
    bandName: string;
    bandUrl: string;
};

export function BandApplicationAcceptedEmail({ bandName, bandUrl }: Props) {
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
                        🎉 You've been accepted to {bandName}!
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 24px 0',
                            fontFamily
                        }}
                    >
                        Great news! Your application to join {bandName} has been accepted. You're now a member of the band!
                    </Text>
                    <InfoBox variant="success" icon="✅">
                        You are now a member of {bandName}
                    </InfoBox>
                    <EmailButton href={bandUrl}>View Band</EmailButton>
                    <EmailFallbackLink url={bandUrl} />
                </EmailContainer>
                <EmailFooter />
            </Body>
        </Html>
    );
}
