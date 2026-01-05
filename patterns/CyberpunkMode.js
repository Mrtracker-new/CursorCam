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
import { ColorManager } from './cyberpunk/ColorManager.js';
import { StateManager } from './cyberpunk/StateManager.js';
import { GeometryManager } from './cyberpunk/GeometryManager.js';
import { LightningSystem } from './cyberpunk/LightningSystem.js';
import { ParticleEngine } from './cyberpunk/ParticleEngine.js';

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

        // State
        this.frameCount = 0;
        this.lastBeatTime = 0;

        // User controls (set by UI)
        this.userControls = {
            lightningIntensity: 1.0,
            particleDensity: 1.0,
            modeOverride: 'auto' // 'auto' | 'overdrive' | 'core' | 'glitch' | 'portal'
        };

        // Configuration
        this.config = {
            camera: {
                fov: 75,
                near: 0.1,
                far: 1000
            },
            bloom: {
                strength: 1.5,
                threshold: 0.1,
                radius: 0.8
            }
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

        // Create separate Three.js canvas
        const threeCanvas = document.createElement('canvas');
        threeCanvas.id = 'three-canvas';
        threeCanvas.style.position = 'absolute';
        threeCanvas.style.top = '0';
        threeCanvas.style.left = '0';
        threeCanvas.style.width = '100%';
        threeCanvas.style.height = '100%';
        threeCanvas.style.zIndex = '1';
        threeCanvas.width = mainCanvas.width;
        threeCanvas.height = mainCanvas.height;

        mainCanvas.parentElement.appendChild(threeCanvas);
        this.threeCanvas = threeCanvas;

        // Hide main 2D canvas
        mainCanvas.style.display = 'none';

        // Initialize Three.js
        this._initScene();
        this._initRenderer(threeCanvas);
        this._initCamera(threeCanvas);
        this._initPostProcessing(threeCanvas);

        // Initialize subsystems
        this.colorManager = new ColorManager();
        this.stateManager = new StateManager();
        this.geometryManager = new GeometryManager(this.scene, this.colorManager);
        this.lightningSystem = new LightningSystem(this.scene, this.colorManager);
        this.particleEngine = new ParticleEngine(this.scene, this.colorManager);

        // Create visual elements
        this.geometryManager.create();
        this.particleEngine.create();
        this._setupLighting();

        // Show cyberpunk controls
        this._showControls();

        console.log('✅ Cyberpunk Mode ready');
    }

    /**
     * Initialize scene
     */
    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
    }

    /**
     * Initialize renderer
     */
    _initRenderer(canvas) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(canvas.width, canvas.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    /**
     * Initialize camera
     */
    _initCamera(canvas) {
        const aspect = canvas.width / canvas.height;
        this.camera = new THREE.PerspectiveCamera(
            this.config.camera.fov,
            aspect,
            this.config.camera.near,
            this.config.camera.far
        );
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(0, 0, -10);
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
        if (!this.scene) return;

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

        // Update bloom based on total energy
        const app = window.cursorCam;
        const colorIntensity = app ? app.colorAggression : 1.0;
        this.bloomPass.strength = (this.config.bloom.strength + audioData.totalEnergy) *
            stateVisuals.bloomStrength * colorIntensity;

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
        if (now - this.lastBeatTime < 100) return; // Debounce
        this.lastBeatTime = now;

        // Geometry shockwave
        this.geometryManager.onBeat(audioData.beatStrength, audioData);

        // Camera FOV pulse (instant)
        if (audioData.beatStrength >= 2) {
            this.camera.fov = this.config.camera.fov + (audioData.beatConfidence * 15);
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

        // Geometry response
        this.geometryManager.onBeatDrop(audioData.beatDropIntensity);

        // Force PORTAL mode
        this.stateManager.setState('PORTAL');

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
        if (!this.composer || !this.scene || !this.camera) return;
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

        // Dispose renderer and composer
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.composer) {
            this.composer.dispose();
        }

        // Clear scene
        if (this.scene) {
            this.scene.clear();
        }

        // Remove Three.js canvas
        if (this.threeCanvas && this.threeCanvas.parentElement) {
            this.threeCanvas.parentElement.removeChild(this.threeCanvas);
        }

        // Restore main 2D canvas
        const mainCanvas = document.getElementById('constellation-canvas');
        if (mainCanvas) {
            mainCanvas.style.display = 'block';
        }

        // Hide controls
        this._hideControls();

        this.threeCanvas = null;
    }
}
