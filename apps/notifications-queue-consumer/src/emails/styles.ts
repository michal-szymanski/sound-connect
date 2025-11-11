export const colors = {
    primaryBlue: '#5A8FD8',
    primaryDark: '#3B7BC4',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    backgroundLight: '#F9FAFB',
    successGreen: '#10B981',
    warningOrange: '#F59E0B',
    white: '#FFFFFF'
} as const;

export const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const typography = {
    h1: {
        fontSize: '28px',
        fontWeight: '700',
        lineHeight: '1.2',
        margin: '0'
    },
    h2: {
        fontSize: '24px',
        fontWeight: '600',
        lineHeight: '1.3',
        margin: '0'
    },
    body: {
        fontSize: '15px',
        fontWeight: '400',
        lineHeight: '1.6'
    },
    small: {
        fontSize: '14px',
        lineHeight: '1.5'
    },
    tiny: {
        fontSize: '13px',
        lineHeight: '1.4'
    }
} as const;

export const spacing = {
    headerPaddingVertical: '32px',
    contentPadding: '40px',
    contentPaddingMobile: '24px',
    buttonPaddingVertical: '14px',
    buttonPaddingHorizontal: '32px'
} as const;

export const button = {
    minHeight: '48px',
    borderRadius: '8px',
    backgroundColor: colors.primaryBlue,
    color: colors.white,
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
    paddingTop: spacing.buttonPaddingVertical,
    paddingBottom: spacing.buttonPaddingVertical,
    paddingLeft: spacing.buttonPaddingHorizontal,
    paddingRight: spacing.buttonPaddingHorizontal
} as const;
