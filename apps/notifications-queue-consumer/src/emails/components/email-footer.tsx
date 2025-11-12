import React from 'react';
import { Section, Text, Link, Hr } from '@react-email/components';
import { colors, typography, fontFamily } from '../styles';

export function EmailFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <Section
            style={{
                backgroundColor: colors.backgroundLight,
                paddingTop: '32px',
                paddingBottom: '32px',
                paddingLeft: '20px',
                paddingRight: '20px',
                borderTop: `1px solid ${colors.border}`
            }}
        >
            <Text
                style={{
                    ...typography.small,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    margin: '0 0 16px 0',
                    fontFamily,
                    fontWeight: '600'
                }}
            >
                Where Musicians Connect
            </Text>
            <Text
                style={{
                    ...typography.small,
                    color: colors.textMuted,
                    textAlign: 'center',
                    margin: '0 0 20px 0',
                    fontFamily
                }}
            >
                <Link
                    href="https://soundconnect.app"
                    style={{
                        color: colors.primaryBlue,
                        textDecoration: 'none'
                    }}
                >
                    Home
                </Link>
                {' · '}
                <Link
                    href="https://soundconnect.app/help"
                    style={{
                        color: colors.primaryBlue,
                        textDecoration: 'none'
                    }}
                >
                    Help
                </Link>
                {' · '}
                <Link
                    href="https://soundconnect.app/privacy"
                    style={{
                        color: colors.primaryBlue,
                        textDecoration: 'none'
                    }}
                >
                    Privacy
                </Link>
            </Text>
            <Text
                style={{
                    ...typography.tiny,
                    color: colors.textMuted,
                    textAlign: 'center',
                    margin: '0',
                    fontFamily
                }}
            >
                © {currentYear} Sound Connect. All rights reserved.
            </Text>
        </Section>
    );
}
