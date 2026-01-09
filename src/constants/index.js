/**
 * Central export for all constants
 * Import from this file for convenience
 */

export * from './audioConstants.js';
export * from './visualConstants.js';
export * from './performanceConstants.js';

/**
 * Application Constants
 */
export const APP_CONFIG = {
  /** Application name */
  NAME: 'CursorCam',
  /** Application version */
  VERSION: '2.0.0',
  /** Author */
  AUTHOR: 'Rolan Lobo',
  /** GitHub repository */
  REPO_URL: 'https://github.com/Mrtracker-new/CursorCam',
};

/**
 * UI Constants
 */
export const UI_CONFIG = {
  /** Control panel collapse animation duration (ms) */
  PANEL_ANIMATION_DURATION: 300,
  /** Performance monitor update interval (ms) */
  PERF_UPDATE_INTERVAL: 100,
  /** Toast notification duration (ms) */
  TOAST_DURATION: 3000,
};

/**
 * Storage Keys (for localStorage)
 */
export const STORAGE_KEYS = {
  /** User preferences */
  PREFERENCES: 'cursorcam_preferences',
  /** Saved presets */
  PRESETS: 'cursorcam_presets',
  /** Last pattern used */
  LAST_PATTERN: 'cursorcam_last_pattern',
  /** Performance settings */
  PERFORMANCE: 'cursorcam_performance',
};
