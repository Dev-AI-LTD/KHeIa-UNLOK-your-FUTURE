import { ios, iosText, type IosTextVariant } from './ios';

/**
 * Typography tokens — Apple HIG (SF Pro via System on React Native).
 * Prefer iosText('body' | 'headline' | ...) in StyleSheet.
 */
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  /** Semantic sizes aligned with iOS text styles */
  size: {
    caption2: ios.typography.caption2.fontSize,
    caption1: ios.typography.caption1.fontSize,
    footnote: ios.typography.footnote.fontSize,
    subhead: ios.typography.subhead.fontSize,
    callout: ios.typography.callout.fontSize,
    body: ios.typography.body.fontSize,
    headline: ios.typography.headline.fontSize,
    title3: ios.typography.title3.fontSize,
    title2: ios.typography.title2.fontSize,
    title1: ios.typography.title1.fontSize,
    largeTitle: ios.typography.largeTitle.fontSize,
    /** Legacy aliases */
    xs: ios.typography.footnote.fontSize,
    sm: ios.typography.subhead.fontSize,
    md: ios.typography.body.fontSize,
    lg: ios.typography.title3.fontSize,
    xl: ios.typography.title2.fontSize,
    xxl: ios.typography.title1.fontSize,
  },
  iosText,
  variant: ios.typography,
} as const;

export type { IosTextVariant };
