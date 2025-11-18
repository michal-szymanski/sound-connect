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
    feedbackMessage?: string;
    discoverBandsUrl: string;
};

export function BandApplicationRejectedEmail({ bandName, feedbackMessage, discoverBandsUrl }: Props) {
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
                        Update on your application to {bandName}
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 24px 0',
                            fontFamily
                        }}
                    >
                        Thanks for your interest in {bandName}. After reviewing your application, they've decided not to move forward at this time.
                    </Text>
                    {feedbackMessage && (
                        <InfoBox variant="info" icon="💬">
                            {feedbackMessage}
                        </InfoBox>
                    )}
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 32px 0',
                            fontFamily
                        }}
                    >
                        Don't be discouraged! There are many other bands looking for talented musicians like you. Keep exploring and you'll find the perfect
                        match.
                    </Text>
                    <EmailButton href={discoverBandsUrl}>Find More Bands</EmailButton>
                    <EmailFallbackLink url={discoverBandsUrl} />
                </EmailContainer>
                <EmailFooter />
            </Body>
        </Html>
    );
}
