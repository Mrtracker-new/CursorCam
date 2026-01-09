/**
 * ParticleEngine.js
 * High-energy neon spark particle system
 */

import * as THREE from 'three';

export class ParticleEngine {
  constructor(scene, colorManager) {
    this.scene = scene;
    this.colorManager = colorManager;

    // Particle system
    this.particles = null;
    this.particleCount = 2000;
    this.velocities = null;
    this.lifetimes = null;
    this.ages = null;
    this.colors = null;

    // Configuration
    this.config = {
      maxLifetime: 60, // frames
      spawnSpeed: 5.0,
      burstSpeed: 15.0,
      density: 1.0, // User-adjustable multiplier
    };
  }

  /**
   * Create particle system
   */
  create() {
    const positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);
    this.ages = new Float32Array(this.particleCount);
    const colors = new Float32Array(this.particleCount * 3);
    this.colors = colors;

    // Initialize particles as inactive
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = -100; // Off-screen
      this.lifetimes[i] = 0;
      this.ages[i] = 999; // Expired
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  /**
   * Update particle system
   */
  update(audioData, stateVisuals) {
    if (!this.particles) {
      return;
    }

    const positions = this.particles.geometry.attributes.position.array;
    const densityMult = this.config.density * stateVisuals.particleDensity;

    // Update existing particles
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Age particle
      this.ages[i]++;

      if (this.ages[i] < this.lifetimes[i]) {
        // Active particle - update position
        positions[i3] += this.velocities[i3];
        positions[i3 + 1] += this.velocities[i3 + 1];
        positions[i3 + 2] += this.velocities[i3 + 2];

        // Fade out based on age
        const fadeProgress = this.ages[i] / this.lifetimes[i];
        const alpha = 1.0 - fadeProgress;
        this.particles.material.opacity = 0.8 * alpha;
      } else {
        // Dead particle - move off-screen
        positions[i3 + 2] = -100;
      }
    }

    // Spawn new particles based on audio
    if (audioData.isBeat) {
      this.spawnBeatBurst(audioData, densityMult);
    }

    // Ambient particle spawn (minimal)
    if (Math.random() < 0.1 * densityMult && audioData.totalEnergy > 0.3) {
      this.spawnAmbientParticle(audioData);
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Spawn burst of particles on beat
   */
  spawnBeatBurst(audioData, densityMult) {
    const burstCount = Math.floor(20 * audioData.beatConfidence * densityMult);

    // Determine dominant frequency for color
    let color, band;
    if (audioData.bass > audioData.mids && audioData.bass > audioData.highs) {
      color = this.colorManager.palette.neonPink;
      band = 'bass';
    } else if (audioData.highs > audioData.bass && audioData.highs > audioData.mids) {
      color = this.colorManager.palette.white;
      band = 'high';
    } else {
      color = this.colorManager.palette.electricCyan;
      band = 'mid';
    }

    for (let i = 0; i < burstCount; i++) {
      this.spawnParticle(
        new THREE.Vector3(0, 0, -10),
        this.getRandomDirection(),
        color,
        this.config.burstSpeed * audioData.beatStrength,
        this.config.maxLifetime
      );
    }
  }

  /**
   * Spawn ambient particle
   */
  spawnAmbientParticle(audioData) {
    const color = this.colorManager.getDominantColor(audioData);
    const origin = new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, -10);

    this.spawnParticle(
      origin,
      this.getRandomDirection(),
      color,
      this.config.spawnSpeed,
      this.config.maxLifetime
    );
  }

  /**
   * Spawn a single particle
   */
  spawnParticle(origin, direction, color, speed, lifetime) {
    // Find dead particle slot
    let slot = -1;
    for (let i = 0; i < this.particleCount; i++) {
      if (this.ages[i] >= this.lifetimes[i]) {
        slot = i;
        break;
      }
    }

    if (slot === -1) {
      return;
    } // No available slots

    const i3 = slot * 3;

    // Set position
    const positions = this.particles.geometry.attributes.position.array;
    positions[i3] = origin.x;
    positions[i3 + 1] = origin.y;
    positions[i3 + 2] = origin.z;

    // Set velocity
    this.velocities[i3] = direction.x * speed;
    this.velocities[i3 + 1] = direction.y * speed;
    this.velocities[i3 + 2] = direction.z * speed;

    // Set color
    const colorObj = new THREE.Color(color);
    this.colors[i3] = colorObj.r;
    this.colors[i3 + 1] = colorObj.g;
    this.colors[i3 + 2] = colorObj.b;

    // Set lifetime
    this.lifetimes[slot] = lifetime;
    this.ages[slot] = 0;

    this.particles.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Get random direction (outward burst)
   */
  getRandomDirection() {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi) * 0.3 // Flatten Z spread
    ).normalize();
  }

  /**
   * Spawn particles at lightning impact
   */
  spawnLightningSparks(position, color, intensity) {
    const sparkCount = Math.floor(10 * intensity);

    for (let i = 0; i < sparkCount; i++) {
      this.spawnParticle(
        position,
        this.getRandomDirection(),
        color,
        this.config.burstSpeed * 1.5,
        this.config.maxLifetime * 0.5
      );
    }
  }

  /**
   * Set particle density (user control)
   */
  setDensity(density) {
    this.config.density = Math.max(0.2, Math.min(2, density));
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
      this.particles = null;
    }
  }
}
