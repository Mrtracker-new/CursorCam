/**
 * ParticleEnergy.js
 * Enhanced particle-based energy visualization with trails and glows
 */

import { PatternBase } from './PatternBase.js';

export class ParticleEnergy extends PatternBase {
  constructor() {
    super('Particle Energy');
    this.particles = [];
    this.maxParticles = 300; // Increased for more density
    this.flowAngle = 0;
    this.energyField = []; // Background energy field
  }

  onActivate() {
    // Initialize particles
    this.particles = [];
    this.energyField = [];
    console.log('Particle Energy activated');
  }

  update(network, audioData, beatData) {
    // Particle/Energy Mode Audio Mapping:
    // Bass → particle burst size & velocity
    // Mids → flow direction changes
    // Highs → flicker rate & spawning
    // Silence → particles drift slowly
    // Beats → radial explosion

    const canvas = network.canvas;
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;
    const subBass = audioData.subBass || 0;

    // Update flow angle based on mids (flow direction changes)
    this.flowAngle += midValue * 0.15;

    // During silence, particles drift slowly
    if (audioData.isSilence) {
      // Slow drift
      for (const particle of this.particles) {
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        particle.life -= 0.005;
      }
    } else {
      // Continuous particle spawning based on highs (flicker rate & spawning)
      const spawnRate = Math.floor(highValue * 15) + Math.floor(bassValue * 10);

      for (let i = 0; i < spawnRate && this.particles.length < this.maxParticles; i++) {
        // Spawn from center or edges based on audio
        const spawnFromCenter = Math.random() > 0.5;

        let spawnX, spawnY;
        if (spawnFromCenter) {
          spawnX = canvas.width / 2 + (Math.random() - 0.5) * 100;
          spawnY = canvas.height / 2 + (Math.random() - 0.5) * 100;
        } else {
          // Spawn from edges
          const edge = Math.floor(Math.random() * 4);
          if (edge === 0) {
            // Top
            spawnX = Math.random() * canvas.width;
            spawnY = 0;
          } else if (edge === 1) {
            // Right
            spawnX = canvas.width;
            spawnY = Math.random() * canvas.height;
          } else if (edge === 2) {
            // Bottom
            spawnX = Math.random() * canvas.width;
            spawnY = canvas.height;
          } else {
            // Left
            spawnX = 0;
            spawnY = Math.random() * canvas.height;
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
          size: 2 + bassValue * 6 + Math.random() * 3, // Bigger particles
          hue: Math.random() * 60 + bassValue * 180, // Color variation
          brightness: 0.5 + highValue * 0.5,
        });
      }

      // Update existing particles
      for (const particle of this.particles) {
        // Apply flow direction (based on mids)
        const flowForce = midValue * 0.8;
        particle.vx += Math.cos(this.flowAngle) * flowForce;
        particle.vy += Math.sin(this.flowAngle) * flowForce;

        // Gravity pull to center (subtle)
        const dx = canvas.width / 2 - particle.x;
        const dy = canvas.height / 2 - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const pullStrength = (audioData.totalEnergy || 0) * 0.02;
          particle.vx += (dx / distance) * pullStrength;
          particle.vy += (dy / distance) * pullStrength;
        }

        // Move particle
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply friction
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Decay life
        particle.life -= 0.015;

        // Wrap around edges instead of bounce
        if (particle.x < 0) {
          particle.x = canvas.width;
        }
        if (particle.x > canvas.width) {
          particle.x = 0;
        }
        if (particle.y < 0) {
          particle.y = canvas.height;
        }
        if (particle.y > canvas.height) {
          particle.y = 0;
        }

        // Update color based on speed
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        particle.brightness = Math.min(1.0, 0.3 + speed * 0.1);
      }
    }

    // Remove dead particles
    this.particles = this.particles.filter((p) => p.life > 0);

    // On beat, create radial burst
    if (beatData.isBeat && beatData.confidence > 0.5) {
      const burstSize = Math.floor(bassValue * 30) + 20;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < burstSize && this.particles.length < this.maxParticles; i++) {
        const angle = (Math.PI * 2 * i) / burstSize;
        const speed = 8 + bassValue * 15;
        const randomAngle = angle + (Math.random() - 0.5) * 0.3;

        this.particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(randomAngle) * speed,
          vy: Math.sin(randomAngle) * speed,
          life: 1.0,
          size: 4 + bassValue * 8,
          hue: bassValue * 60 + highValue * 120,
          brightness: 1.0,
        });
      }
    }

    // Don't use standard network update
  }

  render(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    // Clear with very subtle fade for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get base audio-reactive color
    const baseColor = renderer.colorSystem.getColorForAudioState(audioData);

    // Draw particles with trails and glows
    for (const particle of this.particles) {
      const alpha = particle.life * 0.9;

      // Vary color based on particle's hue
      const r = Math.floor(baseColor.r * (1 + Math.sin(particle.hue) * 0.3));
      const g = Math.floor(baseColor.g * (1 + Math.cos(particle.hue) * 0.3));
      const b = Math.floor(baseColor.b * (1 + Math.sin(particle.hue + 1) * 0.3));

      // Outer glow (larger, more transparent)
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

      // Main particle body
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

    // Add connection lines between nearby particles for energy field effect
    if (this.particles.length > 10) {
      ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.15)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < this.particles.length; i++) {
        const p1 = this.particles[i];

        // Only check next few particles to avoid O(n²) complexity
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

    // Particle count debug (optional)
    // ctx.fillStyle = 'white';
    // ctx.font = '12px monospace';
    // ctx.fillText(`Particles: ${this.particles.length}`, 10, 20);
  }
}
