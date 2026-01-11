/**
 * AudioLandscape.js
 * Audio-reactive 3D terrain landscape using Three.js
 * Terrain morphs based on audio frequencies with infinite scrolling
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { PatternBase } from './PatternBase.js';

/**
 * SimplexNoise implementation for terrain detail
 */
class SimplexNoise {
    constructor() {
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        this.perm = [];
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }

    dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }

    noise(xin, yin) {
        let n0, n1, n2;
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        let i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii + this.perm[jj]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        return 70.0 * (n0 + n1 + n2);
    }
}

/**
 * Audio Landscape - 3D Terrain Audio-Reactive Pattern
 */
export class AudioLandscape extends PatternBase {
    constructor() {
        super('Audio Landscape');

        // Flag to indicate this is a Three.js pattern
        this.isThreeJSPattern = true;

        // Three.js core components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;

        // Visual elements
        this.terrain1 = null;
        this.terrain2 = null;
        this.lights = [];

        // Animation state
        this.frameCount = 0;
        this.terrainOffset = 0;
        this.cameraPath = 0;
        this.noise = new SimplexNoise();

        // Audio-reactive parameters
        this.bassAmplitude = 1.0;
        this.midColorShift = 0.5;
        this.highNoiseIntensity = 0.5;

        // Configuration
        this.config = {
            terrain: {
                width: 100,
                depth: 100,
                segments: 128,
                heightScale: 15, // Much more dramatic peaks
                scrollSpeed: 0.3,
            },
            camera: {
                height: 15,
                distance: 30,
                fov: 75,
                lookAhead: 20,
            },
            colors: {
                coolBlue: new THREE.Color(0x00d4ff), // Brighter, more vivid cyan
                warmOrange: new THREE.Color(0xff8800), // Brighter orange
                skyColor: new THREE.Color(0x0a0520), // Deep purple-tinted space
                fogColor: new THREE.Color(0x2a1555), // Purple fog
            },
            bloom: {
                strength: 0.8, // Moderate bloom for subtle glow
                threshold: 0.5, // Higher threshold - only bright elements glow
                radius: 0.6, // Tighter glow spread
            },
            stars: {
                count: 500, // Number of star particles
                spread: 200, // How far they spread
                size: 2.0, // Star size
            },
        };

        // Quality presets
        this.qualityPresets = {
            low: {
                segments: 32,
                bloomEnabled: true, // Enable bloom even on low for the aesthetic
                useFXAA: true,
                pixelRatio: 1.0,
                updateFrequency: 2,
                starCount: 200,
            },
            medium: {
                segments: 64,
                bloomEnabled: true,
                useFXAA: true,
                pixelRatio: 1.5,
                updateFrequency: 1,
                starCount: 350,
            },
            high: {
                segments: 128,
                bloomEnabled: true,
                useFXAA: false,
                pixelRatio: 2.0,
                updateFrequency: 1,
                starCount: 500,
            },
            ultra: {
                segments: 256,
                bloomEnabled: true,
                useFXAA: false,
                pixelRatio: 2.0,
                updateFrequency: 1,
                starCount: 800,
            },
        };

        this.currentQuality = 'high';
    }

    /**
     * Initialize Three.js scene
     */
    onActivate() {
        console.log('🏔️ Audio Landscape activating...');

        const mainCanvas = document.getElementById('constellation-canvas');
        if (!mainCanvas) {
            console.error('Canvas not found!');
            return;
        }

        // Create separate canvas for Three.js
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
        mainCanvas.style.display = 'none';

        // Initialize Three.js
        this._initScene();
        this._initRenderer(threeCanvas);
        this._initCamera(threeCanvas);
        this._initPostProcessing();

        // Create visual elements
        this._createTerrain();
        this._createStarField(); // Add starry sky
        this._setupLighting();

        console.log('✅ Audio Landscape ready');
    }

