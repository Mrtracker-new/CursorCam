/**
 * NeonGridSystem.js
 * Pulsing neon grid (Tron-style floor)
 */

import * as THREE from 'three';

export class NeonGridSystem {
  constructor(scene, colorManager) {
    this.scene = scene;
    this.colorManager = colorManager;

    // Grid settings
    this.gridSize = 50;
    this.gridDivisions = 50;
    this.gridHeight = -5;

    // State
    this.enabled = true;
    this.grid = null;
    this.pulsePhase = 0;
  }

  /**
   * Create the neon grid
   */
  create() {
    // Create grid geometry
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const halfSize = this.gridSize / 2;
    const step = this.gridSize / this.gridDivisions;

    // Horizontal lines
    for (let i = 0; i <= this.gridDivisions; i++) {
      const z = -halfSize + i * step;
      positions.push(-halfSize, this.gridHeight, z);
      positions.push(halfSize, this.gridHeight, z);

      // Initial color (will be updated)
      colors.push(0, 1, 1, 0, 1, 1);
    }

    // Vertical lines
    for (let i = 0; i <= this.gridDivisions; i++) {
      const x = -halfSize + i * step;
      positions.push(x, this.gridHeight, -halfSize);
      positions.push(x, this.gridHeight, halfSize);

      colors.push(0, 1, 1, 0, 1, 1);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Shader material for pulsing effect
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.grid = new THREE.LineSegments(geometry, material);
    this.scene.add(this.grid);
  }

  /**
   * Update grid animation
   */
  update(audioData, stateVisuals) {
    if (!this.enabled || !this.grid) {
      return;
    }

    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const totalEnergy = audioData.totalEnergy || 0;

    // Pulse phase
    this.pulsePhase += 0.05 + bassValue * 0.2;
    const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;

    // Update colors based on pulse and audio
    const colors = this.grid.geometry.attributes.color.array;
    const primaryColor = new THREE.Color(this.colorManager.getPrimaryColor());
    const secondaryColor = new THREE.Color(this.colorManager.getSecondaryColor());

    // Interpolate between primary and secondary based on pulse
    const mixedColor = new THREE.Color();

    for (let i = 0; i < colors.length / 3; i++) {
      const i3 = i * 3;

      // Create wave pattern along grid
      const lineIndex = Math.floor(i / 2);
      const waveFactor = Math.sin(lineIndex * 0.2 + this.pulsePhase) * 0.5 + 0.5;

      mixedColor.lerpColors(primaryColor, secondaryColor, waveFactor);

      // Boost brightness on bass
      const brightnessMult = 1 + bassValue * 1.5;

      colors[i3] = mixedColor.r * brightnessMult;
      colors[i3 + 1] = mixedColor.g * brightnessMult;
      colors[i3 + 2] = mixedColor.b * brightnessMult;
    }

    this.grid.geometry.attributes.color.needsUpdate = true;

    // Update opacity based on state
    const opacity = 0.4 + totalEnergy * 0.4 + bassValue * 0.2;
    this.grid.material.opacity = Math.min(opacity, 0.9);
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.grid) {
      this.grid.visible = enabled;
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.grid) {
      this.grid.geometry.dispose();
      this.grid.material.dispose();
      this.scene.remove(this.grid);
    }
  }
}
