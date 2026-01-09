/**
 * Visual System Constants
 * Central location for all visualization-related configuration values
 */

/**
 * Default Visual Parameters
 */
export const VISUAL_DEFAULTS = {
  /** Default number of nodes */
  NODE_DENSITY: 500,
  /** Minimum nodes */
  MIN_NODES: 100,
  /** Maximum nodes */
  MAX_NODES: 2000,
  /** Default connection range (pixels) */
  CONNECTION_RANGE: 150,
  /** Minimum connection range */
  MIN_CONNECTION_RANGE: 50,
  /** Maximum connection range */
  MAX_CONNECTION_RANGE: 300,
  /** Default color intensity */
  COLOR_AGGRESSION: 1.0,
  /** Minimum color intensity */
  MIN_COLOR_AGGRESSION: 0.5,
  /** Maximum color intensity */
  MAX_COLOR_AGGRESSION: 2.0,
};

/**
 * Node Configuration
 */
export const NODE_CONFIG = {
  /** Default node radius (pixels) */
  DEFAULT_RADIUS: 3,
  /** Minimum node radius */
  MIN_RADIUS: 1,
  /** Maximum node radius */
  MAX_RADIUS: 8,
  /** Node movement speed multiplier */
  SPEED_MULTIPLIER: 1.0,
  /** Maximum velocity per axis */
  MAX_VELOCITY: 2,
  /** Velocity dampening factor */
  DAMPENING: 0.98,
};

/**
 * Edge/Connection Configuration
 */
export const EDGE_CONFIG = {
  /** Default line width */
  LINE_WIDTH: 1,
  /** Minimum opacity */
  MIN_OPACITY: 0.1,
  /** Maximum opacity */
  MAX_OPACITY: 0.8,
  /** Opacity falloff (how fast opacity decreases with distance) */
  OPACITY_FALLOFF: 0.7,
};

/**
 * Color System Configuration
 */
export const COLOR_CONFIG = {
  /** Base hue rotation speed (degrees per frame) */
  HUE_ROTATION_SPEED: 0.5,
  /** Saturation for bass-dominant audio */
  BASS_SATURATION: 0.8,
  /** Saturation for silence */
  SILENCE_SATURATION: 0.2,
  /** Saturation for climax/peaks */
  CLIMAX_SATURATION: 1.0,
  /** Base lightness */
  BASE_LIGHTNESS: 0.5,
  /** Color palette names */
  PALETTES: {
    NEON: 'neon',
    WARM: 'warm',
    COOL: 'cool',
    CYBERPUNK: 'cyberpunk',
  },
};

/**
 * Canvas Rendering Configuration
 */
export const CANVAS_CONFIG = {
  /** Background clear alpha for trails */
  CLEAR_ALPHA: 0.15,
  /** Background color (black) */
  BACKGROUND_COLOR: '#000000',
  /** Enable antialiasing */
  ANTIALIAS: true,
  /** Glow blur radius */
  GLOW_RADIUS: 10,
  /** Glow intensity */
  GLOW_INTENSITY: 0.5,
};

/**
 * Particle System Configuration (for Particle Energy pattern)
 */
export const PARTICLE_CONFIG = {
  /** Number of particles */
  COUNT: 300,
  /** Particle lifetime (frames) */
  LIFETIME: 60,
  /** Trail length (frames) */
  TRAIL_LENGTH: 30,
  /** Maximum particle speed */
  MAX_SPEED: 5,
  /** Particle radius */
  RADIUS: 2,
};

/**
 * Waveform Spectrum Configuration
 */
export const WAVEFORM_CONFIG = {
  /** Number of frequency bars */
  BAR_COUNT: 64,
  /** Bar width ratio */
  BAR_WIDTH_RATIO: 0.8,
  /** Bar spacing */
  BAR_SPACING: 2,
  /** Minimum bar height */
  MIN_HEIGHT: 5,
  /** Maximum bar height (% of canvas) */
  MAX_HEIGHT_PERCENT: 0.8,
};

/**
 * Three.js 3D Configuration
 */
export const THREE_CONFIG = {
  /** Field of view */
  FOV: 75,
  /** Near clipping plane */
  NEAR_PLANE: 0.1,
  /** Far clipping plane */
  FAR_PLANE: 1000,
  /** Camera Z position */
  CAMERA_Z: 5,
  /** Enable shadows */
  SHADOWS: false,
  /** Pixel ratio multiplier */
  PIXEL_RATIO: Math.min(window.devicePixelRatio, 2),
};

/**
 * Cyberpunk Mode Configuration
 */
export const CYBERPUNK_CONFIG = {
  /** Default lightning intensity */
  LIGHTNING_INTENSITY: 1.0,
  /** Default particle density */
  PARTICLE_DENSITY: 1.0,
  /** Lightning bolt count */
  LIGHTNING_COUNT: 5,
  /** Particle burst count */
  PARTICLE_BURST_COUNT: 50,
  /** Geometry complexity */
  GEOMETRY_SEGMENTS: 32,
};
