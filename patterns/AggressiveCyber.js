/**
 * AggressiveCyber.js
 * Maximum intensity mode for drops and climaxes
 * Enhanced with chromatic aberration, hexagons, lightning, and RGB splits
 */

import { PatternBase } from './PatternBase.js';

export class AggressiveCyber extends PatternBase {
    constructor() {
        super('Aggressive Cyber');
        this.glitchIntensity = 0;
        this.flashIntensity = 0;
        this.cameraShake = { x: 0, y: 0 };
        this.chromaticOffset = 0;
        this.rgbSplitIntensity = 0;
        this.hexagons = [];
        this.lightningBolts = [];
        this.particles = [];
        this.maxParticles = 150;
        this.distortionWave = 0;
    }

    onActivate() {
        // Initialize hexagon grid
        this.hexagons = [];
        this.particles = [];
        this.lightningBolts = [];
        console.log('Aggressive Cyber activated');
    }

    update(network, audioData, beatData) {
        // Enhanced Aggressive/Cyber Mode Audio Mapping:
        // Bass → camera shake, hexagon pulse, chromatic aberration
        // Mids → rotation speed, distortion waves
        // Highs → particle spawning, color shifts, RGB split
        // Sub-bass → deep rumble effects
        // Transients → lightning bolts, instant flashes
        // Climax → all effects to maximum

        const bassValue = audioData.bass || audioData.bassEnergy || 0;
        const midValue = audioData.mids || audioData.midEnergy || 0;
        const highValue = audioData.highs || audioData.highEnergy || 0;
        const subBass = audioData.subBass || 0;
        const isTransient = audioData.isTransient || false;
        const isClimax = audioData.isClimax || false;
        const canvas = network.canvas;

        // Transient detection → lightning bolts & sharp flashes
        if (isTransient) {
            this.flashIntensity = 1.0;
            this.glitchIntensity = 1.0;
            this.rgbSplitIntensity = 15;

            // Create lightning bolt
            const startX = Math.random() * canvas.width;
            const startY = 0;
            const endX = Math.random() * canvas.width;
            const endY = canvas.height;

            this.lightningBolts.push({
                segments: this.generateLightning(startX, startY, endX, endY, 8),
                life: 1.0,
                thickness: 3 + bassValue * 5
            });
        } else {
            this.flashIntensity *= 0.82;
            this.glitchIntensity *= 0.88;
            this.rgbSplitIntensity *= 0.85;
        }

        // Bass → camera shake & chromatic aberration
        if (bassValue > 0.6) {
            this.cameraShake.x = (Math.random() - 0.5) * bassValue * 30;
            this.cameraShake.y = (Math.random() - 0.5) * bassValue * 30;
            this.chromaticOffset = bassValue * 12;
        } else {
            this.cameraShake.x *= 0.75;
            this.cameraShake.y *= 0.75;
            this.chromaticOffset *= 0.85;
        }

        // Mids → distortion wave
        this.distortionWave += midValue * 0.3;

        // Highs → particle spawning
        const spawnRate = Math.floor(highValue * 8) + Math.floor(bassValue * 5);
        for (let i = 0; i < spawnRate && this.particles.length < this.maxParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + highValue * 10;
            const spawnX = canvas.width / 2 + (Math.random() - 0.5) * 150;
            const spawnY = canvas.height / 2 + (Math.random() - 0.5) * 150;

            this.particles.push({
                x: spawnX,
                y: spawnY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: 2 + bassValue * 4,
                hue: Math.random() * 360
            });
        }

        // Update particles
        for (let particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.97;
            particle.vy *= 0.97;
            particle.life -= 0.02;

            // Wrap around
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
        }

        // Clean up dead particles
        this.particles = this.particles.filter(p => p.life > 0);

        // Update lightning bolts
        for (let bolt of this.lightningBolts) {
            bolt.life -= 0.08;
        }
        this.lightningBolts = this.lightningBolts.filter(b => b.life > 0);

        // During climax, maximize all effects
        if (isClimax) {
            this.glitchIntensity = Math.max(this.glitchIntensity, 0.7);
            this.flashIntensity = Math.max(this.flashIntensity, 0.5);
            this.chromaticOffset = Math.max(this.chromaticOffset, 8);
        }

        // Apply extreme distortion to network
        const distortionScale = 1.0 + (bassValue * 0.4) + (subBass * 0.3);
        const rotationSpeed = (midValue * 0.15) + (highValue * 0.1);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (let node of network.nodes) {
            // Apply rotation based on mids & highs
            const dx = node.x - centerX;
            const dy = node.y - centerY;
            const angle = Math.atan2(dy, dx) + rotationSpeed;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Add wave distortion
            const waveOffset = Math.sin(this.distortionWave + distance * 0.01) * midValue * 30;
            const scaledDistance = distance * distortionScale + waveOffset;

            node.targetX = centerX + Math.cos(angle) * scaledDistance;
            node.targetY = centerY + Math.sin(angle) * scaledDistance;

            // Add glitch jitter on transients
            if (this.glitchIntensity > 0.3) {
                node.targetX += (Math.random() - 0.5) * this.glitchIntensity * 60;
                node.targetY += (Math.random() - 0.5) * this.glitchIntensity * 60;
            }
        }

        // Update hexagon grid (bass reactive)
        if (bassValue > 0.4 || this.hexagons.length === 0) {
            this.updateHexagonGrid(canvas, bassValue);
        }

        network.update(audioData, beatData);
    }

