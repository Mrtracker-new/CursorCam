/**
 * Global type definitions for CursorCam
 */

export * from './audio';
export * from './pattern';
export * from './renderer';
export * from './network';

/**
 * Performance monitoring
 */
export interface PerformanceMetrics {
  /** Frames per second */
  fps: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** Number of nodes */
  nodeCount: number;
  /** Number of edges */
  edgeCount: number;
}

/**
 * Application state
 */
export interface AppState {
  /** Whether app is running */
  isRunning: boolean;
  /** Whether audio is active */
  audioActive: boolean;
  /** Current pattern key */
  currentPattern: string;
  /** Performance data */
  performance: PerformanceMetrics;
}

/**
 * UI control values
 */
export interface UIControls {
  /** Node density (100-2000) */
  nodeDensity: number;
  /** Connection range (50-300) */
  connectionRange: number;
  /** Color aggression (0.5-2.0) */
  colorAggression: number;
  /** Beat sensitivity (0.3-1.0) */
  beatSensitivity: number;
}

/**
 * Cyberpunk mode controls
 */
export interface CyberpunkControls extends UIControls {
  /** Lightning intensity (0-2) */
  lightningIntensity: number;
  /** Particle density (0.2-2) */
  particleDensity: number;
  /** Mode override */
  modeOverride: 'auto' | 'overdrive' | 'core' | 'glitch' | 'portal';
}
