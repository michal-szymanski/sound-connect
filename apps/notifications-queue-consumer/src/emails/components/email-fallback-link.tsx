import React from 'react';
import { Text, Link } from '@react-email/components';
import { colors, typography, fontFamily } from '../styles';

type Props = {
    url: string;
};

export function EmailFallbackLink({ url }: Props) {
    return (
        <>
            <Text
                style={{
                    ...typography.small,
                    color: colors.textSecondary,
                    margin: '24px 0 8px 0',
                    fontFamily
                }}
            >
                Or copy and paste this link:
            </Text>
            <Text
                style={{
                    ...typography.small,
                    color: colors.primaryBlue,
                    backgroundColor: colors.backgroundLight,
                    padding: '12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    wordBreak: 'break-all',
                    margin: '0',
                    fontFamily
                }}
            >
                <Link
                    href={url}
                    style={{
                        color: colors.primaryBlue,
                        textDecoration: 'none'
                    }}
                >
                    {url}
                </Link>
            </Text>
        </>
    );
}
