/**
 * StaticConstellation.js
 * Minimal/Calm Mode: Only reacts to sustained energy and clean beats
 */

import { PatternBase } from './PatternBase.js';

export class StaticConstellation extends PatternBase {
    constructor() {
        super('Minimal Calm');
        this.sustainedEnergyThreshold = 0.4;
    }

    update(network, audioData, beatData) {
        // Minimal/Calm Mode Audio Mapping:
        // - Only reacts to sustained energy (no jitter)
        // - Clean beats → minimal node pulse
        // - Silence → fully static network

        // Check if silence
        const isSilence = audioData.isSilence || audioData.totalEnergy < 0.1;

        if (isSilence) {
            // During silence, network is completely static
            // Standard update but with no modifications
            network.update(audioData, beatData);
            return;
        }

        // Only react to sustained energy (smoothed values)
        const sustainedEnergy = audioData.smoothBass || audioData.bassEnergy || 0;

        if (sustainedEnergy > this.sustainedEnergyThreshold) {
            // Very subtle reaction to sustained bass
            // Apply minimal pulse to nodes (meditative, controlled)
            const pulseScale = 1.0 + (sustainedEnergy * 0.05); // Very subtle: 1.0x to 1.05x

            const centerX = network.canvas.width / 2;
            const centerY = network.canvas.height / 2;

            for (let node of network.nodes) {
                const dx = node.x - centerX;
                const dy = node.y - centerY;

                // Apply very subtle pulse
                node.targetX = centerX + dx * pulseScale;
                node.targetY = centerY + dy * pulseScale;
            }
        }

        // On clean beats, minimal pulse (handled by renderer)
        // No explicit action needed here

        network.update(audioData, beatData);
    }

    render(renderer, network, audioData) {
        // Standard rendering - calm and controlled
        renderer.render(network, audioData);
    }
}
