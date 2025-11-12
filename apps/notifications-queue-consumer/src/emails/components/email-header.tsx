import React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, typography, fontFamily, spacing } from '../styles';

export function EmailHeader() {
    return (
        <Section
            style={{
                background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.primaryBlueDark} 100%)`,
                paddingTop: spacing.headerPaddingVertical,
                paddingBottom: spacing.headerPaddingVertical,
                paddingLeft: '20px',
                paddingRight: '20px',
                textAlign: 'center',
                borderBottom: `3px solid ${colors.primaryBlueDark}`
            }}
        >
            <Text
                style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: colors.white,
                    fontFamily,
                    margin: '0 0 6px 0',
                    lineHeight: '1.2'
                }}
            >
                Sound Connect
            </Text>
            <Text
                style={{
                    ...typography.tagline,
                    color: colors.white,
                    fontFamily,
                    margin: '0',
                    opacity: '0.9'
                }}
            >
                Where Musicians Connect
            </Text>
        </Section>
    );
}
