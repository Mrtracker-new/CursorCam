/**
 * ParticleEnergy.js
 * Enhanced particle-based energy visualization with 6 behavior modes
 */

import { PatternBase } from './PatternBase.js';

/**
 * Particle Behavior Modes
 */
const ParticleBehavior = {
  FLOW: 'flow', // Original behavior - flowing particles
  FLOCKING: 'flocking', // Boids algorithm - flocking behavior
  VORTEX: 'vortex', // Spiral motion around center
  EXPLOSION: 'explosion', // Continuous explosive bursts
  GRAVITY_WELLS: 'wells', // Attraction to frequency peaks
  SHAPE_FORMATION: 'shapes', // Music-driven geometric patterns
};

export class ParticleEnergy extends PatternBase {
  constructor() {
    super('Particle Energy');

    // Core particle system
    this.particles = [];
    this.maxParticles = 300;

    // Current behavior mode
    this.currentBehavior = ParticleBehavior.FLOW;

    // Flow mode state
    this.flowAngle = 0;

    // Vortex mode state
    this.vortexRotation = 0;
    this.vortexDirection = 1;

    // Explosion mode state
    this.explosionTime = 0;

    // Gravity wells state
    this.wells = [];

    // Shape formation state
    this.currentShape = [];
    this.shapeType = 'circle';
  }

  /**
   * Set behavior mode
   */
  setMode(mode) {
    if (Object.values(ParticleBehavior).includes(mode)) {
      this.currentBehavior = mode;
      console.log(`✨ Particle behavior switched to: ${mode}`);

      // Reset mode-specific state
      if (mode === ParticleBehavior.VORTEX) {
        this.vortexRotation = 0;
      } else if (mode === ParticleBehavior.SHAPE_FORMATION) {
        this.currentShape = [];
      }
    }
  }

  onActivate() {
    this.particles = [];
    this.currentBehavior = ParticleBehavior.FLOW;
    console.log('Particle Energy activated');
  }

  update(network, audioData, beatData) {
    const canvas = network.canvas;

    // Ensure we have particles
    this._ensureParticles(canvas, audioData);

    // Dispatch to behavior-specific update
    switch (this.currentBehavior) {
      case ParticleBehavior.FLOW:
        this._updateFlow(canvas, audioData, beatData);
        break;
      case ParticleBehavior.FLOCKING:
        this._updateFlocking(canvas, audioData, beatData);
        break;
      case ParticleBehavior.VORTEX:
        this._updateVortex(canvas, audioData, beatData);
        break;
      case ParticleBehavior.EXPLOSION:
        this._updateExplosion(canvas, audioData, beatData);
        break;
      case ParticleBehavior.GRAVITY_WELLS:
        this._updateGravityWells(canvas, audioData, beatData);
        break;
      case ParticleBehavior.SHAPE_FORMATION:
        this._updateShapeFormation(canvas, audioData, beatData);
        break;
    }

    // Common particle maintenance
    this._updateParticlePhysics(canvas);
    this._removeDeadParticles();
  }

  /**
   * Ensure minimum particle count
   */
  _ensureParticles(canvas, audioData) {
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;

    // Spawn particles if below minimum
    const minParticles = 50;
    const spawnRate = Math.max(1, Math.floor(highValue * 15) + Math.floor(bassValue * 10));

    while (this.particles.length < minParticles) {
      this._spawnParticle(canvas, audioData);
    }

    // Continuous spawning based on audio
    for (let i = 0; i < spawnRate && this.particles.length < this.maxParticles; i++) {
      this._spawnParticle(canvas, audioData);
    }
  }

