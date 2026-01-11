/**
 * CyberpunkMode.js
 * Main cyberpunk reactive pattern - music-driven visual engine
 * Features: Neon geometry, lightning bolts, particle bursts, beat-locked motion
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { PatternBase } from './PatternBase.js';
import { ThreeJsHelper } from './utils/ThreeJsHelper.js';
import { ColorManager } from './cyberpunk/ColorManager.js';
import { StateManager } from './cyberpunk/StateManager.js';
import { GeometryManager } from './cyberpunk/GeometryManager.js';
import { LightningSystem } from './cyberpunk/LightningSystem.js';
import { ParticleEngine } from './cyberpunk/ParticleEngine.js';
import { DigitalRainSystem } from './cyberpunk/DigitalRainSystem.js';
import { GlitchSystem } from './cyberpunk/GlitchSystem.js';
import { NeonGridSystem } from './cyberpunk/NeonGridSystem.js';
import { CameraShakeSystem } from './cyberpunk/CameraShakeSystem.js';

/**
 * Cyberpunk Reactive Mode - High-energy music-reactive visual system
 */
export class CyberpunkMode extends PatternBase {
  constructor() {
    super('Cyberpunk Mode');

    // Flag for Three.js pattern
    this.isThreeJSPattern = true;

    // Three.js core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;

    // Subsystems
    this.colorManager = null;
    this.stateManager = null;
    this.geometryManager = null;
    this.lightningSystem = null;
    this.particleEngine = null;
    this.digitalRain = null;
    this.glitchSystem = null;
    this.neonGrid = null;
    this.cameraShake = null;

    // State
    this.frameCount = 0;
    this.lastBeatTime = 0;

    // User controls (set by UI)
    this.userControls = {
      lightningIntensity: 1.0,
      particleDensity: 1.0,
      modeOverride: 'auto', // 'auto' | 'overdrive' | 'core' | 'glitch' | 'portal'
    };

    // Configuration
    this.config = {
      camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
      },
      bloom: {
        strength: 1.5,
        threshold: 0.1,
        radius: 0.8,
      },
    };
  }

  /**
   * Initialize Three.js scene and subsystems
   */
  onActivate() {
    console.log('⚡ Cyberpunk Mode activating...');

    const mainCanvas = document.getElementById('constellation-canvas');
    if (!mainCanvas) {
      console.error('Canvas not found!');
      return;
    }

    // Use helper to create ThreeJs canvas
    const { threeCanvas } = ThreeJsHelper.createCanvas(mainCanvas);
    this.threeCanvas = threeCanvas;

    // Initialize Three.js using helper
    this.scene = ThreeJsHelper.createScene({
      backgroundColor: 0x000000,
      fogColor: 0x000000,
      fogDensity: 0.02,
    });

    this.renderer = ThreeJsHelper.createRenderer(threeCanvas, {
      pixelRatio: 2.0,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.2,
    });

    this.camera = ThreeJsHelper.createCamera(threeCanvas, {
      fov: this.config.camera.fov,
      near: this.config.camera.near,
      far: this.config.camera.far,
      position: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: -10 },
    });

    this._initPostProcessing(threeCanvas);

    // Initialize subsystems
    this.colorManager = new ColorManager();
    this.stateManager = new StateManager();
    this.geometryManager = new GeometryManager(this.scene, this.colorManager);
    this.lightningSystem = new LightningSystem(this.scene, this.colorManager);
    this.particleEngine = new ParticleEngine(this.scene, this.colorManager);
    this.digitalRain = new DigitalRainSystem(this.scene, this.colorManager);
    this.glitchSystem = new GlitchSystem(this.composer, this.colorManager);
    this.neonGrid = new NeonGridSystem(this.scene, this.colorManager);
    this.cameraShake = new CameraShakeSystem(this.camera);

    // Create visual elements
    this.geometryManager.create();
    this.particleEngine.create();
    this.digitalRain.create();
    this.glitchSystem.create();
    this.neonGrid.create();
    this._setupLighting();

    // Show cyberpunk controls
    this._showControls();

    console.log('✅ Cyberpunk Mode ready');
  }



  /**
   * Initialize post-processing
   */
  _initPostProcessing(canvas) {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.width, canvas.height),
      this.config.bloom.strength,
      this.config.bloom.radius,
      this.config.bloom.threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  /**
   * Setup scene lighting
   */
  _setupLighting() {
    const ambient = new THREE.AmbientLight(0x111111, 0.2);
    this.scene.add(ambient);
  }

  /**
   * Show cyberpunk-specific controls
   */
  _showControls() {
    const controls = document.getElementById('cyberpunk-controls');
    if (controls) {
      controls.style.display = 'block';
    }
  }

  /**
   * Hide cyberpunk-specific controls
   */
  _hideControls() {
    const controls = document.getElementById('cyberpunk-controls');
    if (controls) {
      controls.style.display = 'none';
    }
  }

  /**
   * Update pattern state (called every frame)
   */
  update(network, audioData, beatData) {
    if (!this.scene) {
      return;
    }

    this.frameCount++;

    // Update state manager
    if (this.userControls.modeOverride === 'auto') {
      this.stateManager.update(audioData);
    } else {
      this.stateManager.setState(this.userControls.modeOverride.toUpperCase());
    }

    const stateVisuals = this.stateManager.getVisuals();

    // Update subsystems
    this.geometryManager.update(audioData, stateVisuals);
    this.lightningSystem.update(audioData, stateVisuals);
    this.particleEngine.update(audioData, stateVisuals);
    this.digitalRain.update(audioData, stateVisuals);
    this.glitchSystem.update(audioData, stateVisuals);
    this.neonGrid.update(audioData, stateVisuals);
    this.cameraShake.update(audioData);

    // Update bloom based on total energy
    const app = window.cursorCam;
    const colorIntensity = app ? app.colorAggression : 1.0;
    this.bloomPass.strength =
      (this.config.bloom.strength + audioData.totalEnergy) *
      stateVisuals.bloomStrength *
      colorIntensity;

    // Handle beats
    if (audioData.isBeat && audioData.beatStrength >= 1) {
      this._onBeat(audioData);
    }

    // Handle beat drops
    if (audioData.isBeatDrop) {
      this._onBeatDrop(audioData);
    }

    // Update user controls from UI
    this._updateUserControls();
  }

  /**
   * Handle beat event
   */
  _onBeat(audioData) {
    const now = Date.now();
    if (now - this.lastBeatTime < 100) {
      return;
    } // Debounce
    this.lastBeatTime = now;

    // Geometry shockwave
    this.geometryManager.onBeat(audioData.beatStrength, audioData);

    // Camera FOV pulse (instant)
    if (audioData.beatStrength >= 2) {
      this.camera.fov = this.config.camera.fov + audioData.beatConfidence * 15;
      this.camera.updateProjectionMatrix();

      // Reset after short delay
      setTimeout(() => {
        this.camera.fov = this.config.camera.fov;
        this.camera.updateProjectionMatrix();
      }, 100);
    }

    // Color palette swap on strong beats
    if (audioData.beatStrength >= 3 && audioData.beatConfidence > 0.9) {
      this.colorManager.swapPalette();
    }
  }

  /**
   * Handle beat drop event
   */
  _onBeatDrop(audioData) {
    console.log('💥 Beat drop detected!', audioData.beatDropIntensity);

    // Trigger glitch effect
    if (this.glitchSystem) {
      this.glitchSystem.triggerGlitch(audioData.beatDropIntensity);
    }

    // Geometry response
    this.geometryManager.onBeatDrop(audioData.beatDropIntensity);

    // Force DROP state
    this.stateManager.setState('DROP');

    // Color palette swap
    this.colorManager.swapPalette();
  }

  /**
   * Update user controls from UI
   */
  _updateUserControls() {
    // Lightning intensity
    const lightningSlider = document.getElementById('lightning-intensity');
    if (lightningSlider) {
      this.userControls.lightningIntensity = parseFloat(lightningSlider.value);
      this.lightningSystem.setIntensity(this.userControls.lightningIntensity);
    }

    // Particle density
    const particleSlider = document.getElementById('particle-density');
    if (particleSlider) {
      this.userControls.particleDensity = parseFloat(particleSlider.value);
      this.particleEngine.setDensity(this.userControls.particleDensity);
    }

    // Mode override
    const modeSelect = document.getElementById('cyberpunk-mode-override');
    if (modeSelect) {
      this.userControls.modeOverride = modeSelect.value;
    }
  }

  /**
   * Render the scene
   */
  render(renderer, network, audioData) {
    if (!this.composer || !this.scene || !this.camera) {
      return;
    }
    this.composer.render();
  }

  /**
   * Cleanup when pattern is deactivated
   */
  onDeactivate() {
    console.log('⚡ Cyberpunk Mode deactivating...');

    // Dispose subsystems
    if (this.geometryManager) {
      this.geometryManager.dispose();
    }
    if (this.lightningSystem) {
      this.lightningSystem.dispose();
    }
    if (this.particleEngine) {
      this.particleEngine.dispose();
    }
    if (this.digitalRain) {
      this.digitalRain.dispose();
    }
    if (this.glitchSystem) {
      this.glitchSystem.dispose();
    }
    if (this.neonGrid) {
      this.neonGrid.dispose();
    }
    if (this.cameraShake) {
      this.cameraShake.dispose();
    }

    // Cleanup Three.js resources using helper
    const mainCanvas = document.getElementById('constellation-canvas');
    ThreeJsHelper.cleanup({
      threeCanvas: this.threeCanvas,
      mainCanvas: mainCanvas,
      scene: this.scene,
      renderer: this.renderer,
      composer: this.composer,
    });

    // Hide controls
    this._hideControls();

    this.threeCanvas = null;
  }
}
