/**
 * HyperspaceTunnel.js
 * Audio-reactive 3D hyperspace tunnel using Three.js
 * Neon geometric wireframes, glowing nodes, particles, volumetric effects
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { PatternBase } from './PatternBase.js';

/**
 * Hyperspace Tunnel - Advanced 3D Audio-Reactive Pattern
 */
export class HyperspaceTunnel extends PatternBase {
    constructor() {
        super('Hyperspace Tunnel');

        // Flag to indicate this is a Three.js pattern
        this.isThreeJSPattern = true;

        // Three.js core components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;

        // Visual elements
        this.tunnel = null;
        this.centralPolygons = [];
        this.radialNodes = [];
        this.particles = null;

        // Animation state
        this.frameCount = 0;
        this.tunnelOffset = 0;
        this.polygonRotation = 0;

        // Audio-reactive parameters
        this.bassScale = 1.0;
        this.midRotationSpeed = 0.5;
        this.highBrightness = 1.0;
        this.particleDensity = 1000;

        // Configuration
        this.config = {
            tunnel: {
                radius: 8,
                length: 100,
                segments: 64,
                crimsonColor: 0x000000,  // Pure black
                fogColor: 0x000000        // Black fog
            },
            polygons: {
                count: 5,
                spacing: 2.5,
                baseSize: 1.5,
                cyanColor: 0x00FFFF,      // Electric cyan
                blueColor: 0x0080FF        // Electric blue
            },
            nodes: {
                count: 12,
                radius: 4,
                orbitSpeed: 0.5,
                orangeColor: 0xFF6600,     // Hot orange
                redColor: 0xFF0033         // Hot red
            },
            particles: {
                count: 2000,
                speed: 15,
                spread: 10
            },
            camera: {
                fov: 75,
                speed: 5.0
            },
            bloom: {
                strength: 1.5,
                threshold: 0.2,
                radius: 0.8
            }
        };
    }

    /**
     * Initialize Three.js scene
     */
    onActivate() {
        console.log('🚀 Hyperspace Tunnel activating...');

        const mainCanvas = document.getElementById('constellation-canvas');
        if (!mainCanvas) {
            console.error('Canvas not found!');
            return;
        }

        // Create a separate canvas for Three.js to avoid WebGL/2D context conflict
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

        // Insert Three.js canvas into DOM
        mainCanvas.parentElement.appendChild(threeCanvas);
        this.threeCanvas = threeCanvas;

        // Hide main 2D canvas
        mainCanvas.style.display = 'none';

        // Initialize Three.js
        this._initScene(threeCanvas);
        this._initRenderer(threeCanvas);
        this._initCamera(threeCanvas);
        this._initPostProcessing();

        // Create visual elements
        this._createTunnel();
        this._createCentralPolygons();
        this._createRadialNodes();
        this._createParticleSystem();
        this._setupLighting();

        console.log('✅ Hyperspace Tunnel ready');
    }

