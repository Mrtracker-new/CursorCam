/**
 * LightningSystem.js
 * Signature cyberpunk lightning engine with jagged neon bolts
 */

import * as THREE from 'three';

export class LightningSystem {
  constructor(scene, colorManager) {
    this.scene = scene;
    this.colorManager = colorManager;

    // Active lightning bolts
    this.activeBolts = [];
    this.maxBolts = 10;

    // Configuration
    this.config = {
      bolt: {
        segments: 8,
        jaggedness: 0.5,
        thickness: 0.05,
        lifespan: 100, // ms
        spawnRadius: 8,
      },
      intensity: 1.0, // User-adjustable multiplier
    };
  }

  /**
   * Update lightning system
   */
  update(audioData, stateVisuals) {
    // Check for lightning triggers
    this.checkTriggers(audioData, stateVisuals);

    // Update active bolts
    this.updateBolts();
  }

  /**
   * Check audio triggers for lightning
   */
  checkTriggers(audioData, stateVisuals) {
    const intensity = stateVisuals.lightningIntensity * this.config.intensity;

    // High-frequency spike trigger
    if (audioData.highSpikeIntensity > 0.7) {
      const color = this.colorManager.getLightningColor('spike');
      this.spawnBolt(
        new THREE.Vector3(0, 0, -10),
        this.getRandomEdgePoint(),
        color,
        audioData.highSpikeIntensity * intensity
      );
    }

    // Strong beat trigger
    if (audioData.isBeat && audioData.beatConfidence > 0.8) {
      const color = this.colorManager.getLightningColor('beat');
      this.spawnBolt(
        new THREE.Vector3(0, 0, -10),
        this.getRandomEdgePoint(),
        color,
        audioData.beatConfidence * intensity
      );
    }

    // Beat drop explosion
    if (audioData.isBeatDrop && audioData.beatDropIntensity > 0.5) {
      this.spawnExplosion(
        new THREE.Vector3(0, 0, -10),
        Math.floor(6 * audioData.beatDropIntensity),
        intensity
      );
    }
  }

  /**
   * Spawn a single lightning bolt
   */
  spawnBolt(origin, target, color, intensity) {
    if (this.activeBolts.length >= this.maxBolts) {
      // Remove oldest bolt
      const oldest = this.activeBolts.shift();
      this.scene.remove(oldest.mesh);
      oldest.mesh.geometry.dispose();
      oldest.mesh.material.dispose();
    }

    // Generate jagged path
    const points = this.generateJaggedPath(origin, target, this.config.bolt.segments);

    // Create geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Create material with additive blending
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8 + intensity * 0.2,
      linewidth: 2,
      blending: THREE.AdditiveBlending,
    });

    const bolt = new THREE.Line(geometry, material);
    this.scene.add(bolt);

    // Store bolt data
    this.activeBolts.push({
      mesh: bolt,
      spawnTime: Date.now(),
      lifespan: this.config.bolt.lifespan,
      intensity,
    });
  }

  /**
   * Spawn lightning explosion (multiple bolts from center)
   */
  spawnExplosion(origin, rayCount, intensity) {
    const color = this.colorManager.getLightningColor('drop');

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const radius = this.config.bolt.spawnRadius;
      const target = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        origin.z
      );

      // Slight delay between bolts for staggered effect
      setTimeout(() => {
        this.spawnBolt(origin, target, color, intensity);
      }, i * 20);
    }
  }

  /**
   * Generate jagged lightning path
   */
  generateJaggedPath(start, end, segments) {
    const points = [start.clone()];

    const direction = new THREE.Vector3().subVectors(end, start);
    const segmentLength = direction.length() / segments;
    direction.normalize();

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);

      // Add perpendicular offset for jaggedness
      const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0);

      const offset = (Math.random() - 0.5) * this.config.bolt.jaggedness;
      point.add(perpendicular.multiplyScalar(offset));

      // Add random Z offset
      point.z += (Math.random() - 0.5) * 0.5;

      points.push(point);
    }

    points.push(end.clone());

    return points;
  }

  /**
   * Get random point on edge of visible area
   */
  getRandomEdgePoint() {
    const radius = this.config.bolt.spawnRadius;
    const angle = Math.random() * Math.PI * 2;

    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      -10 + (Math.random() - 0.5) * 5
    );
  }

  /**
   * Update active bolts (fade out and remove)
   */
  updateBolts() {
    const now = Date.now();

    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      const bolt = this.activeBolts[i];
      const age = now - bolt.spawnTime;

      if (age >= bolt.lifespan) {
        // Remove expired bolt
        this.scene.remove(bolt.mesh);
        bolt.mesh.geometry.dispose();
        bolt.mesh.material.dispose();
        this.activeBolts.splice(i, 1);
      } else {
        // Fade out
        const fadeProgress = age / bolt.lifespan;
        bolt.mesh.material.opacity = (1 - fadeProgress) * (0.8 + bolt.intensity * 0.2);
      }
    }
  }

  /**
   * Set lightning intensity (user control)
   */
  setIntensity(intensity) {
    this.config.intensity = Math.max(0, Math.min(2, intensity));
  }

  /**
   * Cleanup
   */
  dispose() {
    for (const bolt of this.activeBolts) {
      this.scene.remove(bolt.mesh);
      bolt.mesh.geometry.dispose();
      bolt.mesh.material.dispose();
    }
    this.activeBolts = [];
  }
}
