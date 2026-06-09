import type { ViewStyle } from 'react-native';

export const colors = {
  surface: '#faf9fd',
  background: '#faf9fd',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f4f3f7',
  surfaceContainer: '#efedf1',
  surfaceContainerHigh: '#e9e7eb',
  onSurface: '#1a1c1e',
  onSurfaceVariant: '#43474e',
  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  primary: '#002045',
  primaryContainer: '#1a365d',
  primaryFixed: '#d6e3ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#86a0cd',
  secondary: '#0a6c44',
  secondaryContainer: '#9ff5c1',
  onSecondaryContainer: '#167249',
  warning: '#d69e2e',
  warningLight: '#fff1cf',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  passValid: '#805ad5',
  passValidLight: '#f0e8ff',
  passInvalid: '#718096',
  passInvalidLight: '#edf2f7',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  headlineLg: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  headlineMd: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyLgStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  bodyMd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodyMdStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelBold: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
  codeDisplay: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
};

export const shadows = {
  card: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  } as ViewStyle,
  button: {
    boxShadow: '0px 4px 12px rgba(0, 32, 69, 0.2)',
  } as ViewStyle,
};

export const commonStyles = {
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
    ...shadows.card,
  } as ViewStyle,
  primaryActionCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.button,
  } as ViewStyle,
  secondaryActionCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.card,
  } as ViewStyle,
  segmentedControl: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 4,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
  } as ViewStyle,
};
