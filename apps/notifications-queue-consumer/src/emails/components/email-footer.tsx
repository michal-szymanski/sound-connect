import React from 'react';
import { Section, Text, Link, Hr } from '@react-email/components';
import { colors, typography, fontFamily } from '../styles';

export function EmailFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <Section
            style={{
                paddingTop: '32px',
                paddingBottom: '32px',
                paddingLeft: '20px',
                paddingRight: '20px'
            }}
        >
            <Hr
                style={{
                    borderColor: colors.border,
                    margin: '0 0 24px 0'
                }}
            />
            <Text
                style={{
                    ...typography.small,
                    color: colors.textMuted,
                    textAlign: 'center',
                    margin: '0 0 16px 0',
                    fontFamily
                }}
            >
                Where Musicians Connect 🎵
            </Text>
            <Text
                style={{
                    ...typography.small,
                    color: colors.textMuted,
                    textAlign: 'center',
                    margin: '0 0 16px 0',
                    fontFamily
                }}
            >
                <Link
                    href="https://soundconnect.app"
                    style={{
                        color: colors.textMuted,
                        textDecoration: 'none'
                    }}
                >
                    Home
                </Link>
                {' · '}
                <Link
                    href="https://soundconnect.app/help"
                    style={{
                        color: colors.textMuted,
                        textDecoration: 'none'
                    }}
                >
                    Help
                </Link>
                {' · '}
                <Link
                    href="https://soundconnect.app/privacy"
                    style={{
                        color: colors.textMuted,
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
