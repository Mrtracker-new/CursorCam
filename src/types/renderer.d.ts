/**
 * Type definitions for Renderer and Color System
 */

import type { AudioData } from './audio';

/**
 * RGB color tuple
 */
export type RGBColor = [number, number, number];

/**
 * HSL color tuple
 */
export type HSLColor = [number, number, number];

/**
 * Hex color string
 */
export type HexColor = string;

/**
 * Color palette
 */
export interface ColorPalette {
  /** Palette name */
  name: string;
  /** Array of hex colors */
  colors: HexColor[];
}

/**
 * Rendering context
 */
export interface RenderContext {
  /** 2D canvas context */
  ctx: CanvasRenderingContext2D;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
}

/**
 * Node rendering options
 */
export interface NodeRenderOptions {
  /** Node radius in pixels */
  radius: number;
  /** Fill color */
  color: HexColor;
  /** Glow intensity (0-1) */
  glow?: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Edge rendering options
 */
export interface EdgeRenderOptions {
  /** Line color */
  color: HexColor;
  /** Line width */
  width?: number;
  /** Opacity based on distance (0-1) */
  opacity: number;
  /** Use gradient */
  useGradient?: boolean;
}

/**
 * Canvas renderer configuration
 */
export interface RendererConfig {
  /** Background clear alpha (0-1) */
  clearAlpha: number;
  /** Color intensity multiplier */
  colorAggression: number;
  /** Enable antialiasing */
  antialias: boolean;
}

/**
 * Color system configuration
 */
export interface ColorSystemConfig {
  /** Base saturation (0-1) */
  baseSaturation: number;
  /** Base lightness (0-1) */
  baseLightness: number;
  /** Color rotation speed */
  rotationSpeed: number;
}

/**
 * Color mapping for audio frequencies
 */
export interface FrequencyColorMap {
  /** Bass frequencies → warm colors (red, orange, yellow) */
  bass: HSLColor;
  /** Mid frequencies → neutral colors */
  mids: HSLColor;
  /** High frequencies → cool colors (cyan, blue, white) */
  highs: HSLColor;
}
