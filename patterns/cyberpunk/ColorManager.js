/**
 * ColorManager.js
 * Manages cyberpunk color palette and hard color swapping
 */

export class ColorManager {
  constructor() {
    // Cyberpunk color palette
    this.palette = {
      neonPink: 0xff00ff,
      electricCyan: 0x00ffff,
      purple: 0x8000ff,
      acidBlue: 0x0080ff,
      white: 0xffffff,
      deepBlack: 0x000000,
    };

    // Color presets
    this.presets = {
      neon_nights: {
        name: 'Neon Nights',
        primary: 0xff00ff,
        secondary: 0x00ffff,
        accent: 0xffff00,
      },
      tokyo_cyber: {
        name: 'Tokyo Cyber',
        primary: 0xff0066,
        secondary: 0x00ff99,
        accent: 0xffffff,
      },
      matrix_green: {
        name: 'Matrix Green',
        primary: 0x00ff00,
        secondary: 0x003300,
        accent: 0x33ff33,
      },
      blade_runner: {
        name: 'Blade Runner',
        primary: 0xff6600,
        secondary: 0x00ccff,
        accent: 0xff00ff,
      },
      synthwave: {
        name: 'Synthwave',
        primary: 0xff006e,
        secondary: 0x8338ec,
        accent: 0xffbe0b,
      },
    };

    // Current active colors
    this.currentDominantColor = this.palette.electricCyan;
    this.currentAccentColor = this.palette.neonPink;
    this.currentPreset = 'neon_nights';

    // Palette sets for beat-drop swapping
    this.paletteSets = [
      { dominant: this.palette.electricCyan, accent: this.palette.neonPink },
      { dominant: this.palette.neonPink, accent: this.palette.acidBlue },
      { dominant: this.palette.acidBlue, accent: this.palette.white },
      { dominant: this.palette.purple, accent: this.palette.electricCyan },
    ];
    this.currentPaletteIndex = 0;

    // Load saved preset if exists
    this._loadSavedPreset();
  }

  /**
   * Get dominant color based on frequency dominance
   * @param {Object} audioData - Audio analysis data
   * @returns {number} Hex color value
   */
  getDominantColor(audioData) {
    const { bass, mids, highs } = audioData;

    // Determine dominant frequency
    if (bass > mids && bass > highs) {
      return this.palette.neonPink; // Bass = Neon Pink
    } else if (mids > bass && mids > highs) {
      return this.palette.electricCyan; // Mids = Electric Cyan
    } else if (highs > bass && highs > mids) {
      // Highs = Acid Blue or White (alternate based on intensity)
      return highs > 0.8 ? this.palette.white : this.palette.acidBlue;
    }

    // Default
    return this.palette.electricCyan;
  }

  /**
   * Get current color palette
   * @returns {Object} { dominant, accent }
   */
  getCurrentPalette() {
    return {
      dominant: this.currentDominantColor,
      accent: this.currentAccentColor,
    };
  }

  /**
   * Swap to next palette (hard swap on beat drop)
   */
  swapPalette() {
    this.currentPaletteIndex = (this.currentPaletteIndex + 1) % this.paletteSets.length;
    const newPalette = this.paletteSets[this.currentPaletteIndex];

    this.currentDominantColor = newPalette.dominant;
    this.currentAccentColor = newPalette.accent;
  }

  /**
   * Get lightning color based on trigger type
   * @param {string} triggerType - 'spike' | 'beat' | 'drop'
   * @returns {number} Hex color value
   */
  getLightningColor(triggerType) {
    switch (triggerType) {
      case 'spike':
        return this.palette.electricCyan;
      case 'beat':
        return this.palette.white;
      case 'drop':
        return this.palette.neonPink;
      default:
        return this.palette.electricCyan;
    }
  }

  /**
   * Get particle color based on frequency band
   * @param {string} band - 'bass' | 'mid' | 'high'
   * @returns {number} Hex color value
   */
  getParticleColor(band) {
    switch (band) {
      case 'bass':
        return this.palette.neonPink;
      case 'mid':
        return this.palette.electricCyan;
      case 'high':
        return this.palette.white;
      default:
        return this.palette.electricCyan;
    }
  }

  /**
   * Apply color to Three.js material
   * @param {THREE.Material} material - Material to update
   * @param {number} color - Hex color value
   */
  applyColorToMaterial(material, color) {
    if (material.color) {
      material.color.setHex(color);
    }
  }

  /**
   * Load color preset
   */
  loadPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset) {
      console.warn(`Preset '${presetName}' not found`);
      return;
    }

    this.currentPreset = presetName;
    this.currentDominantColor = preset.primary;
    this.currentAccentColor = preset.secondary;

    // Update palette sets with preset colors
    this.paletteSets = [
      { dominant: preset.primary, accent: preset.secondary },
      { dominant: preset.secondary, accent: preset.accent },
      { dominant: preset.accent, accent: preset.primary },
      { dominant: preset.primary, accent: preset.accent },
    ];

    // Save to localStorage
    this._savePreset(presetName);

    console.log(`🎨 Loaded preset: ${preset.name}`);
  }

  /**
   * Get list of available presets
   */
  getPresetList() {
    return Object.keys(this.presets).map((key) => ({
      id: key,
      name: this.presets[key].name,
    }));
  }

  /**
   * Get current preset name
   */
  getCurrentPreset() {
    return this.currentPreset;
  }

  /**
   * Get primary color
   */
  getPrimaryColor() {
    return this.currentDominantColor;
  }

  /**
   * Get secondary color
   */
  getSecondaryColor() {
    return this.currentAccentColor;
  }

  /**
   * Export current preset as JSON
   */
  exportPreset() {
    const preset = this.presets[this.currentPreset];
    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset from JSON
   */
  importPreset(jsonString, presetName = 'custom') {
    try {
      const imported = JSON.parse(jsonString);
      this.presets[presetName] = {
        name: imported.name || presetName,
        primary: imported.primary,
        secondary: imported.secondary,
        accent: imported.accent,
      };
      this.loadPreset(presetName);
      return true;
    } catch (error) {
      console.error('Failed to import preset:', error);
      return false;
    }
  }

  /**
   * Save preset to localStorage
   */
  _savePreset(presetName) {
    try {
      localStorage.setItem('cyberpunk_color_preset', presetName);
    } catch (error) {
      // localStorage might not be available
    }
  }

  /**
   * Load saved preset from localStorage
   */
  _loadSavedPreset() {
    try {
      const saved = localStorage.getItem('cyberpunk_color_preset');
      if (saved && this.presets[saved]) {
        this.loadPreset(saved);
      }
    } catch (error) {
      // localStorage might not be available
    }
  }
}
