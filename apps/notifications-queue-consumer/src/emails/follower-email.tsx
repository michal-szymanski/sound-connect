import React from 'react';
import { Html, Head, Body, Text } from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';
import { EmailButton } from './components/email-button';
import { EmailContainer } from './components/email-container';
import { EmailFallbackLink } from './components/email-fallback-link';
import { colors, typography, fontFamily } from './styles';

type Props = {
    actorName: string;
    actorProfileUrl: string;
};

export function FollowerEmail({ actorName, actorProfileUrl }: Props) {
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
                        🎵 {actorName} started following you
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 32px 0',
                            fontFamily
                        }}
                    >
                        {actorName} is now following you on Sound Connect. Check out their profile to see if you want to follow back!
                    </Text>
                    <EmailButton href={actorProfileUrl}>View Profile</EmailButton>
                    <EmailFallbackLink url={actorProfileUrl} />
                </EmailContainer>
                <EmailFooter />
            </Body>
        </Html>
    );
}
