/**
 * Type definitions for Pattern System
 */

import type { AudioData, BeatData } from './audio';
import type { NetworkManager } from '../../constellation/NetworkManager';
import type { CanvasRenderer } from '../../renderer/CanvasRenderer';

/**
 * Base interface for all visual patterns
 */
export interface IPattern {
  /** Pattern display name */
  name: string;

  /**
   * Update pattern state based on audio data
   * @param network - Network manager with nodes and edges
   * @param audioData - Current audio analysis data
   * @param beatData - Beat detection data (legacy, use audioData.isBeat)
   */
  update(network: NetworkManager, audioData: AudioData, beatData: BeatData): void;

  /**
   * Render pattern to canvas
   * @param renderer - Canvas renderer for 2D drawing
   * @param network - Network manager with nodes and edges
   * @param audioData - Current audio analysis data
   */
  render(renderer: CanvasRenderer, network: NetworkManager, audioData: AudioData): void;

  /**
   * Called when pattern becomes active
   */
  onActivate?(): void;

  /**
   * Called when pattern is deactivated
   */
  onDeactivate?(): void;
}

/**
 * Pattern types
 */
export type PatternType =
  | 'static'
  | 'pulsing'
  | 'polygon'
  | 'stereo'
  | 'tunnel'
  | 'diamond-strobe'
  | 'hyperspace'
  | 'waveform'
  | 'particles'
  | 'cyberpunk';

/**
 * Pattern registry
 */
export type PatternRegistry = Record<PatternType, IPattern>;

/**
 * Pattern configuration
 */
export interface PatternConfig {
  /** Node density (100-2000) */
  nodeDensity: number;
  /** Connection range in pixels */
  connectionRange: number;
  /** Color intensity multiplier */
  colorAggression: number;
  /** Beat sensitivity (0.3-1.0) */
  beatSensitivity: number;
}

/**
 * Three.js pattern interface (for 3D patterns)
 */
export interface IThreePattern extends IPattern {
  /** Three.js scene */
  scene: any; // THREE.Scene
  /** Three.js camera */
  camera: any; // THREE.Camera
  /** Three.js renderer */
  renderer: any; // THREE.WebGLRenderer

  /**
   * Resize handler for Three.js canvas
   */
  onResize?(width: number, height: number): void;
}