    /**
   * Initialize scene
   */
    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = this.config.colors.skyColor;
        // Purple-tinted fog for depth
        this.scene.fog = new THREE.FogExp2(this.config.colors.fogColor, 0.015);
    }

    /**
     * Initialize renderer
     */
    _initRenderer(canvas) {
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
        });
        this.renderer.setSize(canvas.width, canvas.height);

        const qualitySettings = this.qualityPresets[this.currentQuality];
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualitySettings.pixelRatio));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.6; // Lower exposure to prevent washout
    }

    /**
     * Initialize camera
     */
    _initCamera(canvas) {
        const aspect = canvas.width / canvas.height;
        this.camera = new THREE.PerspectiveCamera(this.config.camera.fov, aspect, 0.1, 500);
        this.camera.position.set(0, this.config.camera.height, this.config.camera.distance);
        this.camera.lookAt(0, 0, -this.config.camera.lookAhead);
    }

    /**
     * Initialize post-processing
     */
    _initPostProcessing() {
        const canvas = document.getElementById('constellation-canvas');
        const qualitySettings = this.qualityPresets[this.currentQuality];

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        if (qualitySettings.bloomEnabled) {
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(canvas.width, canvas.height),
                this.config.bloom.strength,
                this.config.bloom.radius,
                this.config.bloom.threshold
            );
            this.composer.addPass(bloomPass);
            this.bloomPass = bloomPass;
        } else if (qualitySettings.useFXAA) {
            const fxaaPass = new ShaderPass(FXAAShader);
            const pixelRatio = this.renderer.getPixelRatio();
            fxaaPass.material.uniforms['resolution'].value.x = 1 / (canvas.width * pixelRatio);
            fxaaPass.material.uniforms['resolution'].value.y = 1 / (canvas.height * pixelRatio);
            this.composer.addPass(fxaaPass);
            this.fxaaPass = fxaaPass;
        }
    }

    /**
     * Create terrain geometry with custom shader
     */
    _createTerrain() {
        const qualitySettings = this.qualityPresets[this.currentQuality];
        const segments = qualitySettings.segments;

        // Terrain geometry
        const geometry = new THREE.PlaneGeometry(
            this.config.terrain.width,
            this.config.terrain.depth,
            segments,
            segments
        );
        geometry.rotateX(-Math.PI / 2); // Make it horizontal

        // Store original positions for morphing
        const positions = geometry.attributes.position.array;
        const originalPositions = new Float32Array(positions.length);
        for (let i = 0; i < positions.length; i++) {
            originalPositions[i] = positions[i];
        }

        // Custom shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uBassAmplitude: { value: 1.0 },
                uMidColorShift: { value: 0.5 },
                uHighNoiseIntensity: { value: 0.5 },
                uCoolColor: { value: this.config.colors.coolBlue },
                uWarmColor: { value: this.config.colors.warmOrange },
            },
            vertexShader: `
        uniform float uTime;
        uniform float uBassAmplitude;
        uniform float uHighNoiseIntensity;
        
        varying vec3 vPosition;
        varying float vHeight;
        
        // Simplex noise function (simplified)
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        void main() {
          vPosition = position;
          
          // Base terrain wave
          float wave1 = sin(position.x * 0.2 + uTime * 0.5) * 2.0;
          float wave2 = cos(position.z * 0.15 + uTime * 0.3) * 1.5;
          
          // Noise layers for detail
          float noise1 = snoise(vec2(position.x * 0.05, position.z * 0.05 + uTime * 0.1)) * 3.0;
          float noise2 = snoise(vec2(position.x * 0.1, position.z * 0.1 + uTime * 0.15)) * 1.5 * uHighNoiseIntensity;
          
          // Combine height
          float height = (wave1 + wave2 + noise1 + noise2) * uBassAmplitude;
          
          vHeight = height;
          
          vec3 newPosition = position;
          newPosition.y = height;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 uCoolColor;
        uniform vec3 uWarmColor;
        uniform float uMidColorShift;
        
        varying vec3 vPosition;
        varying float vHeight;
        
        void main() {
          // Color based on height and mid frequencies
          float colorMix = (vHeight / 10.0 + 0.5) * uMidColorShift;
          colorMix = clamp(colorMix, 0.0, 1.0);
          
          vec3 color = mix(uCoolColor, uWarmColor, colorMix);
          
          // Add subtle gradient based on distance
          float distanceFade = 1.0 - (length(vPosition.xz) / 70.0);
          distanceFade = clamp(distanceFade, 0.3, 1.0);
          
          gl_FragColor = vec4(color * distanceFade, 1.0);
        }
      `,
            wireframe: false,
            side: THREE.DoubleSide,
        });

        // Create two terrain meshes for infinite scrolling
        this.terrain1 = new THREE.Mesh(geometry, material);
        this.terrain1.position.z = 0;
        this.terrain1.userData.originalPositions = originalPositions;
        this.scene.add(this.terrain1);

        this.terrain2 = new THREE.Mesh(geometry.clone(), material.clone());
        this.terrain2.position.z = -this.config.terrain.depth;
        this.terrain2.material.uniforms = { ...material.uniforms };
        this.terrain2.userData.originalPositions = originalPositions.slice();
        this.scene.add(this.terrain2);

        // Add VIBRANT wireframe overlay - much brighter and more prominent
        const wireframeGeo = geometry.clone();

        // Create shader material for wireframe that matches terrain displacement
        const wireframeMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uBassAmplitude: { value: 1.0 },
                uHighNoiseIntensity: { value: 0.5 },
                uWireColor: { value: new THREE.Color(0x00ffff) }, // Vivid cyan
            },
            vertexShader: `
                uniform float uTime;
                uniform float uBassAmplitude;
                uniform float uHighNoiseIntensity;
                
                // Simplex noise (same as terrain)
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
                
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                
                void main() {
                    // Same displacement as terrain
                    float wave1 = sin(position.x * 0.2 + uTime * 0.5) * 2.0;
                    float wave2 = cos(position.z * 0.15 + uTime * 0.3) * 1.5;
                    float noise1 = snoise(vec2(position.x * 0.05, position.z * 0.05 + uTime * 0.1)) * 3.0;
                    float noise2 = snoise(vec2(position.x * 0.1, position.z * 0.1 + uTime * 0.15)) * 1.5 * uHighNoiseIntensity;
                    float height = (wave1 + wave2 + noise1 + noise2) * uBassAmplitude;
                    
                    vec3 newPosition = position;
                    newPosition.y = height + 0.1; // Slightly above terrain to prevent z-fighting
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uWireColor;
                
                void main() {
                    gl_FragColor = vec4(uWireColor, 0.6); // Semi-transparent cyan wireframe
                }
            `,
            wireframe: true,
            transparent: true, // Semi-transparent for better balance
        });

        const wireframe1 = new THREE.Mesh(wireframeGeo, wireframeMat);
        wireframe1.position.copy(this.terrain1.position);
        wireframe1.rotation.copy(this.terrain1.rotation);
        this.scene.add(wireframe1);
        this.wireframe1 = wireframe1;

        const wireframe2 = new THREE.Mesh(wireframeGeo.clone(), wireframeMat.clone());
        wireframe2.material.uniforms = { ...wireframeMat.uniforms }; // Clone uniforms
        wireframe2.position.copy(this.terrain2.position);
        wireframe2.rotation.copy(this.terrain2.rotation);
        this.scene.add(wireframe2);
        this.wireframe2 = wireframe2;
    }

    /**
     * Create starry sky background
     */
    _createStarField() {
        const qualitySettings = this.qualityPresets[this.currentQuality];
        const starCount = qualitySettings.starCount || this.config.stars.count;

        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;

            // Random position in a large sphere around camera
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = this.config.stars.spread + Math.random() * 100;

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = Math.abs(radius * Math.sin(phi) * Math.sin(theta)); // Keep above horizon
            positions[i3 + 2] = radius * Math.cos(phi) - 150; // Behind camera

            // Random colors (cyan, blue, purple, white spectrum)
            const colorChoice = Math.random();
            if (colorChoice < 0.3) {
                // Cyan stars
                colors[i3] = 0.0;
                colors[i3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i3 + 2] = 1.0;
            } else if (colorChoice < 0.6) {
                // Purple stars
                colors[i3] = 0.6 + Math.random() * 0.4;
                colors[i3 + 1] = 0.2;
                colors[i3 + 2] = 1.0;
            } else {
                // White/blue stars
                colors[i3] = 0.8 + Math.random() * 0.2;
                colors[i3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i3 + 2] = 1.0;
            }

            // Random sizes
            sizes[i] = this.config.stars.size * (0.5 + Math.random() * 1.5);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: this.config.stars.size,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
        });

        this.starField = new THREE.Points(geometry, material);
        this.scene.add(this.starField);
    }

    /**
     * Setup lighting
     */
    _setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 1.0);
        this.scene.add(ambient);

        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);

        // Point lights that follow terrain peaks
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(0x00ffff, 2, 30);
            light.position.set(-30 + i * 30, 10, -20);
            this.scene.add(light);
            this.lights.push(light);
        }
    }

    /**
     * Update pattern
     */
    update(network, audioData, beatData) {
        if (!this.scene) {
            return;
        }

        this.frameCount++;

        const qualitySettings = this.qualityPresets[this.currentQuality];

        // Skip updates based on quality (performance optimization)
        if (this.frameCount % qualitySettings.updateFrequency !== 0) {
            return;
        }

        // Map audio to visual parameters
        this._mapAudioToVisuals(audioData, beatData);

        // Update terrain
        this._updateTerrain();

        // Update camera
        this._updateCamera(audioData);

        // Update lights
        this._updateLights(audioData);
    }

    /**
     * Map audio to visual parameters
     */
    _mapAudioToVisuals(audioData, beatData) {
        // Bass → Terrain height amplitude
        this.bassAmplitude = 0.5 + audioData.bassEnergy * 2.5;

        // Mid → Color shift
        this.midColorShift = 0.3 + audioData.midEnergy * 0.7;

        // High → Noise/detail intensity
        this.highNoiseIntensity = 0.3 + audioData.highEnergy * 1.5;

        // Update bloom on beat
        if (this.bloomPass && beatData.isBeat) {
            this.bloomPass.strength = this.config.bloom.strength + beatData.confidence * 1.0;
        } else if (this.bloomPass) {
            // Smoothly return to normal
            this.bloomPass.strength += (this.config.bloom.strength - this.bloomPass.strength) * 0.1;
        }
    }

    /**
     * Update terrain morphing and scrolling
     */
    _updateTerrain() {
        const time = this.frameCount * 0.02;

        // Update TERRAIN shader uniforms
        if (this.terrain1 && this.terrain1.material.uniforms) {
            this.terrain1.material.uniforms.uTime.value = time;
            this.terrain1.material.uniforms.uBassAmplitude.value = this.bassAmplitude;
            this.terrain1.material.uniforms.uMidColorShift.value = this.midColorShift;
            this.terrain1.material.uniforms.uHighNoiseIntensity.value = this.highNoiseIntensity;
        }

        if (this.terrain2 && this.terrain2.material.uniforms) {
            this.terrain2.material.uniforms.uTime.value = time;
            this.terrain2.material.uniforms.uBassAmplitude.value = this.bassAmplitude;
            this.terrain2.material.uniforms.uMidColorShift.value = this.midColorShift;
            this.terrain2.material.uniforms.uHighNoiseIntensity.value = this.highNoiseIntensity;
        }

        // Update WIREFRAME shader uniforms to match terrain displacement
        if (this.wireframe1 && this.wireframe1.material.uniforms) {
            this.wireframe1.material.uniforms.uTime.value = time;
            this.wireframe1.material.uniforms.uBassAmplitude.value = this.bassAmplitude;
            this.wireframe1.material.uniforms.uHighNoiseIntensity.value = this.highNoiseIntensity;
        }

        if (this.wireframe2 && this.wireframe2.material.uniforms) {
            this.wireframe2.material.uniforms.uTime.value = time;
            this.wireframe2.material.uniforms.uBassAmplitude.value = this.bassAmplitude;
            this.wireframe2.material.uniforms.uHighNoiseIntensity.value = this.highNoiseIntensity;
        }

        // Infinite scrolling
        const scrollSpeed = this.config.terrain.scrollSpeed;
        this.terrain1.position.z += scrollSpeed;
        this.terrain2.position.z += scrollSpeed;

        if (this.wireframe1) this.wireframe1.position.z += scrollSpeed;
        if (this.wireframe2) this.wireframe2.position.z += scrollSpeed;

        // Loop terrains
        if (this.terrain1.position.z > this.config.terrain.depth) {
            this.terrain1.position.z -= this.config.terrain.depth * 2;
            if (this.wireframe1) this.wireframe1.position.z = this.terrain1.position.z;
        }
        if (this.terrain2.position.z > this.config.terrain.depth) {
            this.terrain2.position.z -= this.config.terrain.depth * 2;
            if (this.wireframe2) this.wireframe2.position.z = this.terrain2.position.z;
        }
    }

    /**
     * Update camera flyover animation
     */
    _updateCamera(audioData) {
        this.cameraPath += 0.005;

        // Subtle side-to-side motion
        const sway = Math.sin(this.cameraPath) * 5;
        this.camera.position.x = sway;

        // Altitude variation based on total energy
        const energyHeight = this.config.camera.height + audioData.totalEnergy * 3;
        this.camera.position.y += (energyHeight - this.camera.position.y) * 0.05;

        // Always look ahead
        const lookX = sway * 0.5;
        const lookY = 2;
        const lookZ = -this.config.camera.lookAhead;
        this.camera.lookAt(lookX, lookY, lookZ);
    }

    /**
     * Update point lights
     */
    _updateLights(audioData) {
        for (let i = 0; i < this.lights.length; i++) {
            const light = this.lights[i];

            // Pulse intensity with audio
            light.intensity = 1.5 + audioData.totalEnergy * 1.5;

            // Move lights with terrain scroll
            light.position.z += this.config.terrain.scrollSpeed;

            // Reset position when too far
            if (light.position.z > 50) {
                light.position.z = -50;
            }

            // Oscillate height
            const baseY = 10 + Math.sin(this.frameCount * 0.02 + i) * 3;
            light.position.y = baseY + audioData.bassEnergy * 5;
        }
    }

    /**
     * Render pattern
     */
    render(renderer, network, audioData) {
        if (!this.composer) {
            return;
        }

        // Render using composer (with post-processing)
        this.composer.render();
    }

    /**
     * Cleanup when pattern is deactivated
     */
    onDeactivate() {
        console.log('🏔️ Audio Landscape deactivating...');

        // Remove Three.js canvas
        if (this.threeCanvas && this.threeCanvas.parentElement) {
            this.threeCanvas.parentElement.removeChild(this.threeCanvas);
        }

        // Show main canvas
        const mainCanvas = document.getElementById('constellation-canvas');
        if (mainCanvas) {
            mainCanvas.style.display = 'block';
        }

        // Dispose Three.js resources
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.composer) {
            this.composer.dispose();
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
    }

    /**
     * Set quality (public API)
     */
    setQuality(quality) {
        if (!this.qualityPresets[quality]) {
            console.warn(`Invalid quality: ${quality}`);
            return;
        }

        if (quality === this.currentQuality) {
            return;
        }

        console.log(`✨ Quality changed: ${this.currentQuality} → ${quality}`);
        this.currentQuality = quality;

        // Rebuild terrain if active
        if (this.scene) {
            this._rebuildTerrain();
            this._updatePostProcessing();
        }
    }

    /**
     * Rebuild terrain with new quality settings
     */
    _rebuildTerrain() {
        // Remove old terrain
        if (this.terrain1) this.scene.remove(this.terrain1);
        if (this.terrain2) this.scene.remove(this.terrain2);
        if (this.wireframe1) this.scene.remove(this.wireframe1);
        if (this.wireframe2) this.scene.remove(this.wireframe2);

        // Create new terrain
        this._createTerrain();
    }

    /**
     * Update post-processing based on quality
     */
    _updatePostProcessing() {
        if (!this.composer) {
            return;
        }

        // Reinitialize post-processing
        this._initPostProcessing();
    }
}