    generateLightning(x1, y1, x2, y2, detail) {
        const segments = [];
        segments.push({ x: x1, y: y1 });

        const steps = detail;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 80;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 80;
            segments.push({ x, y });
        }

        segments.push({ x: x2, y: y2 });
        return segments;
    }

    updateHexagonGrid(canvas, bassValue) {
        this.hexagons = [];
        const hexSize = 40 + bassValue * 30;
        const spacing = hexSize * 1.8;

        for (let y = -hexSize; y < canvas.height + hexSize; y += spacing * 0.866) {
            const rowOffset = (Math.floor(y / (spacing * 0.866)) % 2) * (spacing / 2);
            for (let x = -hexSize + rowOffset; x < canvas.width + hexSize; x += spacing) {
                this.hexagons.push({
                    x: x,
                    y: y,
                    size: hexSize,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }
    }

    drawHexagon(ctx, x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = x + size * Math.cos(angle);
            const hy = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
    }

    render(renderer, network, audioData) {
        const ctx = renderer.ctx;
        const canvas = renderer.canvas;

        // Clear with slight fade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Get aggressive colors
        const color = renderer.colorSystem.getColorForAudioState(audioData);
        const bassValue = audioData.bass || audioData.bassEnergy || 0;
        const highValue = audioData.highs || audioData.highEnergy || 0;

        // Apply camera shake
        ctx.save();
        ctx.translate(this.cameraShake.x, this.cameraShake.y);

        // Draw hexagon grid (bass reactive)
        if (this.hexagons.length > 0 && bassValue > 0.3) {
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${bassValue * 0.25})`;
            ctx.lineWidth = 1.5 + bassValue * 2;

            for (let hex of this.hexagons) {
                const pulse = Math.sin(hex.pulse + Date.now() * 0.003) * 0.3 + 0.7;
                const size = hex.size * pulse * (0.8 + bassValue * 0.4);

                this.drawHexagon(ctx, hex.x, hex.y, size);
                ctx.stroke();
            }
        }

        // Chromatic aberration effect - draw network 3 times with RGB split
        const offset = this.chromaticOffset;

        // Red channel
        ctx.globalCompositeOperation = 'lighter';
        ctx.save();
        ctx.translate(-offset, 0);
        this.drawNetwork(ctx, network, { r: color.r, g: 0, b: 0 }, 0.6);
        ctx.restore();

        // Green channel
        this.drawNetwork(ctx, network, { r: 0, g: color.g, b: 0 }, 0.6);

        // Blue channel
        ctx.save();
        ctx.translate(offset, 0);
        this.drawNetwork(ctx, network, { r: 0, g: 0, b: color.b }, 0.6);
        ctx.restore();

        ctx.globalCompositeOperation = 'source-over';

        // Draw enhanced particles
        for (let particle of this.particles) {
            const alpha = particle.life * 0.9;
            const r = Math.floor(color.r * (1 + Math.sin(particle.hue) * 0.5));
            const g = Math.floor(color.g * (1 + Math.cos(particle.hue) * 0.5));
            const b = Math.floor(color.b * (1 + Math.sin(particle.hue + 2) * 0.5));

            // Glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 3
            );
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw lightning bolts
        for (let bolt of this.lightningBolts) {
            const alpha = bolt.life * 0.9;

            // Main bolt
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = bolt.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            for (let i = 0; i < bolt.segments.length; i++) {
                const seg = bolt.segments[i];
                if (i === 0) ctx.moveTo(seg.x, seg.y);
                else ctx.lineTo(seg.x, seg.y);
            }
            ctx.stroke();

            // Glow
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`;
            ctx.lineWidth = bolt.thickness * 3;
            ctx.beginPath();
            for (let i = 0; i < bolt.segments.length; i++) {
                const seg = bolt.segments[i];
                if (i === 0) ctx.moveTo(seg.x, seg.y);
                else ctx.lineTo(seg.x, seg.y);
            }
            ctx.stroke();
        }

        ctx.restore();

        // Flash overlay on transients
        if (this.flashIntensity > 0.2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashIntensity * 0.4})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Enhanced scan lines with glitch offset
        const scanLineOpacity = this.glitchIntensity * 0.15 + 0.05;
        for (let y = 0; y < canvas.height; y += 3) {
            const glitchX = this.glitchIntensity > 0.5 ? (Math.random() - 0.5) * this.glitchIntensity * 20 : 0;
            ctx.strokeStyle = `rgba(0, 255, 255, ${scanLineOpacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(glitchX, y);
            ctx.lineTo(canvas.width + glitchX, y);
            ctx.stroke();
        }

        // RGB split vertical bars (glitch effect)
        if (this.rgbSplitIntensity > 3) {
            const barCount = Math.floor(this.rgbSplitIntensity / 3);
            for (let i = 0; i < barCount; i++) {
                const x = Math.random() * canvas.width;
                const width = 2 + Math.random() * 8;
                const height = canvas.height;

                ctx.fillStyle = `rgba(${color.r}, 0, 0, 0.3)`;
                ctx.fillRect(x - this.rgbSplitIntensity, 0, width, height);

                ctx.fillStyle = `rgba(0, ${color.g}, 0, 0.3)`;
                ctx.fillRect(x, 0, width, height);

                ctx.fillStyle = `rgba(0, 0, ${color.b}, 0.3)`;
                ctx.fillRect(x + this.rgbSplitIntensity, 0, width, height);
            }
        }
    }

    drawNetwork(ctx, network, colorOverride, alphaMultiplier = 1.0) {
        // Draw edges
        for (let edge of network.edges) {
            const nodeA = edge.nodeA;
            const nodeB = edge.nodeB;

            // Apply glitch offset
            const glitchOffsetX = (Math.random() - 0.5) * this.glitchIntensity * 10;
            const glitchOffsetY = (Math.random() - 0.5) * this.glitchIntensity * 10;

            ctx.strokeStyle = `rgba(${colorOverride.r}, ${colorOverride.g}, ${colorOverride.b}, ${edge.opacity * alphaMultiplier})`;
            ctx.lineWidth = 2 + this.glitchIntensity * 3;
            ctx.beginPath();
            ctx.moveTo(nodeA.x + glitchOffsetX, nodeA.y + glitchOffsetY);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
        }

        // Draw nodes
        for (let node of network.nodes) {
            const size = 3 + node.energy * 6;

            // Main node
            ctx.fillStyle = `rgba(${colorOverride.r}, ${colorOverride.g}, ${colorOverride.b}, ${alphaMultiplier})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            if (node.energy > 0.5) {
                ctx.fillStyle = `rgba(255, 255, 255, ${node.energy * 0.6 * alphaMultiplier})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
