/**
 * ColorManager.js
 * Manages cyberpunk color palette and hard color swapping
 */

export class ColorManager {
    constructor() {
        // Cyberpunk color palette
        this.palette = {
            neonPink: 0xFF00FF,
            electricCyan: 0x00FFFF,
            purple: 0x8000FF,
            acidBlue: 0x0080FF,
            white: 0xFFFFFF,
            deepBlack: 0x000000
        };

        // Current active colors
        this.currentDominantColor = this.palette.electricCyan;
        this.currentAccentColor = this.palette.neonPink;

        // Palette sets for beat-drop swapping
        this.paletteSets = [
            { dominant: this.palette.electricCyan, accent: this.palette.neonPink },
            { dominant: this.palette.neonPink, accent: this.palette.acidBlue },
            { dominant: this.palette.acidBlue, accent: this.palette.white },
            { dominant: this.palette.purple, accent: this.palette.electricCyan }
        ];
        this.currentPaletteIndex = 0;
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
            accent: this.currentAccentColor
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
}