  /**
   * Spawn a new particle
   */
  _spawnParticle(canvas, audioData) {
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;
    const subBass = audioData.subBass || 0;

    // Spawn position varies by mode
    let spawnX, spawnY;

    if (this.currentBehavior === ParticleBehavior.EXPLOSION) {
      // Always center for explosion mode
      spawnX = canvas.width / 2;
      spawnY = canvas.height / 2;
    } else {
      // Random spawn from center or edges
      const spawnFromCenter = Math.random() > 0.5;

      if (spawnFromCenter) {
        spawnX = canvas.width / 2 + (Math.random() - 0.5) * 100;
        spawnY = canvas.height / 2 + (Math.random() - 0.5) * 100;
      } else {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) {
          spawnX = Math.random() * canvas.width;
          spawnY = 0;
        } else if (edge === 1) {
          spawnX = canvas.width;
          spawnY = Math.random() * canvas.height;
        } else if (edge === 2) {
          spawnX = Math.random() * canvas.width;
          spawnY = canvas.height;
        } else {
          spawnX = 0;
          spawnY = Math.random() * canvas.height;
        }
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + bassValue * 8 + subBass * 5;

    this.particles.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      size: 2 + bassValue * 6 + Math.random() * 3,
      hue: Math.random() * 60 + bassValue * 180,
      brightness: 0.5 + highValue * 0.5,
    });
  }

  /**
   * BEHAVIOR: Flow (original)
   */
  _updateFlow(canvas, audioData, beatData) {
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;

    // Update flow angle based on mids
    this.flowAngle += midValue * 0.15;

    if (audioData.isSilence) {
      // Slow drift during silence
      for (const particle of this.particles) {
        particle.vx *= 0.95;
        particle.vy *= 0.95;
      }
    } else {
      // Apply flow direction
      for (const particle of this.particles) {
        const flowForce = midValue * 0.8;
        particle.vx += Math.cos(this.flowAngle) * flowForce;
        particle.vy += Math.sin(this.flowAngle) * flowForce;

        // Gravity pull to center
        const dx = canvas.width / 2 - particle.x;
        const dy = canvas.height / 2 - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const pullStrength = (audioData.totalEnergy || 0) * 0.02;
          particle.vx += (dx / distance) * pullStrength;
          particle.vy += (dy / distance) * pullStrength;
        }
      }
    }

    // Beat burst
    if (beatData.isBeat && beatData.confidence > 0.5) {
      this._createBurst(canvas.width / 2, canvas.height / 2, Math.floor(bassValue * 30) + 20, 8 + bassValue * 15, audioData);
    }
  }

  /**
   * BEHAVIOR: Flocking (Boids algorithm)
   */
  _updateFlocking(canvas, audioData, beatData) {
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;

    for (const particle of this.particles) {
      // Calculate boids forces
      const separation = this._calculateSeparation(particle, 30);
      const alignment = this._calculateAlignment(particle, 50);
      const cohesion = this._calculateCohesion(particle, 80);

      // Audio-reactive weights
      const separationWeight = 1.5 + bassValue * 2;
      const alignmentWeight = 1.0 + highValue * 1.5;
      const cohesionWeight = 1.0 + midValue * 1.5;

      // Apply forces
      particle.vx += separation.x * separationWeight + alignment.x * alignmentWeight + cohesion.x * cohesionWeight;
      particle.vy += separation.y * separationWeight + alignment.y * alignmentWeight + cohesion.y * cohesionWeight;

      // Limit speed
      const maxSpeed = 3 + audioData.totalEnergy * 5;
      this._limitSpeed(particle, maxSpeed);
    }

    // Beat creates leader particles
    if (beatData.isBeat && this.particles.length > 0) {
      const leaderCount = Math.min(5, this.particles.length);
      for (let i = 0; i < leaderCount; i++) {
        const leader = this.particles[Math.floor(Math.random() * this.particles.length)];
        const angle = Math.random() * Math.PI * 2;
        leader.vx = Math.cos(angle) * 10;
        leader.vy = Math.sin(angle) * 10;
      }
    }
  }

  _calculateSeparation(particle, radius) {
    let steerX = 0;
    let steerY = 0;
    let count = 0;

    for (const other of this.particles) {
      if (other === particle) continue;

      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0 && distance < radius) {
        steerX += dx / distance;
        steerY += dy / distance;
        count++;
      }
    }

    if (count > 0) {
      steerX /= count;
      steerY /= count;
    }

    return { x: steerX * 0.5, y: steerY * 0.5 };
  }

  _calculateAlignment(particle, radius) {
    let avgVX = 0;
    let avgVY = 0;
    let count = 0;

    for (const other of this.particles) {
      if (other === particle) continue;

      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        avgVX += other.vx;
        avgVY += other.vy;
        count++;
      }
    }

    if (count > 0) {
      avgVX /= count;
      avgVY /= count;

      return { x: (avgVX - particle.vx) * 0.1, y: (avgVY - particle.vy) * 0.1 };
    }

    return { x: 0, y: 0 };
  }

  _calculateCohesion(particle, radius) {
    let avgX = 0;
    let avgY = 0;
    let count = 0;

    for (const other of this.particles) {
      if (other === particle) continue;

      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        avgX += other.x;
        avgY += other.y;
        count++;
      }
    }

    if (count > 0) {
      avgX /= count;
      avgY /= count;

      const dx = avgX - particle.x;
      const dy = avgY - particle.y;

      return { x: dx * 0.01, y: dy * 0.01 };
    }

    return { x: 0, y: 0 };
  }

  /**
   * BEHAVIOR: Vortex
   */
  _updateVortex(canvas, audioData, beatData) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;

    // Rotation speed based on mids
    const rotationSpeed = (0.02 + midValue * 0.08) * this.vortexDirection;
    this.vortexRotation += rotationSpeed;

    // Beat reverses direction briefly
    if (beatData.isBeat && beatData.confidence > 0.7) {
      this.vortexDirection *= -1;
    }

    for (const particle of this.particles) {
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      //Spiral strength based on bass
      const spiralStrength = 0.98 + bassValue * 0.05;

      // New angle
      const newAngle = angle + rotationSpeed;

      // Radial pulsing based on highs
      const time = Date.now() * 0.002;
      const radialPulse = Math.sin(time + particle.hue) * highValue * 15;
      const targetRadius = distance * spiralStrength + radialPulse;

      // Apply vortex motion
      const targetX = centerX + Math.cos(newAngle) * targetRadius;
      const targetY = centerY + Math.sin(newAngle) * targetRadius;

      particle.vx += (targetX - particle.x) * 0.1;
      particle.vy += (targetY - particle.y) * 0.1;
    }
  }

  /**
   * BEHAVIOR: Explosion
   */
  _updateExplosion(canvas, audioData, beatData) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;

    // Continuous micro-bursts
    const burstFrequency = Math.floor(midValue * 5) + 1;
    if (Math.random() < burstFrequency / 60) {
      this._createBurst(centerX, centerY, 10, 8 + bassValue * 10, audioData);
    }

    // Mega burst on beats
    if (beatData.isBeat && beatData.confidence > 0.5) {
      this._createBurst(centerX, centerY, 50, 15 + bassValue * 20, audioData);
    }

    // Apply outward explosive force
    for (const particle of this.particles) {
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const force = (bassValue * 3 + 1) / Math.max(distance, 10);
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
    }
  }

  /**
   * BEHAVIOR: Gravity Wells
   */
  _updateGravityWells(canvas, audioData, beatData) {
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;
    const time = Date.now() * 0.001;

    // Create/update 3 gravity wells
    this.wells = [
      {
        x: canvas.width * 0.2,
        y: canvas.height / 2 + Math.sin(time) * bassValue * 100,
        strength: bassValue * 1.5,
      },
      {
        x: canvas.width * 0.5,
        y: canvas.height / 2 + Math.sin(time * 1.5) * midValue * 80,
        strength: midValue * 1.5,
      },
      {
        x: canvas.width * 0.8,
        y: canvas.height / 2 + Math.sin(time * 2) * highValue * 60,
        strength: highValue * 1.5,
      },
    ];

    // Apply well attraction
    for (const particle of this.particles) {
      for (const well of this.wells) {
        const dx = well.x - particle.x;
        const dy = well.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const force = (well.strength * 200) / Math.max(distance, 10);
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      }
    }
  }

  /**
   * BEHAVIOR: Shape Formation
   */
  _updateShapeFormation(canvas, audioData, beatData) {
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;

    // Determine target shape based on dominant frequency
    let targetShape;
    let newShapeType;

    if (bassValue > midValue && bassValue > highValue) {
      targetShape = this._generateCircleShape(canvas);
      newShapeType = 'circle';
    } else if (midValue > highValue) {
      targetShape = this._generateGridShape(canvas);
      newShapeType = 'grid';
    } else {
      targetShape = this._generateStarShape(canvas);
      newShapeType = 'star';
    }

    // Update current shape if changed
    if (newShapeType !== this.shapeType) {
      this.shapeType = newShapeType;
      this.currentShape = targetShape;
    }

    // Interpolate particles toward target positions
    const lerpFactor = 0.05 + audioData.totalEnergy * 0.15;

    for (let i = 0; i < this.particles.length && i < this.currentShape.length; i++) {
      const particle = this.particles[i];
      const target = this.currentShape[i];

      particle.vx += (target.x - particle.x) * lerpFactor;
      particle.vy += (target.y - particle.y) * lerpFactor;
    }

    // Beat creates shape pulse
    if (beatData.isBeat) {
      const scale = 1.2;
      for (let i = 0; i < this.currentShape.length; i++) {
        const target = this.currentShape[i];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = target.x - centerX;
        const dy = target.y - centerY;

        this.currentShape[i] = {
          x: centerX + dx * scale,
          y: centerY + dy * scale,
        };
      }
    }
  }

  _generateCircleShape(canvas) {
    const points = [];
    const count = Math.min(this.maxParticles, 100);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    return points;
  }

  _generateGridShape(canvas) {
    const points = [];
    const gridSize = 10;
    const spacing = Math.min(canvas.width, canvas.height) * 0.06;
    const startX = canvas.width / 2 - (gridSize * spacing) / 2;
    const startY = canvas.height / 2 - (gridSize * spacing) / 2;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        points.push({
          x: startX + col * spacing,
          y: startY + row * spacing,
        });
      }
    }

    return points;
  }

  _generateStarShape(canvas) {
    const points = [];
    const spikes = 5;
    const count = 50;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(canvas.width, canvas.height) * 0.3;
    const innerRadius = outerRadius * 0.5;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spikeAngle = (Math.PI * 2) / spikes;
      const angleInSpike = angle % spikeAngle;
      const spikeProgress = angleInSpike / spikeAngle;

      // Interpolate between inner and outer radius
      const radius = spikeProgress < 0.5
        ? innerRadius + (outerRadius - innerRadius) * (spikeProgress * 2)
        : outerRadius - (outerRadius - innerRadius) * ((spikeProgress - 0.5) * 2);

      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    return points;
  }

  /**
   * Create a burst of particles
   */
  _createBurst(x, y, count, speed, audioData) {
    const bassValue = audioData?.bass || audioData?.bassEnergy || 0.5;
    const highValue = audioData?.highs || audioData?.highEnergy || 0.5;

    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        size: 4 + bassValue * 8,
        hue: bassValue * 60 + highValue * 120,
        brightness: 1.0,
      });
    }
  }

  /**
   * Limit particle speed
   */
  _limitSpeed(particle, maxSpeed) {
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    if (speed > maxSpeed) {
      particle.vx = (particle.vx / speed) * maxSpeed;
      particle.vy = (particle.vy / speed) * maxSpeed;
    }
  }

  /**
   * Update common particle physics
   */
  _updateParticlePhysics(canvas) {
    for (const particle of this.particles) {
      // Move particle
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Apply friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      // Decay life
      particle.life -= 0.015;

      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      // Update brightness based on speed
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      particle.brightness = Math.min(1.0, 0.3 + speed * 0.1);
    }
  }

  /**
   * Remove dead particles
   */
  _removeDeadParticles() {
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  render(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    // Clear with subtle fade for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get base color
    const baseColor = renderer.colorSystem.getColorForAudioState(audioData);

    // Draw gravity wells if in wells mode
    if (this.currentBehavior === ParticleBehavior.GRAVITY_WELLS && this.wells.length > 0) {
      for (const well of this.wells) {
        const gradient = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, 50 * well.strength);
        gradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.3)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 50 * well.strength, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw particles
    for (const particle of this.particles) {
      const alpha = particle.life * 0.9;

      // Color variation
      const r = Math.floor(baseColor.r * (1 + Math.sin(particle.hue) * 0.3));
      const g = Math.floor(baseColor.g * (1 + Math.cos(particle.hue) * 0.3));
      const b = Math.floor(baseColor.b * (1 + Math.sin(particle.hue + 1) * 0.3));

      // Outer glow
      const glowSize = particle.size * 3;
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        glowSize
      );
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * particle.brightness * 0.6})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * particle.brightness * 0.3})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Main body
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * particle.brightness})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Bright core
      if (particle.brightness > 0.7) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Connection lines (only in flow and flocking modes)
    if (
      (this.currentBehavior === ParticleBehavior.FLOW ||
        this.currentBehavior === ParticleBehavior.FLOCKING) &&
      this.particles.length > 10
    ) {
      ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.15)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < this.particles.length; i++) {
        const p1 = this.particles[i];

        for (let j = i + 1; j < Math.min(i + 5, this.particles.length); j++) {
          const p2 = this.particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const alpha = (1 - distance / 100) * p1.life * p2.life * 0.3;
            ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    }
  }
}
