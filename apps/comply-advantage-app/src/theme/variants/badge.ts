import { ThemeUIStyleObject } from 'theme-ui';

export type BadgeVariants =
  | 'default'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info';

export const badgeVariants: Record<BadgeVariants, ThemeUIStyleObject> = {
  default: {
    borderRadius: '4px',
    px: 2,
    py: 1,
    display: 'inline-block',
  },
  primary: {
    variant: 'badges.default',
    bg: 'accent400',
    color: 'textWhite',
  },
  danger: {
    variant: 'badges.default',
    bg: 'bgNegative',
  },
  success: {
    variant: 'badges.default',
    bg: 'bgPositive',
  },
  warning: {
    variant: 'badges.default',
    bg: 'brand500',
    color: 'textBase',
  },
  info: {
    variant: 'badges.default',
    bg: 'neutral100',
  },
};
