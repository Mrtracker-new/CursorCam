/**
 * main.js
 * CursorCam main application - orchestrates all systems
 */

import { AudioEngine } from './audio/AudioEngine.js';
import { BeatDetector } from './audio/BeatDetector.js';
import { AudioIntelligence } from './audio/AudioIntelligence.js';
import { NetworkManager } from './constellation/NetworkManager.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { PerformanceMonitor } from './ui/PerformanceMonitor.js';

// Import patterns
import { StaticConstellation } from './patterns/StaticConstellation.js';
import { PulsingMesh } from './patterns/PulsingMesh.js';
import { PolygonEmergence } from './patterns/PolygonEmergence.js';
import { StereoSplit } from './patterns/StereoSplit.js';
import { NeonTunnel } from './patterns/NeonTunnel.js';
import { StrobeDiamondTunnel } from './patterns/StrobeDiamondTunnel.js';
import { HyperspaceTunnel } from './patterns/HyperspaceTunnel.js';
import { WaveformSpectrum } from './patterns/WaveformSpectrum.js';
import { ParticleEnergy } from './patterns/ParticleEnergy.js';
import { CyberpunkMode } from './patterns/CyberpunkMode.js';

/**
 * Main CursorCam Application
 */
class CursorCam {
  constructor() {
    // Get canvas
    this.canvas = document.getElementById('constellation-canvas');

    // Initialize systems
    this.audioEngine = new AudioEngine();
    this.beatDetector = new BeatDetector();
    this.audioIntelligence = new AudioIntelligence(this.audioEngine, this.beatDetector);
    this.renderer = new CanvasRenderer(this.canvas);
    this.network = new NetworkManager(this.canvas);
    this.performanceMonitor = new PerformanceMonitor();

    // Initialize patterns
    this.patterns = {
      static: new StaticConstellation(),
      pulsing: new PulsingMesh(),
      polygon: new PolygonEmergence(),
      stereo: new StereoSplit(),
      tunnel: new NeonTunnel(),
      'diamond-strobe': new StrobeDiamondTunnel(),
      hyperspace: new HyperspaceTunnel(),
      waveform: new WaveformSpectrum(),
      particles: new ParticleEnergy(),
      cyberpunk: new CyberpunkMode(),
    };
    this.currentPattern = this.patterns['pulsing']; // Default pattern

    // Application state
    this.isRunning = false;
    this.audioActive = false;

    // Parameters
    this.nodeDensity = 500;
    this.connectionRange = 150;
    this.colorAggression = 1.0;
    this.beatSensitivity = 0.6;

    // Setup UI
    this._setupUI();

    // Handle window resize
    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.network.canvas = this.canvas;
      this.network.centerX = this.canvas.width / 2;
      this.network.centerY = this.canvas.height / 2;

      // Update node canvas bounds
      for (const node of this.network.nodes) {
        node.canvasWidth = this.canvas.width;
        node.canvasHeight = this.canvas.height;
      }
    });
  }

  /**
   * Setup UI event listeners
   */
  _setupUI() {
    // Permission overlay
    const permissionOverlay = document.getElementById('permission-overlay');
    const grantPermissionBtn = document.getElementById('grant-permission');

    grantPermissionBtn.addEventListener('click', async () => {
      try {
        await this.audioEngine.initialize();
        this.audioActive = true;

        // Hide overlay
        permissionOverlay.classList.add('hidden');

        // Update audio status
        this._updateAudioStatus(true);

        // Start application
        this.start();
      } catch (error) {
        alert('Failed to access microphone. Please grant permission and try again.');
        console.error(error);
      }
    });

    // Control panel toggle
    const controlPanel = document.getElementById('control-panel');
    const panelToggle = document.getElementById('panel-toggle');

    panelToggle.addEventListener('click', () => {
      controlPanel.classList.toggle('collapsed');
    });

    // Start audio button
    const startAudioBtn = document.getElementById('start-audio');
    startAudioBtn.addEventListener('click', async () => {
      if (!this.audioActive) {
        try {
          await this.audioEngine.initialize();
          this.audioActive = true;
          this._updateAudioStatus(true);

          if (!this.isRunning) {
            this.start();
          }
        } catch (error) {
          alert('Failed to access microphone.');
          console.error(error);
        }
      }
    });

    // Pattern mode selector
    const patternSelector = document.getElementById('pattern-mode');
    patternSelector.addEventListener('change', (e) => {
      this._switchPattern(e.target.value);
    });

    // Sliders
    this._setupSlider('node-density', (value) => {
      this.nodeDensity = value;
      this.network.setNodeCount(value);
    });

    this._setupSlider('connection-range', (value) => {
      this.connectionRange = value;
      this.network.setConnectionThreshold(value);
    });

    this._setupSlider('color-aggression', (value) => {
      this.colorAggression = value;
      this.renderer.setColorAggression(value);
    });

    this._setupSlider('beat-sensitivity', (value) => {
      this.beatSensitivity = value;
      this.beatDetector.setSensitivity(value);
    });

    // Cyberpunk-specific controls
    this._setupSlider('lightning-intensity', (value) => {
      // Value is read directly by CyberpunkMode
    });

    this._setupSlider('particle-density', (value) => {
      // Value is read directly by CyberpunkMode
    });

    // Waveform mode switcher
    const waveformModeSelector = document.getElementById('waveform-mode');
    if (waveformModeSelector) {
      waveformModeSelector.addEventListener('change', (e) => {
        if (this.patterns.waveform && this.patterns.waveform.setMode) {
          this.patterns.waveform.setMode(e.target.value);
        }
      });
    }

    // Particle behavior switcher
    const particleBehaviorSelector = document.getElementById('particle-behavior');
    if (particleBehaviorSelector) {
      particleBehaviorSelector.addEventListener('change', (e) => {
        if (this.patterns.particles && this.patterns.particles.setMode) {
          this.patterns.particles.setMode(e.target.value);
        }
      });
    }

    // Hyperspace quality switcher
    const hyperspaceQualitySelector = document.getElementById('hyperspace-quality');
    if (hyperspaceQualitySelector) {
      hyperspaceQualitySelector.addEventListener('change', (e) => {
        if (this.patterns.hyperspace && this.patterns.hyperspace.setQuality) {
          this.patterns.hyperspace.setQuality(e.target.value);
        }
      });
    }

    // Strobe Diamond Tunnel controls
    const strobePatternSelector = document.getElementById('strobe-pattern');
    if (strobePatternSelector) {
      strobePatternSelector.addEventListener('change', (e) => {
        const pattern = this.patterns['diamond-strobe'];
        if (pattern) {
          const patterns = {
            'classic': ['RED', 'WHITE'],
            'double': ['RED', 'RED', 'WHITE', 'WHITE'],
            'triplet': ['RED', 'WHITE', 'OFF'],
            'quad': ['RED', 'WHITE', 'RGB_CYCLE', 'OFF'],
            'random': 'RANDOM'
          };
          pattern.currentPattern = patterns[e.target.value];
          pattern.patternIndex = 0;
        }
      });
    }

    const strobeColorSelector = document.getElementById('strobe-color');
    if (strobeColorSelector) {
      strobeColorSelector.addEventListener('change', (e) => {
        const pattern = this.patterns['diamond-strobe'];
        if (pattern) {
          if (e.target.value === 'rgb') {
            // Enable continuous RGB cycling
            pattern._applyColorMode = 'rgb';
          } else if (e.target.value === 'rainbow') {
            // Enable continuous rainbow
            pattern._applyColorMode = 'rainbow';
          } else {
            // Normal mode (pattern-based)
            pattern._applyColorMode = 'normal';
          }
          console.log(`🎨 Strobe color mode: ${e.target.value}`);
        }
      });
    }

    const strobeMorseSelector = document.getElementById('strobe-morse');
    if (strobeMorseSelector) {
      strobeMorseSelector.addEventListener('change', (e) => {
        const pattern = this.patterns['diamond-strobe'];
        if (pattern) {
          if (e.target.value === 'off') {
            pattern.morseMode = false;
          } else if (e.target.value === 'beat') {
            pattern.morseMode = true;
            pattern.morsePattern = 'BEAT';
          } else if (e.target.value === 's') {
            pattern.morseMode = true;
            pattern.morsePattern = [3, 3, 3, 3, 3];
            pattern.morseIndex = 0;
          } else if (e.target.value === 'o') {
            pattern.morseMode = true;
            pattern.morsePattern = [9, 3, 9, 3, 9];
            pattern.morseIndex = 0;
          }
        }
      });
    }
  }

  /**
   * Setup slider with callback
   */
  _setupSlider(id, callback) {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(`${id}-value`);

    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      valueDisplay.textContent = value;
      callback(value);
    });
  }

  /**
   * Update audio status indicator
   */
  _updateAudioStatus(active) {
    const statusDot = document.getElementById('audio-status');
    const statusText = document.getElementById('audio-status-text');

    if (active) {
      statusDot.classList.add('active');
      statusText.textContent = 'Audio Active';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'Audio Inactive';
    }
  }

  /**
   * Switch pattern mode
   */
  _switchPattern(patternKey) {
    if (this.patterns[patternKey]) {
      // Deactivate old pattern
      if (this.currentPattern.onDeactivate) {
        this.currentPattern.onDeactivate();
      }

      // Activate new pattern
      this.currentPattern = this.patterns[patternKey];
      if (this.currentPattern.onActivate) {
        this.currentPattern.onActivate();
      }

      console.log(`Switched to pattern: ${this.currentPattern.name}`);

      // Show/hide cyberpunk controls
      const cyberpunkControls = document.getElementById('cyberpunk-controls');
      if (cyberpunkControls) {
        if (patternKey === 'cyberpunk') {
          cyberpunkControls.style.display = 'block';
        } else {
          cyberpunkControls.style.display = 'none';
        }
      }

      // Show/hide waveform controls
      const waveformControls = document.getElementById('waveform-controls');
      if (waveformControls) {
        if (patternKey === 'waveform') {
          waveformControls.style.display = 'block';
        } else {
          waveformControls.style.display = 'none';
        }
      }

      // Show/hide particle controls
      const particleControls = document.getElementById('particle-controls');
      if (particleControls) {
        if (patternKey === 'particles') {
          particleControls.style.display = 'block';
        } else {
          particleControls.style.display = 'none';
        }
      }

      // Show/hide strobe diamond controls
      const strobeControls = document.getElementById('strobe-controls');
      if (strobeControls) {
        if (patternKey === 'diamond-strobe') {
          strobeControls.style.display = 'block';
        } else {
          strobeControls.style.display = 'none';
        }
      }
    }
  }

  /**
   * Start the application
   */
  start() {
    if (this.isRunning) {
      return;
    }

    console.log('🚀 CursorCam starting...');

    // Initialize network with nodes
    this.network.initialize(this.nodeDensity);

    // Start render loop
    this.isRunning = true;
    this._renderLoop();
  }

  /**
   * Main render loop
   */
  _renderLoop() {
    if (!this.isRunning) {
      return;
    }

    // Update performance monitor
    this.performanceMonitor.update();

    // Get unified audio intelligence
    const audioData = this.audioIntelligence.analyze();

    // Trigger color rotation on strong beats
    if (audioData.isBeat && audioData.beatStrength >= 2) {
      this.renderer.rotateColors();
    }

    // Update pattern (pass both audioData and legacy beatData for compatibility)
    const beatData = {
      isBeat: audioData.isBeat,
      confidence: audioData.beatConfidence,
      energy: audioData.totalEnergy,
    };
    this.currentPattern.update(this.network, audioData, beatData);

    // Render pattern
    this.currentPattern.render(this.renderer, this.network, audioData);

    // Update performance display
    const stats = this.network.getStats();
    this.performanceMonitor.display(stats.nodeCount, stats.edgeCount);

    // Auto quality adjustment if performance is low
    if (this.performanceMonitor.isPerformanceLow()) {
      const newCount = Math.max(100, this.nodeDensity - 50);
      if (newCount !== this.nodeDensity) {
        console.warn('⚠️ Performance degraded, reducing node count');
        this.nodeDensity = newCount;
        this.network.setNodeCount(newCount);

        // Update slider
        const slider = document.getElementById('node-density');
        const valueDisplay = document.getElementById('node-density-value');
        slider.value = newCount;
        valueDisplay.textContent = newCount;
      }
    }

    // Continue loop
    requestAnimationFrame(() => this._renderLoop());
  }

  /**
   * Stop the application
   */
  stop() {
    this.isRunning = false;
    this.audioEngine.destroy();
    console.log('🛑 CursorCam stopped');
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new CursorCam();

  // Make app globally accessible for debugging
  window.cursorCam = app;

  console.log('%c🎵 CursorCam Ready', 'color: #00ffff; font-size: 20px; font-weight: bold;');
  console.log('Click "Enable Microphone" to start');
});
