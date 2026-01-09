/**
 * Audio System Constants
 * Central location for all audio-related configuration values
 */

/**
 * FFT (Fast Fourier Transform) Configuration
 */
export const FFT_CONFIG = {
  /** FFT size for frequency analysis (must be power of 2) */
  SIZE: 4096,
  /** Smoothing time constant for AnalyserNode (0-1) */
  SMOOTHING: 0.8,
  /** Minimum decibels for frequency data normalization */
  MIN_DECIBELS: -90,
  /** Maximum decibels for frequency data normalization */
  MAX_DECIBELS: -10,
};

/**
 * Frequency Band Definitions (in Hz)
 */
export const FREQUENCY_BANDS = {
  /** Sub-bass frequencies (20-60 Hz) - Deep bass, felt more than heard */
  SUB_BASS: {
    MIN: 20,
    MAX: 60,
    BIN_START: 0,
    BIN_END: 6,
  },
  /** Bass frequencies (60-250 Hz) - Kick drums, bass guitar */
  BASS: {
    MIN: 60,
    MAX: 250,
    BIN_START: 7,
    BIN_END: 25,
  },
  /** Mid frequencies (250-2000 Hz) - Vocals, most instruments */
  MIDS: {
    MIN: 250,
    MAX: 2000,
    BIN_START: 26,
    BIN_END: 205,
  },
  /** High frequencies (2000-20000 Hz) - Cymbals, hi-hats, sparkle */
  HIGHS: {
    MIN: 2000,
    MAX: 20000,
    BIN_START: 206,
    BIN_END: 2048,
  },
};

/**
 * Beat Detection Configuration
 */
export const BEAT_DETECTION = {
  /** Default sensitivity (0.3-1.0) */
  DEFAULT_SENSITIVITY: 0.6,
  /** Minimum sensitivity */
  MIN_SENSITIVITY: 0.3,
  /** Maximum sensitivity */
  MAX_SENSITIVITY: 1.0,
  /** Cooldown between beats (milliseconds) */
  COOLDOWN_MS: 100,
  /** Energy threshold multiplier */
  THRESHOLD_MULTIPLIER: 1.3,
  /** Exponential moving average weight */
  EMA_WEIGHT: 0.2,
  /** Beat strength levels */
  STRENGTH_LEVELS: {
    WEAK: 1,
    LIGHT: 2,
    MEDIUM: 3,
    STRONG: 4,
    MASSIVE: 5,
  },
};

/**
 * Audio Analysis Thresholds
 */
export const AUDIO_THRESHOLDS = {
  /** Silence threshold (total energy below this = silent) */
  SILENCE: 10,
  /** Transient detection threshold (for hi-hats, snares) */
  TRANSIENT: 200,
  /** Climax detection threshold (energy peaks) */
  CLIMAX: 700,
  /** Minimum energy for audio reactivity */
  MIN_ENERGY: 5,
  /** Maximum expected energy */
  MAX_ENERGY: 1000,
};

/**
 * Audio Processing Constants
 */
export const AUDIO_PROCESSING = {
  /** Sample rate (Hz) - browser default */
  SAMPLE_RATE: 44100,
  /** Nyquist frequency (half of sample rate) */
  NYQUIST_FREQ: 22050,
  /** History buffer size for peak tracking */
  HISTORY_SIZE: 100,
  /** Peak memory duration (frames) */
  PEAK_MEMORY: 60,
};
