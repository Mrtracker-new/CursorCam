/**
 * AudioIntelligence.js
 * Central audio processing hub that orchestrates AudioEngine and BeatDetector
 * Provides unified, enriched audio data for all visual patterns
 */

export class AudioIntelligence {
  constructor(audioEngine, beatDetector) {
    this.audioEngine = audioEngine;
    this.beatDetector = beatDetector;

    // Silence detection
    this.silenceThreshold = 0.05;
    this.silenceFrames = 0;
    this.silenceFramesRequired = 30; // ~0.5 seconds at 60fps

    // Climax detection (energy build-up)
    this.energyTrend = [];
    this.trendSize = 120; // ~2 seconds at 60fps
    this.climaxThreshold = 0.7; // Energy growth rate for climax

    // CYBERPUNK ENHANCEMENTS
    // Beat drop detection (energy falling after sustained high)
    this.energyHistory = [];
    this.energyHistorySize = 30; // ~0.5 seconds at 60fps
    this.lastHighEnergyTime = 0;
    this.beatDropThreshold = 0.4; // Energy drop magnitude

    // High-frequency spike detection (for lightning triggers)
    this.highFreqHistory = [];
    this.highFreqHistorySize = 10; // Short window for transient detection
    this.spikeThreshold = 0.3; // Increase from baseline

    // Energy state tracking (for mode determination)
    this.currentEnergyState = 'CORE';
    this.stateChangeFrames = 0;
    this.stateStabilityRequired = 20; // Frames before state change
  }

  /**
   * Analyze current audio frame and return enriched intelligence
   * @returns {Object} Comprehensive audio intelligence data
   */
  analyze() {
    // Get base audio analysis
    const audioData = this.audioEngine.analyze();

    // Get beat detection
    const beatData = this.beatDetector.detect(audioData);

    // Get smoothed energy
    const smoothedEnergy = this.beatDetector.getSmoothedEnergy();

    // Get recent peaks
    const recentPeaks = this.beatDetector.getRecentPeaks();

    // Detect silence
    const isSilence = this._detectSilence(audioData.loudness);

    // Detect climax (energy build-up)
    const isClimax = this._detectClimax(audioData.totalEnergy);

    // CYBERPUNK ENHANCEMENTS
    // Detect beat drop (energy falling after sustained high)
    const beatDrop = this._detectBeatDrop(audioData.totalEnergy);

    // Detect high-frequency spike (for lightning triggers)
    const highSpike = this._detectHighSpike(audioData.highEnergy);

    // Determine energy state (OVERDRIVE/CORE/GLITCH/PORTAL)
    const energyState = this._getEnergyState(audioData);

    // Build unified data structure
    return {
      // Frequency bands (normalized 0-1)
      subBass: audioData.subBassEnergy || 0,
      bass: audioData.bassEnergy || 0,
      mids: audioData.midEnergy || 0,
      highs: audioData.highEnergy || 0,

      // Overall metrics
      loudness: audioData.loudness || 0,
      totalEnergy: audioData.totalEnergy || 0,

      // Beat detection
      isBeat: beatData.isBeat || false,
      beatStrength: beatData.beatStrength || 0, // 0=none, 1=weak, 2=medium, 3=strong
      beatConfidence: beatData.confidence || 0,

      // Dynamic analysis
      isTransient: beatData.isTransient || false,
      isSilence,
      isClimax,

      // CYBERPUNK SPECIFIC
      isBeatDrop: beatDrop.isDrop,
      beatDropIntensity: beatDrop.intensity,
      highSpikeIntensity: highSpike,
      energyState, // 'OVERDRIVE' | 'CORE' | 'GLITCH' | 'PORTAL'

      // Smoothed values (EMA)
      smoothBass: smoothedEnergy.bass,
      smoothMids: smoothedEnergy.mid,
      smoothHighs: smoothedEnergy.high,

      // Peak memory
      recentPeakBass: recentPeaks.bass,
      recentPeakMids: recentPeaks.mid,
      recentPeakHighs: recentPeaks.high,

      // Raw data for advanced patterns
      spectrum: audioData.spectrum,

      // LEGACY COMPATIBILITY (for existing patterns)
      bassEnergy: audioData.bassEnergy || 0,
      midEnergy: audioData.midEnergy || 0,
      highEnergy: audioData.highEnergy || 0,
    };
  }

  /**
   * Detect silence (sustained low energy)
   */
  _detectSilence(loudness) {
    if (loudness < this.silenceThreshold) {
      this.silenceFrames++;
    } else {
      this.silenceFrames = 0;
    }

    return this.silenceFrames > this.silenceFramesRequired;
  }

