/**
 * StateManager.js
 * Manages pattern state machine with 5 energy states
 * CALM → BUILDING → PEAK → BREAKDOWN → DROP
 */

export class StateManager {
  constructor() {
    this.currentState = 'CALM';
    this.previousState = 'CALM';
    this.stateStartTime = Date.now();
    this.stateMinDuration = 2000; // Minimum 2 seconds per state

    // Energy history for smoothing
    this.energyHistory = [];
    this.energyHistoryLength = 60; // 1 second at 60fps

    // Visual parameters for each state
    this.stateVisuals = {
      CALM: {
        lightningIntensity: 0.3,
        particleDensity: 0.5,
        geometryScale: 0.8,
        rotationSpeed: 0.5,
        bloomStrength: 1.0,
        tunnelSpeed: 0.5,
        digitalRainSpeed: 0.5,
        gridBrightness: 0.3,
      },
      BUILDING: {
        lightningIntensity: 0.8,
        particleDensity: 1.0,
        geometryScale: 1.0,
        rotationSpeed: 1.0,
        bloomStrength: 1.5,
        tunnelSpeed: 0.8,
        digitalRainSpeed: 1.0,
        gridBrightness: 0.6,
      },
      PEAK: {
        lightningIntensity: 1.5,
        particleDensity: 1.5,
        geometryScale: 1.3,
        rotationSpeed: 1.5,
        bloomStrength: 2.0,
        tunnelSpeed: 1.2,
        digitalRainSpeed: 1.5,
        gridBrightness: 0.8,
      },
      BREAKDOWN: {
        lightningIntensity: 2.0,
        particleDensity: 1.8,
        geometryScale: 0.9,
        rotationSpeed: 2.5,
        bloomStrength: 2.5,
        tunnelSpeed: 1.5,
        digitalRainSpeed: 2.0,
        gridBrightness: 1.0,
      },
      DROP: {
        lightningIntensity: 3.0,
        particleDensity: 2.5,
        geometryScale: 0.5,
        rotationSpeed: 3.0,
        bloomStrength: 3.0,
        tunnelSpeed: 2.0,
        digitalRainSpeed: 2.5,
        gridBrightness: 1.2,
      },
      // Legacy states for backward compatibility
      OVERDRIVE: {
        lightningIntensity: 2.0,
        particleDensity: 2.0,
        geometryScale: 1.5,
        rotationSpeed: 2.0,
        bloomStrength: 2.5,
        tunnelSpeed: 2.0,
        digitalRainSpeed: 2.0,
        gridBrightness: 1.0,
      },
      CORE: {
        lightningIntensity: 1.0,
        particleDensity: 1.0,
        geometryScale: 1.0,
        rotationSpeed: 1.0,
        bloomStrength: 1.5,
        tunnelSpeed: 1.0,
        digitalRainSpeed: 1.0,
        gridBrightness: 0.6,
      },
      GLITCH: {
        lightningIntensity: 1.5,
        particleDensity: 1.5,
        geometryScale: 0.8,
        rotationSpeed: 3.0,
        bloomStrength: 2.0,
        tunnelSpeed: 0.8,
        digitalRainSpeed: 1.5,
        gridBrightness: 0.8,
      },
      PORTAL: {
        lightningIntensity: 3.0,
        particleDensity: 0.5,
        geometryScale: 0.5,
        rotationSpeed: 0.5,
        bloomStrength: 3.0,
        tunnelSpeed: 0.3,
        digitalRainSpeed: 2.5,
        gridBrightness: 1.2,
      },
    };
  }

  /**
   * Update state based on audio data
   */
  update(audioData) {
    // Add current energy to history
    this.energyHistory.push(audioData.totalEnergy || 0);
    if (this.energyHistory.length > this.energyHistoryLength) {
      this.energyHistory.shift();
    }

    // Calculate smoothed energy (weighted moving average)
    const smoothedEnergy = this._getSmoothedEnergy();

    // Immediate transition on beat drop to DROP state
    if (audioData.isBeatDrop && audioData.beatDropIntensity > 0.5) {
      this.setState('DROP');
      return;
    }

    // Check minimum state duration
    const stateDuration = Date.now() - this.stateStartTime;
    if (stateDuration < this.stateMinDuration) {
      return; // Don't change state yet
    }

    // Determine new state based on smoothed energy with hysteresis
    const newState = this._determineState(smoothedEnergy);

    if (newState !== this.currentState) {
      this.setState(newState);
    }

    // Auto-exit DROP state after brief duration
    if (this.currentState === 'DROP' && stateDuration > 2000) {
      this.setState('PEAK'); // Transition to high energy
    }

    // Auto-exit PORTAL (legacy) after brief duration
    if (this.currentState === 'PORTAL' && stateDuration > 2000) {
      this.setState('BUILDING');
    }
  }

  /**
   * Calculate smoothed energy from history
   */
  _getSmoothedEnergy() {
    if (this.energyHistory.length === 0) {
      return 0;
    }

    // Weighted moving average (recent values weighted more)
    let weightedSum = 0;
    let weightTotal = 0;

    for (let i = 0; i < this.energyHistory.length; i++) {
      const weight = (i + 1) / this.energyHistory.length; // Linear weight
      weightedSum += this.energyHistory[i] * weight;
      weightTotal += weight;
    }

    return weightedSum / weightTotal;
  }

  /**
   * Determine state from energy level with hysteresis
   */
  _determineState(energy) {
    // Hysteresis thresholds (different for upward/downward transitions)
    const thresholds = {
      calm_to_building: 0.25,
      building_to_calm: 0.15,
      building_to_peak: 0.45,
      peak_to_building: 0.35,
      peak_to_breakdown: 0.72,
      breakdown_to_peak: 0.65,
      breakdown_to_drop: 0.88,
      drop_to_breakdown: 0.80,
    };

    const current = this.currentState;

    // State machine with hysteresis
    switch (current) {
      case 'CALM':
        if (energy > thresholds.calm_to_building) return 'BUILDING';
        break;

      case 'BUILDING':
        if (energy < thresholds.building_to_calm) return 'CALM';
        if (energy > thresholds.building_to_peak) return 'PEAK';
        break;

      case 'PEAK':
        if (energy < thresholds.peak_to_building) return 'BUILDING';
        if (energy > thresholds.peak_to_breakdown) return 'BREAKDOWN';
        break;

      case 'BREAKDOWN':
        if (energy < thresholds.breakdown_to_peak) return 'PEAK';
        if (energy > thresholds.breakdown_to_drop) return 'DROP';
        break;

      case 'DROP':
        if (energy < thresholds.drop_to_breakdown) return 'BREAKDOWN';
        break;
    }

    return current; // No change
  }

  /**
   * Force state change
   */
  setState(state) {
    if (state === this.currentState) {
      return;
    }

    this.previousState = this.currentState;
    this.currentState = state;
    this.stateStartTime = Date.now();

    console.log(`🎨 Cyberpunk state: ${this.previousState} → ${this.currentState}`);
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get visual parameters for current state
   */
  getVisuals() {
    return this.stateVisuals[this.currentState] || this.stateVisuals.CALM;
  }

  /**
   * Get visual parameter value
   */
  getVisualParam(param) {
    return this.stateVisuals[this.currentState]?.[param] || 1.0;
  }

  /**
   * Check if state just changed
   */
  justChanged() {
    return Date.now() - this.stateStartTime < 100; // Within 100ms
  }
}
