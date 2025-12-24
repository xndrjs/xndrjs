/**
 * DevTools Theme
 * Centralized design tokens for consistent styling
 */

export const colors = {
  // Backgrounds
  bgPrimary: "#1e1e1e",
  bgSecondary: "#2d2d2d",
  bgTertiary: "#252526",
  bgHover: "#37373d",
  bgActive: "#37373d",

  // Borders
  border: "#3c3c3c",
  borderLight: "#4c4c4c",

  // Text
  textPrimary: "#d4d4d4",
  textSecondary: "#969696",
  textMuted: "#808080",

  // Accent colors
  accent: "#25c2a0",
  accentHover: "#4ec9b0",
  accentText: "#1e1e1e",

  // Semantic colors
  success: "#4ec9b0",
  warning: "#ce9178",
  info: "#569cd6",
  error: "#f48771",

  // Code colors
  codeString: "#ce9178",
  codeKeyword: "#569cd6",
  codeFunction: "#4ec9b0",
  codeComment: "#969696",

  // Special colors for badges and highlights
  badgeSuccessBg: "#1a2f1a", // Dark green background for success badges
  badgeWarningBg: "#3a2a1a", // Dark brown background for warning/error badges
  badgeSuccessBgAlpha: "rgba(78, 201, 176, 0.1)", // Success color with 10% opacity
  timelineInstance: "#9cdcfe", // Light blue for timeline instance names
  buttonPrimary: "#0e639c", // Primary button blue
  white: "#ffffff",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  // Additional spacing values for specific use cases
  xxl: "32px",
  xxxl: "40px",
  // Small gaps and borders
  gapXs: "2px",
  gapSm: "6px",
} as const;

export const typography = {
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMono:
    "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace",

  fontSize: {
    xs: "11px",
    sm: "12px",
    base: "13px",
    md: "14px",
    lg: "16px",
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const borderRadius = {
  sm: "3px",
  md: "4px",
  lg: "6px",
} as const;

// Common dimensions
export const dimensions = {
  sidebarWidth: "250px",
  sidebarWidthNarrow: "200px",
  resizeHandleHeight: "4px",
  resizeHandleWidth: "4px",
  borderWidth: "1px",
  borderWidthThick: "2px",
  borderWidthThicker: "3px",
  checkboxSize: "16px",
  iconSizeSmall: "10px",
  iconSizeMedium: "20px",
  iconSizeLarge: "28px",
  minWidthTime: "80px",
  minWidthInstance: "120px",
  minWidthEvent: "150px",
  collapsedHeight: "40px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.1)",
  md: "0 2px 4px rgba(0, 0, 0, 0.15)",
  lg: "0 4px 8px rgba(0, 0, 0, 0.2)",
} as const;

export const transitions = {
  fast: "0.15s ease",
  base: "0.2s ease",
  slow: "0.3s ease",
} as const;

/**
 * Helper to create consistent button styles
 */
export const buttonStyles = {
  base: {
    background: "transparent",
    border: "none",
    color: colors.textPrimary,
    cursor: "pointer",
    fontSize: typography.fontSize.base,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.sm,
    transition: `all ${transitions.base}`,
  } as const,

  hover: {
    backgroundColor: colors.bgHover,
  } as const,

  active: {
    backgroundColor: colors.bgActive,
  } as const,
};

/**
 * Helper to create consistent card/panel styles
 */
export const cardStyles = {
  base: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  } as const,

  bordered: {
    border: `1px solid ${colors.border}`,
  } as const,
};

/**
 * Helper to create consistent badge styles
 */
export const badgeStyles = {
  base: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.bgSecondary,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
  } as const,

  accent: {
    backgroundColor: colors.accent,
    color: colors.accentText,
  } as const,

  success: {
    backgroundColor: colors.success,
    color: colors.accentText,
  } as const,
};
