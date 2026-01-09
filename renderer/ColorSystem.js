/**
 * ColorSystem.js
 * Manages neon color palettes and frequency-based color selection
 */

export class ColorSystem {
  constructor() {
    // Neon color palettes (RGB arrays)
    this.palettes = {
      bass: [
        [255, 69, 0], // Red-Orange
        [255, 140, 0], // Dark Orange
        [255, 215, 0], // Gold
      ],
      mid: [
        [0, 255, 0], // Lime Green
        [50, 205, 50], // Lime
        [124, 252, 0], // Lawn Green
      ],
      high: [
        [0, 255, 255], // Cyan
        [135, 206, 250], // Light Sky Blue
        [255, 255, 255], // White
      ],
    };

    // Stereo palettes (for split-color mode)
    this.stereoPalettes = {
      left: [
        // Warm colors
        [255, 0, 0], // Red
        [255, 127, 0], // Orange
        [255, 255, 0], // Yellow
      ],
      right: [
        // Cool colors
        [0, 255, 255], // Cyan
        [0, 127, 255], // Blue
        [255, 255, 255], // White
      ],
    };

    // Current palette index
    this.currentPaletteIndex = 0;
    this.colorAggression = 1.0; // Saturation multiplier
  }

  /**
   * Get color based on audio state (intelligent audio-reactive color selection)
   * Bass → warm colors, Highs → cool colors, Energy → saturation
   */
  getColorForAudioState(audioData) {
    const { bass, mids, highs, totalEnergy, isSilence } = audioData;

    // During silence, return desaturated color
    if (isSilence) {
      return { r: 100, g: 100, b: 120 }; // Muted blue-gray
    }

    // Calculate color temperature (bass=warm, highs=cool)
    const warmth = bass / (bass + highs + 0.01); // 0=cool, 1=warm
    const coolness = highs / (bass + highs + 0.01); // 0=warm, 1=cool

    // Base color selection
    let baseColor;
    if (warmth > 0.6) {
      // Bass-dominant: warm colors (red, orange, yellow)
      const palette = this.palettes.bass;
      const index = Math.floor(bass * (palette.length - 1));
      baseColor = palette[Math.min(index, palette.length - 1)];
    } else if (coolness > 0.6) {
      // High-dominant: cool colors (cyan, blue, white)
      const palette = this.palettes.high;
      const index = Math.floor(highs * (palette.length - 1));
      baseColor = palette[Math.min(index, palette.length - 1)];
    } else {
      // Mid-dominant: green colors
      const palette = this.palettes.mid;
      const index = Math.floor(mids * (palette.length - 1));
      baseColor = palette[Math.min(index, palette.length - 1)];
    }

    // Apply energy-based saturation boost
    const saturationBoost = 0.7 + totalEnergy * 0.3; // 0.7x to 1.0x

    return {
      r: Math.min(255, baseColor[0] * saturationBoost * this.colorAggression),
      g: Math.min(255, baseColor[1] * saturationBoost * this.colorAggression),
      b: Math.min(255, baseColor[2] * saturationBoost * this.colorAggression),
    };
  }

  /**
   * Get color based on frequency dominance (LEGACY - kept for compatibility)
   */
  getColorForFrequency(audioData) {
    // Map new property names to old ones if needed
    const mappedData = {
      bassEnergy: audioData.bass || audioData.bassEnergy || 0,
      midEnergy: audioData.mids || audioData.midEnergy || 0,
      highEnergy: audioData.highs || audioData.highEnergy || 0,
    };

    const { bassEnergy, midEnergy, highEnergy } = mappedData;

    // Determine dominant frequency
    let palette;
    let energy;

    if (bassEnergy > midEnergy && bassEnergy > highEnergy) {
      palette = this.palettes.bass;
      energy = bassEnergy;
    } else if (midEnergy > bassEnergy && midEnergy > highEnergy) {
      palette = this.palettes.mid;
      energy = midEnergy;
    } else {
      palette = this.palettes.high;
      energy = highEnergy;
    }

    // Select color from palette based on energy
    const colorIndex = Math.floor(energy * (palette.length - 1));
    const color = palette[Math.min(colorIndex, palette.length - 1)];

    // Apply color aggression
    return {
      r: Math.min(255, color[0] * this.colorAggression),
      g: Math.min(255, color[1] * this.colorAggression),
      b: Math.min(255, color[2] * this.colorAggression),
    };
  }

  /**
   * Get stereo colors (for split-color mode)
   */
  getStereoColors(leftEnergy, rightEnergy) {
    const leftIndex = Math.floor(leftEnergy * (this.stereoPalettes.left.length - 1));
    const rightIndex = Math.floor(rightEnergy * (this.stereoPalettes.right.length - 1));

    const leftColor =
      this.stereoPalettes.left[Math.min(leftIndex, this.stereoPalettes.left.length - 1)];
    const rightColor =
      this.stereoPalettes.right[Math.min(rightIndex, this.stereoPalettes.right.length - 1)];

    return {
      left: { r: leftColor[0], g: leftColor[1], b: leftColor[2] },
      right: { r: rightColor[0], g: rightColor[1], b: rightColor[2] },
    };
  }

  /**
   * Rotate color palette (on beat events)
   */
  rotatePalette() {
    // Swap colors within each palette
    for (const key in this.palettes) {
      const palette = this.palettes[key];
      const first = palette.shift();
      palette.push(first);
    }
  }

  /**
   * Set color aggression multiplier
   */
  setColorAggression(value) {
    this.colorAggression = Math.max(0.5, Math.min(2.0, value));
  }

  /**
   * Convert RGB to CSS color string
   */
  rgbToString(color) {
    return `rgb(${Math.floor(color.r)}, ${Math.floor(color.g)}, ${Math.floor(color.b)})`;
  }

  /**
   * Convert RGB to CSS color string with alpha
   */
  rgbaToString(color, alpha) {
    return `rgba(${Math.floor(color.r)}, ${Math.floor(color.g)}, ${Math.floor(color.b)}, ${alpha})`;
  }
}
