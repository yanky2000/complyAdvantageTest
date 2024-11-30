export const PAGINATION_ITEMS_PER_PAGE = [5, 10, 15, 25, 50];

export const BADGE_STATUS_COLORS_MAP: Record<string, string> = {
  CASE_NOT_STARTED: 'info',
  CASE_IN_PROGRESS: 'primary',
  CASE_ON_HOLD: 'warning',
  CASE_RESOLVED_NO_RISK_DETECTED: 'success',
  CASE_RESOLVED_RISK_DETECTED: 'danger',
};

export const BADGE_STATUS_MAP: Record<string, string> = {
  CASE_NOT_STARTED: 'Not Started',
  CASE_IN_PROGRESS: 'In Progress',
  CASE_ON_HOLD: 'On Hold',
  CASE_RESOLVED_NO_RISK_DETECTED: 'Resolved: No Risk Detected ',
  CASE_RESOLVED_RISK_DETECTED: 'Resolved: Risk Detected',
};
