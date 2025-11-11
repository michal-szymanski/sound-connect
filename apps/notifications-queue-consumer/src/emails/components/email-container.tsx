import React, { type ReactNode } from 'react';
import { Container, Section } from '@react-email/components';
import { colors, spacing } from '../styles';

type Props = {
    children: ReactNode;
};

export function EmailContainer({ children }: Props) {
    return (
        <Container
            style={{
                maxWidth: '600px',
                margin: '0 auto',
                backgroundColor: colors.white
            }}
        >
            <Section
                style={{
                    backgroundColor: colors.white,
                    paddingTop: spacing.contentPadding,
                    paddingBottom: spacing.contentPadding,
                    paddingLeft: spacing.contentPadding,
                    paddingRight: spacing.contentPadding
                }}
            >
                {children}
            </Section>
        </Container>
    );
}
