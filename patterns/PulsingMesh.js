/**
 * PulsingMesh.js
 * Mode 2: Network that pulses/breathes with bass
 */

import { PatternBase } from './PatternBase.js';

export class PulsingMesh extends PatternBase {
    constructor() {
        super('Pulsing Mesh');
        this.basePositions = []; // Store original positions
    }

    onActivate() {
        // Store base positions when activated
        this.basePositions = [];
    }

    update(network, audioData, beatData) {
        // PulsingMesh Audio Mapping:
        // Bass → mesh expansion/contraction
        // Mids → color shift intensity (handled by renderer)
        // Highs → node brightness
        // Silence → gentle drift back to original positions

        // Store base positions if not yet stored
        if (this.basePositions.length !== network.nodes.length) {
            this.basePositions = network.nodes.map(node => ({
                x: node.x,
                y: node.y
            }));
        }

        const centerX = network.canvas.width / 2;
        const centerY = network.canvas.height / 2;

        // Check for silence
        if (audioData.isSilence) {
            // During silence, gently drift back to original positions
            for (let i = 0; i < network.nodes.length; i++) {
                const node = network.nodes[i];
                const base = this.basePositions[i];

                // Gentle drift (interpolate towards base position)
                node.x = node.x * 0.98 + base.x * 0.02;
                node.y = node.y * 0.98 + base.y * 0.02;
                node.targetX = node.x;
                node.targetY = node.y;
            }
        } else {
            // Calculate pulse scale based on bass (use smoothed for less jitter)
            const bassValue = audioData.smoothBass || audioData.bass || audioData.bassEnergy || 0;
            const pulseScale = 0.85 + bassValue * 0.5; // 0.85x to 1.35x

            // Apply pulsing to all nodes from center
            for (let i = 0; i < network.nodes.length; i++) {
                const node = network.nodes[i];
                const base = this.basePositions[i];

                // Calculate distance from center
                const dx = base.x - centerX;
                const dy = base.y - centerY;

                // Apply pulse scale
                node.x = centerX + dx * pulseScale;
                node.y = centerY + dy * pulseScale;
                node.targetX = node.x;
                node.targetY = node.y;
            }
        }

        // Standard network update (will update edges based on new positions)
        network.update(audioData, beatData);

        // On beat, reset base positions (creates "snap" effect)
        if (beatData.isBeat && beatData.confidence > 0.7) {
            this.basePositions = network.nodes.map(node => ({
                x: node.x,
                y: node.y
            }));
        }
    }

    render(renderer, network, audioData) {
        // Standard rendering
        renderer.render(network, audioData);
    }
}
