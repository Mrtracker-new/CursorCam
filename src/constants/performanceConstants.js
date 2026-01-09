/**
 * Performance and Optimization Constants
 * Configuration for performance monitoring and optimization
 */

/**
 * Performance Targets
 */
export const PERFORMANCE_TARGETS = {
  /** Target FPS for smooth animation */
  TARGET_FPS: 60,
  /** Minimum acceptable FPS */
  MIN_FPS: 30,
  /** FPS threshold for performance warning */
  WARNING_FPS: 45,
  /** Target frame time (milliseconds) */
  TARGET_FRAME_TIME: 16.67, // 1000ms / 60fps
  /** Maximum acceptable frame time */
  MAX_FRAME_TIME: 33.33, // 1000ms / 30fps
};

/**
 * Performance Monitoring
 */
export const PERFORMANCE_MONITORING = {
  /** FPS calculation sample size (frames) */
  FPS_SAMPLE_SIZE: 60,
  /** Performance check interval (frames) */
  CHECK_INTERVAL: 60,
  /** Auto-optimization enabled */
  AUTO_OPTIMIZE: true,
  /** Node reduction step when performance drops */
  NODE_REDUCTION_STEP: 50,
  /** Minimum nodes before stopping optimization */
  MIN_OPTIMIZED_NODES: 100,
};

/**
 * Quality Levels
 */
export const QUALITY_LEVELS = {
  /** Ultra quality settings */
  ULTRA: {
    maxNodes: 2000,
    maxEdges: 20000,
    enableGlow: true,
    enableTrails: true,
    particleCount: 500,
  },
  /** High quality settings */
  HIGH: {
    maxNodes: 1000,
    maxEdges: 10000,
    enableGlow: true,
    enableTrails: true,
    particleCount: 300,
  },
  /** Medium quality settings */
  MEDIUM: {
    maxNodes: 500,
    maxEdges: 5000,
    enableGlow: true,
    enableTrails: false,
    particleCount: 150,
  },
  /** Low quality settings (mobile/performance mode) */
  LOW: {
    maxNodes: 250,
    maxEdges: 2500,
    enableGlow: false,
    enableTrails: false,
    particleCount: 75,
  },
};

/**
 * Optimization Strategies
 */
export const OPTIMIZATION = {
  /** Enable spatial partitioning for edge detection */
  SPATIAL_PARTITIONING: true,
  /** Grid cell size for spatial partitioning */
  GRID_CELL_SIZE: 150,
  /** Enable object pooling for particles */
  OBJECT_POOLING: true,
  /** Pool size for reusable objects */
  POOL_SIZE: 1000,
  /** Throttle edge calculations */
  THROTTLE_EDGES: true,
  /** Edge calculation interval (frames) */
  EDGE_CALC_INTERVAL: 1,
};

/**
 * Memory Management
 */
export const MEMORY_CONFIG = {
  /** Maximum array buffer size */
  MAX_BUFFER_SIZE: 8192,
  /** History buffer size for analytics */
  HISTORY_SIZE: 100,
  /** Clear history interval (frames) */
  CLEAR_INTERVAL: 300,
  /** Enable garbage collection hints */
  GC_HINTS: true,
};

/**
 * Device-Specific Settings
 */
export const DEVICE_CONFIG = {
  /** Mobile device detection */
  IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ),
  /** High DPI / Retina display */
  IS_RETINA: window.devicePixelRatio > 1,
  /** Touch-enabled device */
  HAS_TOUCH: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  /** Reduced motion preference */
  PREFERS_REDUCED_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

/**
 * Auto-quality based on device
 */
export const getRecommendedQuality = () => {
  if (DEVICE_CONFIG.IS_MOBILE) {
    return QUALITY_LEVELS.LOW;
  }
  if (!DEVICE_CONFIG.IS_RETINA) {
    return QUALITY_LEVELS.MEDIUM;
  }
  return QUALITY_LEVELS.HIGH;
};
