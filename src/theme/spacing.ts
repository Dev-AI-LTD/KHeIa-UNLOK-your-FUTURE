import { ios } from './ios';

/**
 * Spacing tokens — 4pt / 8pt grid (Apple HIG).
 * screenPadding: 16pt iPhone; use screenPaddingLarge (20pt) on tablets via Screen.
 */
export const spacing = {
  xs: ios.spacing.x1,
  sm: ios.spacing.x2,
  md: ios.spacing.x3,
  lg: ios.spacing.x4,
  xl: ios.spacing.x5,
  xxl: ios.spacing.x6,

  tight: ios.spacing.x1,
  compact: ios.spacing.x2,
  default: ios.spacing.x3,
  relaxed: ios.spacing.x4,
  spacious: ios.spacing.x5,
  large: ios.spacing.x6,
  xlSpace: ios.spacing.x8,
  xxlSpace: 48,

  screenPadding: ios.spacing.screenHorizontal,
  screenPaddingLarge: ios.spacing.screenHorizontalLarge,
  fieldGap: ios.spacing.fieldGap,
  sectionGap: ios.spacing.sectionGap,
  cardPadding: ios.spacing.cardPadding,
  contentBottom: ios.spacing.tabBarClearance,
};
