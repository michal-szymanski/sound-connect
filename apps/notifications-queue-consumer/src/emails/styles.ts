export const colors = {
    primaryBlue: '#4A90E2',
    primaryBlueDark: '#3A7BC8',
    primaryBlueLight: '#E8F2FC',
    primaryBlueLighter: '#F0F7FE',

    successGreen: '#10B981',
    successGreenLight: '#ECFDF5',
    successGreenDark: '#065F46',

    warningAmber: '#F59E0B',
    warningAmberLight: '#FEF3E3',
    warningAmberDark: '#92400E',

    infoBlue: '#3B82F6',
    infoBlueLight: '#EFF6FF',
    infoBlueDark: '#1E40AF',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    backgroundLight: '#F8FAFC',
    backgroundWhite: '#FFFFFF',
    white: '#FFFFFF'
} as const;

export const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const typography = {
    h1: {
        fontSize: '32px',
        fontWeight: '700',
        lineHeight: '1.2',
        letterSpacing: '-0.02em',
        margin: '0'
    },
    h2: {
        fontSize: '26px',
        fontWeight: '600',
        lineHeight: '1.3',
        letterSpacing: '-0.01em',
        margin: '0'
    },
    body: {
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.6'
    },
    bodyLarge: {
        fontSize: '17px',
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
    },
    tagline: {
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
    }
} as const;

export const spacing = {
    headerPaddingVertical: '36px',
    contentPadding: '40px',
    contentPaddingMobile: '24px',
    buttonPaddingVertical: '16px',
    buttonPaddingHorizontal: '40px'
} as const;

export const button = {
    minHeight: '52px',
    borderRadius: '10px',
    backgroundColor: colors.primaryBlue,
    color: colors.white,
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
    paddingTop: spacing.buttonPaddingVertical,
    paddingBottom: spacing.buttonPaddingVertical,
    paddingLeft: spacing.buttonPaddingHorizontal,
    paddingRight: spacing.buttonPaddingHorizontal,
    boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
} as const;
