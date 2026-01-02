/**
 * AudioEngine.js
 * Core audio capture and real-time frequency analysis
 */

export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.bufferLength = 0;

        // Frequency band indices (will be calculated based on FFT size)
        this.bassRange = { start: 0, end: 0 };
        this.midRange = { start: 0, end: 0 };
        this.highRange = { start: 0, end: 0 };

        // Normalization
        this.energyHistory = [];
        this.historySize = 60; // Keep 60 frames of history
        this.maxBass = 0;
        this.maxMid = 0;
        this.maxHigh = 0;

        this.isActive = false;
    }

    /**
     * Initialize audio context and request microphone access
     */
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Higher resolution for better frequency separation
            this.analyser.smoothingTimeConstant = 0.7; // Some smoothing for stability

            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);

            // Connect microphone to analyser
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            // Calculate frequency band ranges
            this._calculateFrequencyRanges();

            this.isActive = true;
            console.log('✅ Audio engine initialized');

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize audio:', error);
            throw error;
        }
    }

    /**
     * Calculate which FFT bins correspond to bass/mid/high frequencies
     */
    _calculateFrequencyRanges() {
        const sampleRate = this.audioContext.sampleRate;
        const nyquist = sampleRate / 2;
        const binSize = nyquist / this.bufferLength;

        // Bass: 20-250 Hz
        this.bassRange.start = Math.floor(20 / binSize);
        this.bassRange.end = Math.floor(250 / binSize);

        // Mid: 250-2000 Hz
        this.midRange.start = this.bassRange.end;
        this.midRange.end = Math.floor(2000 / binSize);

        // High: 2000-20000 Hz
        this.highRange.start = this.midRange.end;
        this.highRange.end = Math.min(Math.floor(20000 / binSize), this.bufferLength);

        console.log('Frequency ranges:', {
            bass: `${this.bassRange.start}-${this.bassRange.end}`,
            mid: `${this.midRange.start}-${this.midRange.end}`,
            high: `${this.highRange.start}-${this.highRange.end}`
        });
    }

    /**
     * Analyze current audio frame and return frequency data
     */
    analyze() {
        if (!this.isActive || !this.analyser) {
            return {
                bassEnergy: 0,
                midEnergy: 0,
                highEnergy: 0,
                totalEnergy: 0,
                spectrum: null
            };
        }

        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate energy for each frequency band
        const bassEnergy = this._calculateBandEnergy(this.bassRange.start, this.bassRange.end);
        const midEnergy = this._calculateBandEnergy(this.midRange.start, this.midRange.end);
        const highEnergy = this._calculateBandEnergy(this.highRange.start, this.highRange.end);

        // Calculate total energy
        const totalEnergy = (bassEnergy + midEnergy + highEnergy) / 3;

        // Update normalization values
        this._updateNormalization(bassEnergy, midEnergy, highEnergy);

        // Normalize to 0-1 range
        const normalizedBass = this.maxBass > 0 ? Math.min(bassEnergy / this.maxBass, 1) : 0;
        const normalizedMid = this.maxMid > 0 ? Math.min(midEnergy / this.maxMid, 1) : 0;
        const normalizedHigh = this.maxHigh > 0 ? Math.min(highEnergy / this.maxHigh, 1) : 0;

        return {
            bassEnergy: normalizedBass,
            midEnergy: normalizedMid,
            highEnergy: normalizedHigh,
            totalEnergy: (normalizedBass + normalizedMid + normalizedHigh) / 3,
            spectrum: this.dataArray // Raw spectrum for advanced use
        };
    }

    /**
     * Calculate average energy in a frequency band
     */
    _calculateBandEnergy(startBin, endBin) {
        let sum = 0;
        let count = 0;

        for (let i = startBin; i < endBin; i++) {
            sum += this.dataArray[i];
            count++;
        }

        return count > 0 ? sum / count : 0;
    }

    /**
     * Update normalization values using exponential moving average
     */
    _updateNormalization(bass, mid, high) {
        const alpha = 0.05; // Smoothing factor

        // Update max values with decay
        this.maxBass = Math.max(bass, this.maxBass * 0.995);
        this.maxMid = Math.max(mid, this.maxMid * 0.995);
        this.maxHigh = Math.max(high, this.maxHigh * 0.995);

        // Ensure minimums to prevent division by zero
        this.maxBass = Math.max(this.maxBass, 10);
        this.maxMid = Math.max(this.maxMid, 10);
        this.maxHigh = Math.max(this.maxHigh, 10);
    }

    /**
     * Get audio input latency
     */
    getLatency() {
        if (!this.audioContext) return 0;
        return (this.audioContext.baseLatency || 0) * 1000; // Convert to ms
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.microphone) {
            this.microphone.disconnect();
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.isActive = false;
        console.log('🔇 Audio engine destroyed');
    }
}
