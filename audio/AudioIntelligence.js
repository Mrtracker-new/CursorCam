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
            isSilence: isSilence,
            isClimax: isClimax,

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
            highEnergy: audioData.highEnergy || 0
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
}
