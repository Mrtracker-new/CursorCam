/**
 * StateManager.js
 * Manages pattern state machine (OVERDRIVE/CORE/GLITCH/PORTAL)
 */

export class StateManager {
  constructor() {
    this.currentState = 'CORE';
    this.previousState = 'CORE';
    this.stateStartTime = Date.now();

    // Visual parameters for each state
    this.stateVisuals = {
      OVERDRIVE: {
        lightningIntensity: 2.0,
        particleDensity: 2.0,
        geometryScale: 1.5,
        rotationSpeed: 2.0,
        bloomStrength: 2.5,
        tunnelSpeed: 2.0,
      },
      CORE: {
        lightningIntensity: 1.0,
        particleDensity: 1.0,
        geometryScale: 1.0,
        rotationSpeed: 1.0,
        bloomStrength: 1.5,
        tunnelSpeed: 1.0,
      },
      GLITCH: {
        lightningIntensity: 1.5,
        particleDensity: 1.5,
        geometryScale: 0.8,
        rotationSpeed: 3.0,
        bloomStrength: 2.0,
        tunnelSpeed: 0.8,
      },
      PORTAL: {
        lightningIntensity: 3.0,
        particleDensity: 0.5,
        geometryScale: 0.5,
        rotationSpeed: 0.5,
        bloomStrength: 3.0,
        tunnelSpeed: 0.3,
      },
    };
  }

  /**
   * Update state based on audio data
   * @param {Object} audioData - Audio intelligence data
   */
  update(audioData) {
    const newState = audioData.energyState;

    // Immediate transition on beat drop to PORTAL
    if (audioData.isBeatDrop && audioData.beatDropIntensity > 0.5) {
      this.setState('PORTAL');
    } else if (newState !== this.currentState) {
      this.setState(newState);
    }

    // Auto-exit PORTAL mode after brief duration
    if (this.currentState === 'PORTAL') {
      const portalDuration = Date.now() - this.stateStartTime;
      if (portalDuration > 2000) {
        // 2 seconds
        this.setState('CORE');
      }
    }
  }

  /**
   * Force state change
   * @param {string} state - State name
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
   * @returns {string}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get visual parameters for current state
   * @returns {Object}
   */
  getVisuals() {
    return this.stateVisuals[this.currentState];
  }

  /**
   * Get visual parameter value
   * @param {string} param - Parameter name
   * @returns {number}
   */
  getVisualParam(param) {
    return this.stateVisuals[this.currentState][param] || 1.0;
  }

  /**
   * Check if state just changed
   * @returns {boolean}
   */
  justChanged() {
    return Date.now() - this.stateStartTime < 100; // Within 100ms
  }
}
