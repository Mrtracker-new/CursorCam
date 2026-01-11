/**
 * StrobeDiamondTunnel.js
 * Red-White Strobe Diamond Tunnel - Horizontal Array with Radial Lines
 *
 * DESIGN: Diamonds arranged horizontally with perfect left-right symmetry
 * - White radial lines from center
 * - Red diamond outlines pulsing with music
 * - Dark glow background
 * - Hard strobe flashes on beats
 */

import { PatternBase } from './PatternBase.js';

/**
 * Strobe states
 */
const StrobeState = {
  OFF: 'off',
  RED: 'red',
  WHITE: 'white',
  FULL_FLASH: 'full_flash',
  RGB_CYCLE: 'rgb_cycle',
  RAINBOW: 'rainbow',
  BLACKOUT: 'blackout',
};

/**
 * Strobe pattern sequences
 */
const StrobePatterns = {
  CLASSIC: ['RED', 'WHITE'],
  DOUBLE_PULSE: ['RED', 'RED', 'WHITE', 'WHITE'],
  TRIPLET: ['RED', 'WHITE', 'OFF'],
  QUAD: ['RED', 'WHITE', 'RGB_CYCLE', 'OFF'],
  RANDOM: 'RANDOM',
};

/**
 * Morse code patterns
 */
const MorseCode = {
  BEAT: 'BEAT',  // Flash on every beat
  S: [3, 3, 3, 3, 3], // ... (dot-gap-dot-gap-dot)
  O: [9, 3, 9, 3, 9], // --- (dash-gap-dash-gap-dash)
};

/**
 * Diamond structure for horizontal array
 */
class DiamondElement {
  constructor(xPosition, size, color) {
    this.x = xPosition; // Horizontal position
    this.size = size;
    this.color = color;
    this.thickness = 6.0;
    this.visible = true;
    this.glowIntensity = 0;
  }
}

/**
 * Red-White Strobe Diamond Tunnel Pattern
 * Horizontal diamond array with radial white lines
 */
export class StrobeDiamondTunnel extends PatternBase {
  constructor() {
    super('💎 Strobe Diamond Tunnel');

    // Configuration
    this.config = {
      numDiamonds: 5, // Total diamonds (center + 2 on each side for symmetry)
      baseDiamondSize: 120, // Base size of diamonds
      diamondSpacing: 250, // Horizontal spacing between diamonds
      baseThickness: 8.0, // Line thickness
      numRadialLines: 8, // Number of white radial lines from center
      glowRadius: 400, // Background glow radius
    };

    // Diamond array
    this.diamonds = [];

    // Strobe system
    this.strobeState = StrobeState.OFF;
    this.strobeTimer = 0;
    this.beatCount = 0;

    // RGB strobe state
    this.rgbHue = 0; // 0-360 degrees
    this.rgbSpeed = 5; // Hue increment per frame
    this.rainbowOffset = 0; // Offset for rainbow mode

    // Pattern sequence state
    this.currentPattern = StrobePatterns.CLASSIC;
    this.patternIndex = 0;
    this.patternMode = true; // Enable pattern sequences

    // Morse code state
    this.morseMode = false;
    this.morsePattern = MorseCode.BEAT;
    this.morseIndex = 0;
    this.morseTimer = 0;

    // Color mode override (for UI control)
    this._applyColorMode = 'normal'; // 'normal', 'rgb', 'rainbow'

    // Color state
    this.currentDiamondColor = 'red';

    // Audio-reactive state
    this.bassIntensity = 0;
    this.midIntensity = 0;
    this.highIntensity = 0;

    // Animation
    this.tunnelPhase = 0;
    this.beatBurst = 0; // Beat burst intensity for radial chunks
    this.chunkSpeed = 1.0;
  }

  /**
   * Initialize pattern
   */
  onActivate() {
    console.log('💎 Strobe Diamond Tunnel activated (Horizontal Array Mode)');
    this._initializeDiamonds();
  }

