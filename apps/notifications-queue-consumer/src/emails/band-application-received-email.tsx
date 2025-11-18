import React from 'react';
import { Html, Head, Body, Text } from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';
import { EmailButton } from './components/email-button';
import { EmailContainer } from './components/email-container';
import { EmailFallbackLink } from './components/email-fallback-link';
import { colors, typography, fontFamily } from './styles';

type Props = {
    applicantName: string;
    bandName: string;
    applicationUrl: string;
};

export function BandApplicationReceivedEmail({ applicantName, bandName, applicationUrl }: Props) {
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
                        🎸 New application to join {bandName}
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 32px 0',
                            fontFamily
                        }}
                    >
                        {applicantName} has applied to join {bandName}. Review their application and profile to decide if they're a good fit for the band.
                    </Text>
                    <EmailButton href={applicationUrl}>View Application</EmailButton>
                    <EmailFallbackLink url={applicationUrl} />
                </EmailContainer>
                <EmailFooter />
            </Body>
        </Html>
    );
}
