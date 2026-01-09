/**
 * Type definitions for Audio System
 */

/**
 * Audio frequency data from FFT analysis
 */
export interface FrequencyData {
  /** Raw frequency bins (0-20kHz) */
  bins: Uint8Array;
  /** FFT size */
  fftSize: number;
  /** Number of frequency bins */
  binCount: number;
}

/**
 * Processed audio analysis data with frequency bands
 */
export interface AudioData {
  /** Sub-bass frequency energy (20-60 Hz) */
  subBass: number;
  /** Bass frequency energy (60-250 Hz) */
  bass: number;
  /** Mid frequency energy (250-2000 Hz) */
  mids: number;
  /** High frequency energy (2000-20000 Hz) */
  highs: number;
  /** Total energy across all frequencies (0-1000) */
  totalEnergy: number;
  /** Whether audio input is silent */
  isSilent: boolean;
  /** Whether current moment is a climax/peak */
  isClimax: boolean;
  /** Whether a beat is detected */
  isBeat: boolean;
  /** Beat detection confidence (0-1) */
  beatConfidence: number;
  /** Beat strength classification (1-5) */
  beatStrength: number;
  /** Whether a transient (hi-hat, snare) is detected */
  hasTransient: boolean;
}

/**
 * Beat detection result
 */
export interface BeatData {
  /** Whether a beat was detected */
  isBeat: boolean;
  /** Confidence level (0-1) */
  confidence: number;
  /** Current energy level */
  energy: number;
  /** Beat strength (1-5) */
  strength?: number;
}

/**
 * Audio engine configuration
 */
export interface AudioEngineConfig {
  /** FFT size for frequency analysis */
  fftSize: number;
  /** Smoothing time constant for AnalyserNode */
  smoothingTimeConstant: number;
  /** Minimum decibels for AnalyserNode */
  minDecibels: number;
  /** Maximum decibels for AnalyserNode */
  maxDecibels: number;
}

/**
 * Beat detector configuration
 */
export interface BeatDetectorConfig {
  /** Beat detection sensitivity (0.3-1.0) */
  sensitivity: number;
  /** Minimum time between beats (ms) */
  cooldownTime: number;
  /** Energy threshold multiplier */
  thresholdMultiplier: number;
}

/**
 * Frequency band definition
 */
export interface FrequencyBand {
  /** Band name */
  name: string;
  /** Minimum frequency (Hz) */
  minFreq: number;
  /** Maximum frequency (Hz) */
  maxFreq: number;
  /** FFT bin start index */
  binStart: number;
  /** FFT bin end index */
  binEnd: number;
}
