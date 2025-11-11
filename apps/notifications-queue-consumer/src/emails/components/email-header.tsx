import React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, typography, fontFamily, spacing } from '../styles';

export function EmailHeader() {
    return (
        <Section
            style={{
                backgroundColor: colors.primaryBlue,
                paddingTop: spacing.headerPaddingVertical,
                paddingBottom: spacing.headerPaddingVertical,
                paddingLeft: '20px',
                paddingRight: '20px',
                textAlign: 'center'
            }}
        >
            <Text
                style={{
                    ...typography.h1,
                    color: colors.white,
                    fontFamily
                }}
            >
                🎵 Sound Connect
            </Text>
        </Section>
    );
}
