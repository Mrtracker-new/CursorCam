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
                energy: currentEnergy
            };
        }

        // Calculate average energy
        const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

        // Calculate variance for adaptive threshold
        const variance = this.energyHistory.reduce((sum, val) => {
            return sum + Math.pow(val - avgEnergy, 2);
        }, 0) / this.energyHistory.length;

        const stdDev = Math.sqrt(variance);

        // Adaptive threshold: average + (threshold * std deviation)
        const adaptiveThreshold = avgEnergy + (this.threshold * stdDev * 2);

        // Detect beat if current energy exceeds threshold and not in cooldown
        const isBeat = currentEnergy > adaptiveThreshold &&
            this.cooldownFrames === 0 &&
            currentEnergy > 0.3; // Minimum absolute energy

        if (isBeat) {
            // Calculate confidence based on how much we exceeded threshold
            this.beatConfidence = Math.min((currentEnergy - adaptiveThreshold) / adaptiveThreshold, 1);
            this.cooldownFrames = this.cooldownDuration;
            this.lastBeatTime = performance.now();
        } else {
            this.beatConfidence *= 0.9; // Decay confidence
        }

        return {
            isBeat,
            confidence: this.beatConfidence,
            energy: currentEnergy,
            threshold: adaptiveThreshold
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
     * Reset detector state
     */
    reset() {
        this.energyHistory = [];
        this.cooldownFrames = 0;
        this.beatConfidence = 0;
    }
}
