/**
 * StaticConstellation.js
 * Mode 1: Static constellation field with slow changes
 */

import { PatternBase } from './PatternBase.js';

export class StaticConstellation extends PatternBase {
    constructor() {
        super('Static Constellation');
        this.driftSpeed = 0.2; // Slow drift
    }

    update(network, audioData, beatData) {
        // Apply subtle drift to nodes
        for (const node of network.nodes) {
            if (Math.random() < 0.01) { // 1% chance per frame
                const angle = Math.random() * Math.PI * 2;
                const distance = this.driftSpeed + audioData.totalEnergy * 0.5;

                node.targetX += Math.cos(angle) * distance;
                node.targetY += Math.sin(angle) * distance;

                // Keep within canvas bounds
                node.targetX = Math.max(0, Math.min(network.canvas.width, node.targetX));
                node.targetY = Math.max(0, Math.min(network.canvas.height, node.targetY));
            }
        }

        // Standard network update
        network.update(audioData, beatData);
    }

    render(renderer, network, audioData) {
        // Standard rendering
        renderer.render(network, audioData);
    }
}
