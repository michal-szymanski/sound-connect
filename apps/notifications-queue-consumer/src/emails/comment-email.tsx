import React from 'react';
import { Html, Head, Body, Text, Section } from '@react-email/components';
import { EmailHeader } from './components/email-header';
import { EmailFooter } from './components/email-footer';
import { EmailButton } from './components/email-button';
import { EmailContainer } from './components/email-container';
import { EmailFallbackLink } from './components/email-fallback-link';
import { colors, typography, fontFamily } from './styles';

type Props = {
    actorName: string;
    postContent: string;
    commentUrl: string;
};

export function CommentEmail({ actorName, postContent, commentUrl }: Props) {
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
                        💬 {actorName} commented on your post
                    </Text>
                    <Text
                        style={{
                            ...typography.body,
                            color: colors.textSecondary,
                            margin: '0 0 20px 0',
                            fontFamily
                        }}
                    >
                        {actorName} commented on your post:
                    </Text>
                    <Section
                        style={{
                            backgroundColor: colors.backgroundWhite,
                            border: `1px solid ${colors.border}`,
                            borderLeft: `4px solid ${colors.primaryBlue}`,
                            borderRadius: '8px',
                            padding: '16px 20px',
                            margin: '0 0 32px 0'
                        }}
                    >
                        <Text
                            style={{
                                ...typography.body,
                                color: colors.textPrimary,
                                margin: '0',
                                fontFamily,
                                fontStyle: 'italic'
                            }}
                        >
                            "{postContent}..."
                        </Text>
                    </Section>
                    <EmailButton href={commentUrl}>View Comment</EmailButton>
                    <EmailFallbackLink url={commentUrl} />
                </EmailContainer>
                <EmailFooter />
            </Body>
        </Html>
    );
}
