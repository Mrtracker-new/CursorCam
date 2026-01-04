/**
 * AggressiveCyber.js
 * Maximum intensity mode for drops and climaxes
 */

import { PatternBase } from './PatternBase.js';

export class AggressiveCyber extends PatternBase {
    constructor() {
        super('Aggressive Cyber');
        this.glitchIntensity = 0;
        this.flashIntensity = 0;
        this.cameraShake = { x: 0, y: 0 };
    }

    update(network, audioData, beatData) {
        // Aggressive/Cyber Mode Audio Mapping:
        // Transients → sharp flashes & glitches
        // Bass drops → rapid camera shake
        // Highs → glitch-style digital artifacts
        // Climax → visuals pushed to limits

        const bassValue = audioData.bass || audioData.bassEnergy || 0;
        const highValue = audioData.highs || audioData.highEnergy || 0;
        const isTransient = audioData.isTransient || false;
        const isClimax = audioData.isClimax || false;

        // Transient detection → sharp flashes
        if (isTransient) {
            this.flashIntensity = 1.0;
            this.glitchIntensity = 0.8;
        } else {
            this.flashIntensity *= 0.85;
            this.glitchIntensity *= 0.9;
        }

        // Bass drops → camera shake
        if (bassValue > 0.7) {
            this.cameraShake.x = (Math.random() - 0.5) * bassValue * 20;
            this.cameraShake.y = (Math.random() - 0.5) * bassValue * 20;
        } else {
            // Decay shake
            this.cameraShake.x *= 0.8;
            this.cameraShake.y *= 0.8;
        }

        // During climax, increase all effects
        if (isClimax) {
            this.glitchIntensity = Math.max(this.glitchIntensity, 0.6);
            this.flashIntensity = Math.max(this.flashIntensity, 0.4);
        }

        // Apply extreme distortion to network
        const distortionScale = 1.0 + (bassValue * 0.3);
        const rotationSpeed = highValue * 0.2;

        const centerX = network.canvas.width / 2;
        const centerY = network.canvas.height / 2;

        for (let node of network.nodes) {
            // Apply rotation based on highs
            const dx = node.x - centerX;
            const dy = node.y - centerY;
            const angle = Math.atan2(dy, dx) + rotationSpeed;
            const distance = Math.sqrt(dx * dx + dy * dy) * distortionScale;

            node.targetX = centerX + Math.cos(angle) * distance;
            node.targetY = centerY + Math.sin(angle) * distance;

            // Add glitch jitter on transients
            if (this.glitchIntensity > 0.3) {
                node.targetX += (Math.random() - 0.5) * this.glitchIntensity * 50;
                node.targetY += (Math.random() - 0.5) * this.glitchIntensity * 50;
            }
        }

        network.update(audioData, beatData);
    }

    render(renderer, network, audioData) {
        const ctx = renderer.ctx;
        const canvas = renderer.canvas;

        // Clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply camera shake
        ctx.save();
        ctx.translate(this.cameraShake.x, this.cameraShake.y);

        // Get aggressive colors
        const color = renderer.colorSystem.getColorForAudioState(audioData);

        // Draw network with glitch effect
        for (let edge of network.edges) {
            const nodeA = edge.nodeA;
            const nodeB = edge.nodeB;

            // Apply glitch offset
            const glitchOffsetX = (Math.random() - 0.5) * this.glitchIntensity * 10;
            const glitchOffsetY = (Math.random() - 0.5) * this.glitchIntensity * 10;

            ctx.strokeStyle = renderer.colorSystem.rgbaToString(color, edge.opacity);
            ctx.lineWidth = 2 + this.glitchIntensity * 3;
            ctx.beginPath();
            ctx.moveTo(nodeA.x + glitchOffsetX, nodeA.y + glitchOffsetY);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
        }

        // Draw nodes with intense glow
        for (let node of network.nodes) {
            const size = 3 + node.energy * 5;

            // Main node
            ctx.fillStyle = renderer.colorSystem.rgbToString(color);
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.fillStyle = `rgba(255, 255, 255, ${node.energy * 0.8})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Flash overlay on transients
        if (this.flashIntensity > 0.2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashIntensity * 0.3})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Scan lines for cyber effect
        ctx.strokeStyle = `rgba(0, 255, 255, ${this.glitchIntensity * 0.1})`;
        ctx.lineWidth = 1;
        for (let y = 0; y < canvas.height; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}
