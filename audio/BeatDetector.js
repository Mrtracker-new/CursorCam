/**
 * BeatDetector.js
 * Detects beats and transients in audio signal
 */

export class BeatDetector {
  constructor() {
    this.energyHistory = [];
    this.historySize = 43; // ~43 frames at 60fps = ~0.7 seconds
    this.threshold = 0.6; // Configurable beat sensitivity
    this.cooldownFrames = 0;
    this.cooldownDuration = 15; // Minimum frames between beats (~250ms at 60fps)
    this.lastBeatTime = 0;
    this.beatConfidence = 0;

    // Transient detection
    this.lastEnergy = 0;
    this.transientThreshold = 0.15; // Energy spike threshold for transients

    // Energy smoothing (EMA)
    this.smoothedBass = 0;
    this.smoothedMid = 0;
    this.smoothedHigh = 0;
    this.smoothingFactor = 0.3; // 0-1, higher = more responsive

    // Peak memory (track recent peaks)
    this.peakHistory = { bass: [], mid: [], high: [] };
    this.peakHistorySize = 30; // ~0.5 seconds at 60fps
  }

  /**
   * Analyze audio data and detect beats
   * @param {Object} audioData - Audio analysis from AudioEngine
   * @returns {Object} Beat detection result
   */
  detect(audioData) {
    const { bassEnergy, totalEnergy } = audioData;

    // Use bass energy primarily for beat detection
    const currentEnergy = bassEnergy * 1.5 + totalEnergy * 0.5;

    // Apply energy smoothing (EMA)
    this._updateSmoothedEnergy(audioData);

    // Update peak memory
    this._updatePeakHistory(audioData);

    // Detect transients (sharp energy spikes)
    const energyDelta = currentEnergy - this.lastEnergy;
    const isTransient = energyDelta > this.transientThreshold && currentEnergy > 0.3;
    this.lastEnergy = currentEnergy;

    // Add to history
    this.energyHistory.push(currentEnergy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    // Decrease cooldown
    if (this.cooldownFrames > 0) {
      this.cooldownFrames--;
    }

    // Need enough history to detect beats
    if (this.energyHistory.length < this.historySize) {
      return {
        isBeat: false,
        confidence: 0,
        energy: currentEnergy,
        isTransient: false,
        beatStrength: 0,
      };
    }

    // Calculate average energy
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    // Calculate variance for adaptive threshold
    const variance =
      this.energyHistory.reduce((sum, val) => {
        return sum + Math.pow(val - avgEnergy, 2);
      }, 0) / this.energyHistory.length;

    const stdDev = Math.sqrt(variance);

    // Adaptive threshold: average + (threshold * std deviation)
    const adaptiveThreshold = avgEnergy + this.threshold * stdDev * 2;

    // Detect beat if current energy exceeds threshold and not in cooldown
    const isBeat =
      currentEnergy > adaptiveThreshold && this.cooldownFrames === 0 && currentEnergy > 0.3; // Minimum absolute energy

    let beatStrength = 0;

    if (isBeat) {
      // Calculate confidence based on how much we exceeded threshold
      this.beatConfidence = Math.min((currentEnergy - adaptiveThreshold) / adaptiveThreshold, 1);
      this.cooldownFrames = this.cooldownDuration;
      this.lastBeatTime = performance.now();

      // Classify beat strength (weak/medium/strong)
      if (this.beatConfidence < 0.3) {
        beatStrength = 1; // Weak
      } else if (this.beatConfidence < 0.7) {
        beatStrength = 2; // Medium
      } else {
        beatStrength = 3; // Strong
      }
    } else {
      this.beatConfidence *= 0.9; // Decay confidence
    }

    return {
      isBeat,
      confidence: this.beatConfidence,
      energy: currentEnergy,
      threshold: adaptiveThreshold,
      isTransient,
      beatStrength,
    };
  }

  /**
   * Set beat sensitivity (0.3 - 1.0)
   */
  setSensitivity(sensitivity) {
    this.threshold = Math.max(0.3, Math.min(1.0, sensitivity));
  }

  /**
   * Get time since last beat in milliseconds
   */
  getTimeSinceLastBeat() {
    return performance.now() - this.lastBeatTime;
  }

  /**
   * Update smoothed energy values using EMA
   */
  _updateSmoothedEnergy(audioData) {
    const alpha = this.smoothingFactor;
    this.smoothedBass = alpha * audioData.bassEnergy + (1 - alpha) * this.smoothedBass;
    this.smoothedMid = alpha * audioData.midEnergy + (1 - alpha) * this.smoothedMid;
    this.smoothedHigh = alpha * audioData.highEnergy + (1 - alpha) * this.smoothedHigh;
  }

  /**
   * Update peak history for recent energy peaks
   */
  _updatePeakHistory(audioData) {
    // Add current values
    this.peakHistory.bass.push(audioData.bassEnergy);
    this.peakHistory.mid.push(audioData.midEnergy);
    this.peakHistory.high.push(audioData.highEnergy);

    // Trim to size
    if (this.peakHistory.bass.length > this.peakHistorySize) {
      this.peakHistory.bass.shift();
      this.peakHistory.mid.shift();
      this.peakHistory.high.shift();
    }
  }

  /**
   * Get recent peak values
   */
  getRecentPeaks() {
    return {
      bass: Math.max(...this.peakHistory.bass, 0),
      mid: Math.max(...this.peakHistory.mid, 0),
      high: Math.max(...this.peakHistory.high, 0),
    };
  }

  /**
   * Get smoothed energy values
   */
  getSmoothedEnergy() {
    return {
      bass: this.smoothedBass,
      mid: this.smoothedMid,
      high: this.smoothedHigh,
    };
  }

  /**
   * Reset detector state
   */
  reset() {
    this.energyHistory = [];
    this.cooldownFrames = 0;
    this.beatConfidence = 0;
  }
}