    /**
     * Initialize Three.js scene
     */
    _initScene(canvas) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Volumetric fog
        this.scene.fog = new THREE.FogExp2(this.config.tunnel.fogColor, 0.015);
    }

    /**
     * Initialize WebGL renderer
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
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(0, 0, -10);
    }

    /**
     * Initialize post-processing (bloom)
     */
    _initPostProcessing() {
        const canvas = document.getElementById('constellation-canvas');

        this.composer = new EffectComposer(this.renderer);

        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass for neon glow
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(canvas.width, canvas.height),
            this.config.bloom.strength,
            this.config.bloom.radius,
            this.config.bloom.threshold
        );
        this.composer.addPass(bloomPass);

        this.bloomPass = bloomPass;
    }

    /**
     * Create tunnel geometry
     */
    _createTunnel() {
        const geometry = new THREE.CylinderGeometry(
            this.config.tunnel.radius,
            this.config.tunnel.radius,
            this.config.tunnel.length,
            this.config.tunnel.segments,
            1,
            true  // Open-ended
        );

        // Rotate to align with Z-axis
        geometry.rotateX(Math.PI / 2);

        // Custom shader material for black background
        const material = new THREE.MeshStandardMaterial({
            color: this.config.tunnel.crimsonColor,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.BackSide,
            wireframe: false,
            emissive: 0x000000,
            emissiveIntensity: 0.0
        });

        this.tunnel = new THREE.Mesh(geometry, material);
        this.tunnel.position.z = -this.config.tunnel.length / 2;
        this.scene.add(this.tunnel);

        // Create duplicate tunnel for seamless looping
        const tunnel2 = this.tunnel.clone();
        tunnel2.position.z = this.tunnel.position.z - this.config.tunnel.length;
        this.scene.add(tunnel2);
        this.tunnel2 = tunnel2;
    }

    /**
     * Create central rotating wireframe polygons (hexagon/decagon hybrid)
     */
    _createCentralPolygons() {
        const polygonGroup = new THREE.Group();

        for (let i = 0; i < this.config.polygons.count; i++) {
            // Alternate between hexagon (6) and decagon (10)
            const sides = i % 2 === 0 ? 6 : 10;
            const size = this.config.polygons.baseSize - (i * 0.15);

            const shape = this._createPolygonShape(sides, size);

            // Wireframe material with emissive glow
            const material = new THREE.LineBasicMaterial({
                color: i % 2 === 0 ? this.config.polygons.cyanColor : this.config.polygons.blueColor,
                linewidth: 3, // Note: linewidth > 1 not supported on all platforms
                transparent: false
            });

            const polygon = new THREE.LineLoop(shape, material);
            polygon.position.z = -10 - (i * this.config.polygons.spacing);
            polygon.userData.baseSize = size;
            polygon.userData.rotationSpeed = 0.5 + (i * 0.15);
            polygon.userData.index = i;

            polygonGroup.add(polygon);
            this.centralPolygons.push(polygon);
        }

        this.scene.add(polygonGroup);
        this.polygonGroup = polygonGroup;
    }

    /**
     * Create polygon shape geometry
     */
    _createPolygonShape(sides, radius) {
        const points = [];

        for (let i = 0; i <= sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(new THREE.Vector3(x, y, 0));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return geometry;
    }

    /**
     * Create radial glowing nodes
     */
    _createRadialNodes() {
        const nodeGroup = new THREE.Group();
        nodeGroup.position.z = -10;

        for (let i = 0; i < this.config.nodes.count; i++) {
            const angle = (i / this.config.nodes.count) * Math.PI * 2;
            const x = Math.cos(angle) * this.config.nodes.radius;
            const y = Math.sin(angle) * this.config.nodes.radius;

            // Glowing sphere geometry
            const geometry = new THREE.SphereGeometry(0.15, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? this.config.nodes.orangeColor : this.config.nodes.redColor,
                transparent: false
            });

            const node = new THREE.Mesh(geometry, material);
            node.position.set(x, y, 0);
            node.userData.baseX = x;
            node.userData.baseY = y;
            node.userData.angle = angle;
            node.userData.index = i;

            // Add point light for each node
            const light = new THREE.PointLight(
                i % 2 === 0 ? this.config.nodes.orangeColor : this.config.nodes.redColor,
                2,
                5
            );
            light.position.copy(node.position);
            node.userData.light = light;
            nodeGroup.add(light);

            nodeGroup.add(node);
            this.radialNodes.push(node);
        }

        this.scene.add(nodeGroup);
        this.nodeGroup = nodeGroup;
    }

    /**
     * Create particle system
     */
    _createParticleSystem() {
        const particleCount = this.config.particles.count;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Random position in tunnel
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.config.tunnel.radius;
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = Math.sin(angle) * radius;
            positions[i3 + 2] = -Math.random() * this.config.tunnel.length;

            // Store velocities
            velocities[i3 + 2] = this.config.particles.speed;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x00FFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.particles.userData.velocities = velocities;
        this.scene.add(this.particles);
    }

    /**
     * Setup scene lighting
     */
    _setupLighting() {
        // Ambient light for base visibility
        const ambient = new THREE.AmbientLight(0x111111, 0.3);
        this.scene.add(ambient);

        // Directional light for tunnel depth
        const directional = new THREE.DirectionalLight(0x222222, 0.5);
        directional.position.set(0, 5, 10);
        this.scene.add(directional);
    }

    /**
     * Update pattern state (called every frame)
     */
    update(network, audioData, beatData) {
        if (!this.scene) return;

        this.frameCount++;

        // Read control panel settings and apply to pattern
        this._applyUserSettings(network);

        // Map audio to visual parameters
        this._mapAudioToVisuals(audioData, beatData);

        // Update animations
        this._updateTunnelMotion();
        this._updateCentralPolygons();
        this._updateRadialNodes();
        this._updateParticles();

        // Handle beats
        if (beatData.isBeat && beatData.confidence > 0.6) {
            this._onBeat(beatData);
        }
    }

    /**
     * Apply user control panel settings to pattern parameters
     */
    _applyUserSettings(network) {
        // Get settings from main app (stored in network manager's parent)
        const app = window.cursorCam;
        if (!app) return;

        // Node Density → Number of particles (100-2000 maps to 500-3000 particles)
        const densityFactor = app.nodeDensity / 500; // Normalize around default 500
        const targetParticleCount = Math.floor(2000 * densityFactor);
        this._updateParticleCount(targetParticleCount);

        // Connection Range → Polygon count (50-300 maps to 3-8 polygons)
        const rangeFactor = (app.connectionRange - 50) / 250; // 0 to 1
        const targetPolygonCount = Math.floor(3 + rangeFactor * 5);
        this._updatePolygonCount(targetPolygonCount);

        // Color Intensity → Bloom strength multiplier (0.5-2.0)
        this.colorIntensityMultiplier = app.colorAggression;

        // Beat Sensitivity → Stored for beat detection (handled by beatDetector)
        // No action needed here, BeatDetector already uses it
    }

    /**
     * Map audio data to visual parameters
     */
    _mapAudioToVisuals(audioData, beatData) {
        // BASS → Polygon scale & tunnel pulse
        this.bassScale = 1.0 + (audioData.bassEnergy * 1.5);

        // MID → Rotation speed
        this.midRotationSpeed = 0.5 + (audioData.midEnergy * 3.0);

        // HIGH → Node brightness & particle density
        this.highBrightness = 1.0 + (audioData.highEnergy * 3.0);

        // Update bloom intensity based on total energy AND user color intensity
        const intensityMult = this.colorIntensityMultiplier || 1.0;
        if (this.bloomPass) {
            this.bloomPass.strength = (this.config.bloom.strength + (audioData.totalEnergy * 1.0)) * intensityMult;
        }
    }

    /**
     * Update tunnel motion for infinite forward movement
     */
    _updateTunnelMotion() {
        const speed = this.config.camera.speed * (1 / 60); // Normalize for frame rate

        this.tunnelOffset += speed;

        // Move tunnel segments
        this.tunnel.position.z += speed;
        this.tunnel2.position.z += speed;

        // Loop tunnel segments
        if (this.tunnel.position.z > this.config.tunnel.length / 2) {
            this.tunnel.position.z -= this.config.tunnel.length * 2;
        }
        if (this.tunnel2.position.z > this.config.tunnel.length / 2) {
            this.tunnel2.position.z -= this.config.tunnel.length * 2;
        }

        // Bass pulse effect on tunnel
        const pulseFactor = 1.0 + (Math.sin(this.frameCount * 0.1) * 0.05 * (this.bassScale - 1.0));
        this.tunnel.scale.set(pulseFactor, pulseFactor, 1);
        this.tunnel2.scale.set(pulseFactor, pulseFactor, 1);
    }

    /**
     * Update central wireframe polygons
     */
    _updateCentralPolygons() {
        for (const polygon of this.centralPolygons) {
            // Continuous rotation (mid-frequency driven)
            polygon.rotation.z += 0.01 * this.midRotationSpeed;

            // Bass-driven scale pulse
            const scale = polygon.userData.baseSize * this.bassScale;
            polygon.scale.set(scale, scale, 1);

            // Subtle Z-axis oscillation
            const zOffset = Math.sin(this.frameCount * 0.05 + polygon.userData.index) * 0.5;
            polygon.position.z = -10 - (polygon.userData.index * this.config.polygons.spacing) + zOffset;
        }
    }

    /**
     * Update radial glowing nodes
     */
    _updateRadialNodes() {
        for (const node of this.radialNodes) {
            // Orbital animation
            const orbitAngle = this.frameCount * 0.01 * this.config.nodes.orbitSpeed;
            const baseAngle = node.userData.angle;
            const totalAngle = baseAngle + orbitAngle;

            const x = Math.cos(totalAngle) * this.config.nodes.radius;
            const y = Math.sin(totalAngle) * this.config.nodes.radius;
            node.position.x = x;
            node.position.y = y;

            // Pulsing scale (bass + high frequency)
            const pulse = 1.0 + (this.bassScale - 1.0) * 0.3 + Math.sin(this.frameCount * 0.1 + node.userData.index) * 0.2;
            node.scale.setScalar(pulse);

            // Update light intensity (high frequency driven)
            if (node.userData.light) {
                node.userData.light.position.copy(node.position);
                node.userData.light.intensity = 2.0 * this.highBrightness;
            }
        }
    }

    /**
     * Update particle system
     */
    _updateParticles() {
        if (!this.particles) return;

        const positions = this.particles.geometry.attributes.position.array;
        const velocities = this.particles.userData.velocities;

        // Adjust particle count based on high frequencies
        const targetSize = 0.05 + (this.highBrightness - 1.0) * 0.05;
        this.particles.material.size = targetSize;

        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;

            // Move particles toward camera
            positions[i3 + 2] += velocities[i3 + 2] * (1 / 60) * (1 + (this.bassScale - 1.0) * 0.5);

            // Respawn particles at far end
            if (positions[i3 + 2] > 5) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.config.tunnel.radius * 0.8;
                positions[i3] = Math.cos(angle) * radius;
                positions[i3 + 1] = Math.sin(angle) * radius;
                positions[i3 + 2] = -this.config.tunnel.length;
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update particle count dynamically based on user settings
     */
    _updateParticleCount(targetCount) {
        if (!this.particles) return;

        const currentCount = this.particles.geometry.attributes.position.count;
        if (currentCount === targetCount) return; // No change needed

        // Recreate particle system with new count
        const positions = new Float32Array(targetCount * 3);
        const velocities = new Float32Array(targetCount * 3);

        for (let i = 0; i < targetCount; i++) {
            const i3 = i * 3;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.config.tunnel.radius;
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = Math.sin(angle) * radius;
            positions[i3 + 2] = -Math.random() * this.config.tunnel.length;
            velocities[i3 + 2] = this.config.particles.speed;
        }

        // Update geometry
        this.particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particles.userData.velocities = velocities;
    }

    /**
     * Update number of central polygons based on user settings
     */
    _updatePolygonCount(targetCount) {
        if (!this.polygonGroup) return;

        const currentCount = this.centralPolygons.length;
        if (currentCount === targetCount) return; // No change needed

        // Add or remove polygons
        if (targetCount > currentCount) {
            // Add polygons
            for (let i = currentCount; i < targetCount; i++) {
                const sides = i % 2 === 0 ? 6 : 10;
                const size = this.config.polygons.baseSize - (i * 0.15);
                const shape = this._createPolygonShape(sides, size);
                const material = new THREE.LineBasicMaterial({
                    color: i % 2 === 0 ? this.config.polygons.cyanColor : this.config.polygons.blueColor,
                    linewidth: 3
                });
                const polygon = new THREE.LineLoop(shape, material);
                polygon.position.z = -10 - (i * this.config.polygons.spacing);
                polygon.userData.baseSize = size;
                polygon.userData.rotationSpeed = 0.5 + (i * 0.15);
                polygon.userData.index = i;
                this.polygonGroup.add(polygon);
                this.centralPolygons.push(polygon);
            }
        } else {
            // Remove polygons
            for (let i = currentCount - 1; i >= targetCount; i--) {
                const polygon = this.centralPolygons[i];
                polygon.geometry.dispose();
                polygon.material.dispose();
                this.polygonGroup.remove(polygon);
                this.centralPolygons.pop();
            }
        }
    }

    /**
     * Handle beat events
     */
    _onBeat(beatData) {
        // Strong beat: morph polygon complexity
        if (beatData.confidence > 0.8) {
            for (let i = 0; i < this.centralPolygons.length; i++) {
                const polygon = this.centralPolygons[i];
                const newSides = Math.random() > 0.5 ? 6 : 10;
                const newGeometry = this._createPolygonShape(newSides, polygon.userData.baseSize);
                polygon.geometry.dispose();
                polygon.geometry = newGeometry;
            }
        }

        // Camera FOV pulse
        if (this.camera) {
            this.camera.fov = this.config.camera.fov + (beatData.confidence * 10);
            this.camera.updateProjectionMatrix();
        }
    }

    /**
     * Render the scene
     */
    render(renderer, network, audioData) {
        if (!this.composer || !this.scene || !this.camera) return;

        // Use Three.js post-processing composer
        this.composer.render();
    }

    /**
     * Cleanup when pattern is deactivated
     */
    onDeactivate() {
        console.log('🚀 Hyperspace Tunnel deactivating...');

        // Dispose geometries
        if (this.tunnel) {
            this.tunnel.geometry.dispose();
            this.tunnel.material.dispose();
        }
        if (this.tunnel2) {
            this.tunnel2.geometry.dispose();
            this.tunnel2.material.dispose();
        }

        this.centralPolygons.forEach(p => {
            p.geometry.dispose();
            p.material.dispose();
        });

        this.radialNodes.forEach(n => {
            n.geometry.dispose();
            n.material.dispose();
        });

        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }

        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }

        // Dispose composer
        if (this.composer) {
            this.composer.dispose();
        }

        // Clear scene
        if (this.scene) {
            this.scene.clear();
        }

        // Remove Three.js canvas from DOM
        if (this.threeCanvas && this.threeCanvas.parentElement) {
            this.threeCanvas.parentElement.removeChild(this.threeCanvas);
        }

        // Restore main 2D canvas
        const mainCanvas = document.getElementById('constellation-canvas');
        if (mainCanvas) {
            mainCanvas.style.display = 'block';
        }

        this.centralPolygons = [];
        this.radialNodes = [];
        this.threeCanvas = null;
    }
}
