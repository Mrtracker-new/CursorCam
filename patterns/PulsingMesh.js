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
        // Store base positions if not yet stored
        if (this.basePositions.length !== network.nodes.length) {
            this.basePositions = network.nodes.map(node => ({
                x: node.x,
                y: node.y
            }));
        }

        // Calculate pulse scale based on bass
        const pulseScale = 0.9 + audioData.bassEnergy * 0.4; // 0.9x to 1.3x

        const centerX = network.canvas.width / 2;
        const centerY = network.canvas.height / 2;

        // Apply pulsing to all nodes from center
        for (let i = 0; i < network.nodes.length; i++) {
            const node = network.nodes[i];
            const base = this.basePositions[i];

            // Calculate distance from center
            const dx = base.x - centerX;
            const dy = base.y - centerY;

            // Apply pulse scale (step-based, no interpolation)
            node.x = centerX + dx * pulseScale;
            node.y = centerY + dy * pulseScale;
            node.targetX = node.x;
            node.targetY = node.y;
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
