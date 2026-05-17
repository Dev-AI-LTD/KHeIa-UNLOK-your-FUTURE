import { ios } from './ios';

export const sizes = {
  touchTarget: ios.layout.minTouchTarget,
  buttonHeight: ios.layout.buttonHeight,
  rowHeight: ios.layout.rowHeight,
  inputMinHeight: ios.layout.inputMinHeight,
  iconSm: ios.icon.sm,
  iconMd: ios.icon.md,
  iconLg: ios.icon.lg,
} as const;