  /**
   * Initialize horizontal diamond array with perfect symmetry
   */
  _initializeDiamonds() {
    this.diamonds = [];

    // Center diamond
    this.diamonds.push(
      new DiamondElement(0, this.config.baseDiamondSize, this.currentDiamondColor)
    );

    // Symmetrical pairs on left and right
    for (let i = 1; i <= Math.floor(this.config.numDiamonds / 2); i++) {
      const offset = i * this.config.diamondSpacing;
      const size = this.config.baseDiamondSize * (1.0 - i * 0.15); // Smaller as we go outward

      // Left side
      this.diamonds.push(new DiamondElement(-offset, size, this.currentDiamondColor));

      // Right side (mirror)
      this.diamonds.push(new DiamondElement(offset, size, this.currentDiamondColor));
    }
  }

  /**
   * Update pattern
   */
  update(network, audioData, beatData) {
    // Store audio data
    this.bassIntensity = audioData.bassEnergy;
    this.midIntensity = audioData.midEnergy;
    this.highIntensity = audioData.highEnergy;

    // Handle beats
    if (beatData.isBeat && beatData.confidence > 0.5) {
      this._onBeat(beatData);
    }

    // Map audio to visuals
    const visualParams = this._mapAudioToVisuals(audioData);

    // Update strobe system
    this._updateStrobeSystem(visualParams);

    // Update animation phase
    this._updateAnimation(visualParams);

    // Update diamond properties
    this._updateDiamonds(visualParams);
  }

  /**
   * Map audio to visual parameters
   */
  _mapAudioToVisuals(audioData) {
    // BASS → Diamond size pulse & chunk speed
    const sizePulse = 1.0 + audioData.bassEnergy * 1.8;
    const baseChunkSpeed = 0.5 + audioData.bassEnergy * 2.5; // 0.5x to 3.0x

    // MID → Additional chunk speed modulation
    const midSpeedBoost = audioData.midEnergy * 1.5;

    // HIGH → Glow intensity & high-frequency bursts
    const strobeRate = this._map(audioData.highEnergy, 0.0, 1.0, 0, 25);
    const glowIntensity = audioData.highEnergy;

    // Combined chunk speed (music-reactive)
    const chunkSpeed = baseChunkSpeed + midSpeedBoost;

    return {
      sizePulse,
      chunkSpeed,
      strobeRate,
      glowIntensity,
    };
  }

  /**
   * Update strobe system
   */
  _updateStrobeSystem(visualParams) {
    // RGB hue cycling (continuous) - cycle when in RGB/Rainbow mode OR when color mode is set
    if (this.strobeState === StrobeState.RGB_CYCLE ||
      this.strobeState === StrobeState.RAINBOW ||
      this._applyColorMode === 'rgb' ||
      this._applyColorMode === 'rainbow') {
      this.rgbHue = (this.rgbHue + this.rgbSpeed) % 360;
    }

    // Morse code timing (if enabled)
    if (this.morseMode) {
      if (this.morseTimer > 0) {
        this.morseTimer--;
      }

      if (this.morseTimer <= 0) {
        // Get next morse timing
        if (this.morsePattern === 'BEAT') {
          // Simple beat mode - handled in _onBeat
        } else if (Array.isArray(this.morsePattern)) {
          const duration = this.morsePattern[this.morseIndex];
          const isFlash = (this.morseIndex % 2 === 0);

          if (isFlash) {
            this._triggerStrobe(StrobeState.WHITE, duration);
          } else {
            this._triggerStrobe(StrobeState.OFF, duration);
          }

          this.morseIndex = (this.morseIndex + 1) % this.morsePattern.length;
          this.morseTimer = duration;
        }
      }
    }

    // Decrement standard strobe timer
    if (this.strobeTimer > 0) {
      this.strobeTimer--;
      if (this.strobeTimer <= 0) {
        this.strobeState = StrobeState.OFF;
      }
    }

    // High frequency strobe
    if (!this.morseMode) {
      if (visualParams.strobeRate > 5 && Math.random() < visualParams.strobeRate / 60) {
        this._triggerStrobe(StrobeState.WHITE, 2);
      }
    }
  }