  /**
   * Detect climax (energy build-up)
   */
  _detectClimax(totalEnergy) {
    // Add to trend history
    this.energyTrend.push(totalEnergy);
    if (this.energyTrend.length > this.trendSize) {
      this.energyTrend.shift();
    }

    // Need enough data
    if (this.energyTrend.length < this.trendSize) {
      return false;
    }

    // Calculate trend (is energy increasing?)
    const firstHalf = this.energyTrend.slice(0, this.trendSize / 2);
    const secondHalf = this.energyTrend.slice(this.trendSize / 2);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const growthRate = (avgSecond - avgFirst) / (avgFirst + 0.01); // Prevent division by zero

    // Climax if energy is growing rapidly and current energy is high
    return growthRate > this.climaxThreshold && totalEnergy > 0.6;
  }

  /**
   * Set silence detection threshold
   */
  setSilenceThreshold(threshold) {
    this.silenceThreshold = Math.max(0.01, Math.min(0.2, threshold));
  }

  /**
   * Set climax detection sensitivity
   */
  setClimaxSensitivity(sensitivity) {
    this.climaxThreshold = Math.max(0.3, Math.min(1.0, sensitivity));
  }

  /**
   * CYBERPUNK: Detect beat drop (energy falling after sustained high)
   * @returns {Object} { isDrop: boolean, intensity: number }
   */
  _detectBeatDrop(totalEnergy) {
    // Add to energy history
    this.energyHistory.push(totalEnergy);
    if (this.energyHistory.length > this.energyHistorySize) {
      this.energyHistory.shift();
    }

    // Need enough history
    if (this.energyHistory.length < this.energyHistorySize) {
      return { isDrop: false, intensity: 0 };
    }

    // Calculate recent average and current trend
    const recentAvg = this.energyHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const olderAvg = this.energyHistory.slice(0, 10).reduce((a, b) => a + b, 0) / 10;

    // Check if we had high energy recently
    const hadHighEnergy = olderAvg > 0.6;

    // Check if energy dropped significantly
    const dropMagnitude = olderAvg - recentAvg;
    const isDrop = hadHighEnergy && dropMagnitude > this.beatDropThreshold;

    return {
      isDrop,
      intensity: isDrop ? Math.min(dropMagnitude, 1.0) : 0,
    };
  }

  /**
   * CYBERPUNK: Detect high-frequency spike (for lightning triggers)
   * @param {number} highEnergy - Current high-frequency energy (0-1)
   * @returns {number} Spike intensity (0-1), 0 if no spike
   */
  _detectHighSpike(highEnergy) {
    // Add to history
    this.highFreqHistory.push(highEnergy);
    if (this.highFreqHistory.length > this.highFreqHistorySize) {
      this.highFreqHistory.shift();
    }

    // Need enough history
    if (this.highFreqHistory.length < 5) {
      return 0;
    }

    // Calculate baseline (average of older samples)
    const baseline =
      this.highFreqHistory.slice(0, -3).reduce((a, b) => a + b, 0) /
      (this.highFreqHistory.length - 3);

    // Check if current energy is significantly higher than baseline
    const spike = highEnergy - baseline;

    if (spike > this.spikeThreshold) {
      return Math.min(spike / 0.7, 1.0); // Normalize to 0-1
    }

    return 0;
  }

  /**
   * CYBERPUNK: Determine energy state for pattern mode
   * @param {Object} audioData - Audio analysis data
   * @returns {string} 'OVERDRIVE' | 'CORE' | 'GLITCH' | 'PORTAL'
   */
  _getEnergyState(audioData) {
    let targetState = 'CORE'; // Default

    // OVERDRIVE: Sustained high bass + total energy > 0.8
    if (audioData.bassEnergy > 0.7 && audioData.totalEnergy > 0.8) {
      targetState = 'OVERDRIVE';
    }
    // GLITCH: High-frequency dominance
    else if (audioData.highEnergy > 0.7 && audioData.highEnergy > audioData.bassEnergy) {
      targetState = 'GLITCH';
    }
    // PORTAL: Triggered by beat drop (handled separately, but check here too)
    else if (audioData.totalEnergy < 0.2 && this.energyHistory.length > 0) {
      // Check if we just had high energy
      const recentHigh = this.energyHistory.slice(-20).some((e) => e > 0.6);
      if (recentHigh) {
        targetState = 'PORTAL';
      }
    }

    // State stability: only change state if target is sustained
    if (targetState === this.currentEnergyState) {
      this.stateChangeFrames = 0;
    } else {
      this.stateChangeFrames++;

      // Only change state after it's been stable for required frames
      if (this.stateChangeFrames >= this.stateStabilityRequired) {
        this.currentEnergyState = targetState;
        this.stateChangeFrames = 0;
      }
    }

    return this.currentEnergyState;
  }
}
