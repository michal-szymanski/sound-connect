import React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, typography, fontFamily } from '../styles';

type Props = {
    children: string;
    icon?: string;
    variant?: 'info' | 'warning' | 'success';
};

const variantStyles = {
    info: {
        backgroundColor: colors.infoBlueLight,
        borderColor: colors.infoBlue,
        textColor: colors.infoBlueDark
    },
    warning: {
        backgroundColor: colors.warningAmberLight,
        borderColor: colors.warningAmber,
        textColor: colors.warningAmberDark
    },
    success: {
        backgroundColor: colors.successGreenLight,
        borderColor: colors.successGreen,
        textColor: colors.successGreenDark
    }
};

export function InfoBox({ children, icon, variant = 'info' }: Props) {
    const styles = variantStyles[variant];

    return (
        <Section
            style={{
                backgroundColor: styles.backgroundColor,
                borderLeft: `4px solid ${styles.borderColor}`,
                borderRadius: '8px',
                padding: '16px 20px',
                margin: '24px 0'
            }}
        >
            <Text
                style={{
                    ...typography.small,
                    color: styles.textColor,
                    margin: '0',
                    fontFamily,
                    fontWeight: '600'
                }}
            >
                {icon && `${icon} `}
                {children}
            </Text>
        </Section>
    );
}
