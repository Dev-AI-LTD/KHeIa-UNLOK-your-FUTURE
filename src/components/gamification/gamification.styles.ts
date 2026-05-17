import { StyleSheet } from 'react-native';
import { colors, spacing, ios, iosText, radius } from '@/theme';

export const gamificationStyles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ios.layout.rowHeight,
    gap: spacing.sm,
  },
  statIcon: {
    fontSize: ios.icon.md,
  },
  statText: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: colors.dark.text,
  },
  /** Use on GlassCard only when overriding default padding (GlassCard already has cardPadding). */
  glassInsetCard: {},
  list: {
    gap: spacing.fieldGap,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ios.layout.rowHeight,
    paddingVertical: spacing.sm,
  },
  listRowLabel: {
    flex: 1,
    ...iosText('body'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  listRowAmount: {
    ...iosText('headline'),
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  listRowDate: {
    ...iosText('footnote'),
    color: colors.dark.muted,
  },
  amountEarn: {
    color: colors.dark.success,
  },
  amountRedeem: {
    color: colors.dark.danger,
  },
  emptyText: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    textAlign: 'left',
  },
  sectionContainer: {
    marginTop: spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.fieldGap,
  },
  sectionTitle: {
    ...iosText('title3'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  sectionLink: {
    minHeight: ios.layout.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  sectionLinkText: {
    ...iosText('headline'),
    color: colors.dark.primary,
    fontWeight: '600',
  },
  countdownCard: {
    alignItems: 'center',
  },
  countdownLabel: {
    ...iosText('subhead'),
    color: colors.dark.muted,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  countdownNumber: {
    ...iosText('title1'),
    color: colors.dark.primary,
    textAlign: 'center',
  },
  countdownSuffix: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  countdownCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ios.layout.minTouchTarget,
    gap: spacing.sm,
  },
  countdownCompactLabel: {
    ...iosText('subhead'),
    color: colors.dark.muted,
  },
  countdownCompactDays: {
    ...iosText('headline'),
    fontWeight: '700',
    color: colors.dark.primary,
  },
  countdownDual: {
    flexDirection: 'row',
    gap: spacing.fieldGap,
  },
  countdownDualCard: {
    flex: 1,
    alignItems: 'center',
  },
  countdownDualLabel: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  countdownDualNumber: {
    ...iosText('title2'),
    color: colors.dark.primary,
    textAlign: 'center',
  },
  countdownDualSuffix: {
    ...iosText('footnote'),
    color: colors.dark.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  missionText: {
    ...iosText('body'),
    color: colors.dark.text,
    textAlign: 'left',
  },
  badgeChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  badgeChipText: {
    ...iosText('footnote'),
    fontWeight: '600',
    color: colors.dark.text,
  },
  rewardCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: ios.layout.rowHeight,
  },
  rewardName: {
    flex: 1,
    ...iosText('body'),
    fontWeight: '600',
    color: colors.dark.text,
    textAlign: 'left',
    marginRight: spacing.sm,
  },
  rewardCost: {
    ...iosText('subhead'),
    color: colors.dark.muted,
  },
});
