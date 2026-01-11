/**
 * DigitalRainSystem.js
 * Matrix-style digital rain effect with falling characters
 */

import * as THREE from 'three';

export class DigitalRainSystem {
    constructor(scene, colorManager) {
        this.scene = scene;
        this.colorManager = colorManager;

        // Rain columns
        this.columns = [];
        this.columnCount = 30;
        this.columnSpacing = 0.8;

        // Character set (Katakana + symbols + numbers)
        this.characters = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01234567890!@#$%^&*()';

        // Canvas for character texture
        this.canvas = null;
        this.texture = null;

        // State
        this.enabled = true;
        this.particleSystem = null;
    }

    /**
     * Create the digital rain effect
     */
    create() {
        // Create canvas texture with characters
        this._createCharacterTexture();

        // Create particle system for rain
        this._createRainParticles();
    }

    /**
     * Create character texture atlas
     */
    _createCharacterTexture() {
        const size = 512;
        this.canvas = document.createElement('canvas');
        this.canvas.width = size;
        this.canvas.height = size;

        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);

        // Draw character grid (8x8 = 64 characters)
        const gridSize = 8;
        const charSize = size / gridSize;
        ctx.font = `${charSize * 0.8}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const index = row * gridSize + col;
                if (index < this.characters.length) {
                    const char = this.characters[index];
                    const x = col * charSize + charSize / 2;
                    const y = row * charSize + charSize / 2;

                    // Green glow
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText(char, x, y);
                }
            }
        }

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.needsUpdate = true;
    }

    /**
     * Create rain particle system
     */
    _createRainParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const uvOffsets = []; // For character cycling
        const brightnesses = [];

        // Create columns
        for (let col = 0; col < this.columnCount; col++) {
            const columnX = (col - this.columnCount / 2) * this.columnSpacing;
            const dropsInColumn = Math.floor(Math.random() * 15) + 10;

            for (let i = 0; i < dropsInColumn; i++) {
                // Position
                positions.push(
                    columnX,
                    Math.random() * 20 - 5,
                    -10 - Math.random() * 10
                );

                // Velocity (fall speed)
                velocities.push(0, -(0.1 + Math.random() * 0.2), 0);

                // UV offset for character index
                uvOffsets.push(Math.floor(Math.random() * 64));

                // Brightness (head of trail is brightest)
                brightnesses.push(Math.random());
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('uvOffset', new THREE.Float32BufferAttribute(uvOffsets, 1));
        geometry.setAttribute('brightness', new THREE.Float32BufferAttribute(brightnesses, 1));

        // Material with character texture
        const material = new THREE.PointsMaterial({
            size: 0.3,
            map: this.texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: false,
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    /**
     * Update rain animation
     */
    update(audioData, stateVisuals) {
        if (!this.enabled || !this.particleSystem) {
            return;
        }

        const positions = this.particleSystem.geometry.attributes.position.array;
        const velocities = this.particleSystem.geometry.attributes.velocity.array;
        const brightnesses = this.particleSystem.geometry.attributes.brightness.array;

        // Audio-reactive parameters
        const highValue = audioData.highs || audioData.highEnergy || 0;
        const midValue = audioData.mids || audioData.midEnergy || 0;
        const speedMultiplier = 1 + midValue * 2;

        // Update each particle
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;

            // Move particle down
            positions[i3 + 1] += velocities[i3 + 1] * speedMultiplier;

            // Reset if below threshold
            if (positions[i3 + 1] < -10) {
                positions[i3 + 1] = 15 + Math.random() * 5;
                brightnesses[i] = Math.random();
            }

            // Change character occasionally
            if (Math.random() < 0.02 + highValue * 0.1) {
                const uvOffsets = this.particleSystem.geometry.attributes.uvOffset.array;
                uvOffsets[i] = Math.floor(Math.random() * 64);
                this.particleSystem.geometry.attributes.uvOffset.needsUpdate = true;
            }
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.brightness.needsUpdate = true;

        // Update color from ColorManager
        const primaryColor = this.colorManager.getPrimaryColor();
        this.particleSystem.material.color.setHex(primaryColor);

        // Brightness based on state
        const brightness = stateVisuals.particleDensity || 1.0;
        this.particleSystem.material.opacity = 0.6 * brightness;
    }

    /**
     * Set enabled state
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.particleSystem) {
            this.particleSystem.visible = enabled;
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.particleSystem) {
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
            this.scene.remove(this.particleSystem);
        }
        if (this.texture) {
            this.texture.dispose();
        }
    }
}
