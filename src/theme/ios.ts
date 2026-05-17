/**
 * Apple Human Interface Guidelines — design tokens.
 * Spacing: 4pt / 8pt grid. Typography: SF Pro (System on RN).
 */
export const ios = {
  spacing: {
    /** 4pt */
    x1: 4,
    /** 8pt */
    x2: 8,
    /** 12pt */
    x3: 12,
    /** 16pt — standard screen horizontal inset */
    x4: 16,
    /** 20pt — large screens / tablet */
    x5: 20,
    /** 24pt — between content groups */
    x6: 24,
    /** 32pt */
    x8: 32,
    screenHorizontal: 16,
    screenHorizontalLarge: 20,
    fieldGap: 16,
    sectionGap: 24,
    cardPadding: 16,
    /** Space above tab bar / home indicator */
    tabBarClearance: 88,
  },
  layout: {
    minTarget: 44,
    minTouchTarget: 44,
    buttonHeight: 50,
    rowHeight: 44,
    inputMinHeight: 44,
    tabBarContentHeight: 49,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  icon: {
    sm: 18,
    md: 20,
    lg: 22,
    xl: 24,
  },
  typography: {
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700' as const,
      letterSpacing: 0.37,
    },
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: 0.36,
    },
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: 0.35,
    },
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600' as const,
      letterSpacing: 0.38,
    },
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.41,
    },
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400' as const,
      letterSpacing: -0.41,
    },
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400' as const,
      letterSpacing: -0.32,
    },
    subhead: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: -0.24,
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      letterSpacing: -0.08,
    },
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400' as const,
      letterSpacing: 0.07,
    },
  },
} as const;

export type IosTextVariant = keyof typeof ios.typography;

export function iosText(variant: IosTextVariant) {
  return ios.typography[variant];
}