  /**
   * Update animation
   */
  _updateAnimation(visualParams) {
    // Store music-reactive chunk speed
    this.chunkSpeed = visualParams.chunkSpeed;

    // Pulse phase for outward movement (music-reactive speed)
    this.tunnelPhase += this.chunkSpeed * 0.08;

    // Decay beat burst
    if (this.beatBurst > 0) {
      this.beatBurst *= 0.85; // Fast decay
      if (this.beatBurst < 0.01) {
        this.beatBurst = 0;
      }
    }
  }

  /**
   * Update diamond properties
   */
  _updateDiamonds(visualParams) {
    for (let i = 0; i < this.diamonds.length; i++) {
      const diamond = this.diamonds[i];

      // Apply size pulse
      const baseSizeIndex = Math.abs(diamond.x / this.config.diamondSpacing);
      const baseSize = this.config.baseDiamondSize * (1.0 - baseSizeIndex * 0.15);
      diamond.size = baseSize * visualParams.sizePulse;

      // Apply color based on mode priority:
      // 1. Color mode override (RGB/Rainbow from UI)
      // 2. Strobe state (beat-triggered)
      // 3. Default color
      if (this._applyColorMode === 'rgb') {
        // Continuous RGB cycling (all diamonds same color)
        diamond.color = `hsl(${this.rgbHue}, 100%, 50%)`;
      } else if (this._applyColorMode === 'rainbow') {
        // Continuous rainbow (each diamond different color)
        const hueOffset = (i * 360) / this.diamonds.length;
        diamond.color = `hsl(${(this.rgbHue + hueOffset) % 360}, 100%, 50%)`;
      } else if (this.strobeState === StrobeState.WHITE) {
        diamond.color = 'white';
      } else if (this.strobeState === StrobeState.RED) {
        diamond.color = 'red';
      } else if (this.strobeState === StrobeState.RGB_CYCLE) {
        // All diamonds same RGB color
        diamond.color = `hsl(${this.rgbHue}, 100%, 50%)`;
      } else if (this.strobeState === StrobeState.RAINBOW) {
        // Each diamond different color (rainbow spread)
        const hueOffset = (i * 360) / this.diamonds.length;
        diamond.color = `hsl(${(this.rgbHue + hueOffset) % 360}, 100%, 50%)`;
      } else {
        // Default color
        diamond.color = this.currentDiamondColor;
      }

      // Apply glow
      diamond.glowIntensity = visualParams.glowIntensity;

      // Thickness pulse
      diamond.thickness = this.config.baseThickness * (1.0 + this.bassIntensity * 0.5);
    }
  }

  /**
   * Handle beat events
   */
  _onBeat(beatData) {
    this.beatCount++;

    // BEAT BURST - dramatic radial chunk pulse
    this.beatBurst = 1.0 + beatData.confidence * 2.0; // 1.0x to 3.0x burst

    // Determine strobe color based on mode
    if (this.morseMode && this.morsePattern === 'BEAT') {
      // Morse BEAT mode: white flash on every beat
      this._triggerStrobe(StrobeState.WHITE, 3);
    } else if (this.patternMode) {
      // Pattern sequence mode
      const nextColor = this._getNextPatternColor();
      this._triggerStrobe(nextColor, 3);
    } else {
      // Classic mode: alternate red/white
      const flashColor = this.beatCount % 2 === 0 ? StrobeState.RED : StrobeState.WHITE;
      this._triggerStrobe(flashColor, 3);
    }

    // Every 4 beats: swap diamond color (if not in special modes)
    if (this.beatCount % 4 === 0 && !this.patternMode && !this.morseMode) {
      this.currentDiamondColor = this.currentDiamondColor === 'red' ? 'white' : 'red';
    }

    // Beat drop
    if (beatData.confidence > 0.8) {
      this._triggerStrobe(StrobeState.FULL_FLASH, 6);
      this.beatBurst = 3.5; // MASSIVE burst on drops
    }
  }

  /**
   * Get next pattern color from sequence
   */
  _getNextPatternColor() {
    if (this.currentPattern === 'RANDOM') {
      const colors = [StrobeState.RED, StrobeState.WHITE, StrobeState.RGB_CYCLE];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    const colorName = this.currentPattern[this.patternIndex];
    this.patternIndex = (this.patternIndex + 1) % this.currentPattern.length;
    return StrobeState[colorName];
  }

  /**
   * Trigger strobe
   */
  _triggerStrobe(state, duration) {
    this.strobeState = state;
    this.strobeTimer = duration;
  }

  /**
   * Render the pattern
   */
  render(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // === BACKGROUND ===
    // Dark background with radial glow (NOT pure black)
    const bgGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      this.config.glowRadius
    );
    bgGradient.addColorStop(0, `rgba(40, 10, 10, ${this.bassIntensity * 0.3})`);
    bgGradient.addColorStop(0.5, 'rgba(10, 5, 5, 0.8)');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Full-screen flash override
    if (this.strobeState === StrobeState.FULL_FLASH) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.save();
    ctx.translate(centerX, centerY);

    // === RADIAL WHITE LINES ===
    this._renderRadialLines(ctx, canvas);

    // === DIAMOND ARRAY ===
    this._renderDiamonds(ctx);

    ctx.restore();
  }

  /**
   * Render radial white lines as pulsing outward chunks
   */
  _renderRadialLines(ctx, canvas) {
    const maxRadius = Math.max(canvas.width, canvas.height) * 0.7;

    // Line appearance (music-reactive)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = (3.0 + this.highIntensity * 4.0) * (1.0 + this.beatBurst * 0.3);

    // Number of line directions
    const numDirections = this.config.numRadialLines;
    // Number of chunks per direction (MORE on beats)
    const chunksPerLine = Math.floor(6 + this.beatBurst * 3);
    // Chunk length (LONGER on beats)
    const chunkLength = 80 + this.beatBurst * 40;
    // Gap between chunks
    const gapLength = 40;

    for (let i = 0; i < numDirections; i++) {
      const angle = (i / numDirections) * Math.PI * 2;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      // Draw chunks moving outward
      for (let j = 0; j < chunksPerLine; j++) {
        // Pulse offset based on music + beat burst
        const speedMultiplier = this.chunkSpeed * (1.0 + this.beatBurst);
        const pulseOffset = (this.tunnelPhase * speedMultiplier * 15 + j * 30) % (maxRadius + 200);

        // Start and end of this chunk
        const startDist = pulseOffset;
        const endDist = startDist + chunkLength;

        // Skip if chunk is too far out
        if (startDist > maxRadius) {
          continue;
        }

        // Fade out as chunks move further
        const fadeFactor = 1.0 - startDist / maxRadius;
        const baseAlpha = 0.4 + this.highIntensity * 0.4;
        const beatAlpha = this.beatBurst * 0.3; // Brighter on beats
        ctx.globalAlpha = (baseAlpha + beatAlpha) * fadeFactor;

        // Draw chunk
        const startX = dirX * startDist;
        const startY = dirY * startDist;
        const endX = dirX * Math.min(endDist, maxRadius);
        const endY = dirY * Math.min(endDist, maxRadius);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * Render horizontal diamond array
   */
  _renderDiamonds(ctx) {
    for (const diamond of this.diamonds) {
      if (!diamond.visible) {
        continue;
      }

      // Set color
      ctx.strokeStyle = diamond.color === 'red' ? '#FF0000' : '#FFFFFF';
      ctx.lineWidth = diamond.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Add glow
      if (diamond.glowIntensity > 0.3) {
        ctx.shadowBlur = 25 * diamond.glowIntensity;
        ctx.shadowColor = ctx.strokeStyle;
      }

      // Draw diamond (rotated square)
      const size = diamond.size;
      ctx.beginPath();
      ctx.moveTo(diamond.x, -size); // Top
      ctx.lineTo(diamond.x + size, 0); // Right
      ctx.lineTo(diamond.x, size); // Bottom
      ctx.lineTo(diamond.x - size, 0); // Left
      ctx.closePath();
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Utility: Map value
   */
  _map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
}
