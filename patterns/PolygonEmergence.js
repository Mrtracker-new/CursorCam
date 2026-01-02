/**
 * PolygonEmergence.js
 * Mode 3: Detects and fills triangles in network topology
 */

import { PatternBase } from './PatternBase.js';

export class PolygonEmergence extends PatternBase {
    constructor() {
        super('Polygon Emergence');
        this.triangles = [];
        this.maxTriangles = 50; // Limit for performance
    }

    update(network, audioData, beatData) {
        // Standard network update
        network.update(audioData, beatData);

        // Find triangles in network
        this.triangles = this._findTriangles(network, audioData);
    }

    /**
     * Find triangular formations in the network
     */
    _findTriangles(network, audioData) {
        const triangles = [];
        const threshold = network.connectionThreshold + (audioData.midEnergy * 100);

        // Formation probability based on mid frequencies
        const formationProb = audioData.midEnergy * 0.7;

        if (Math.random() > formationProb) {
            return []; // Skip this frame
        }

        // Simple triangle detection: check if 3 connected nodes form a triangle
        const edges = network.edges;

        for (let i = 0; i < edges.length && triangles.length < this.maxTriangles; i++) {
            const edge1 = edges[i];

            for (let j = i + 1; j < edges.length && triangles.length < this.maxTriangles; j++) {
                const edge2 = edges[j];

                // Check if edges share a node
                let shared = null;
                let node1 = null;
                let node2 = null;

                if (edge1.nodeA === edge2.nodeA) {
                    shared = edge1.nodeA;
                    node1 = edge1.nodeB;
                    node2 = edge2.nodeB;
                } else if (edge1.nodeA === edge2.nodeB) {
                    shared = edge1.nodeA;
                    node1 = edge1.nodeB;
                    node2 = edge2.nodeA;
                } else if (edge1.nodeB === edge2.nodeA) {
                    shared = edge1.nodeB;
                    node1 = edge1.nodeA;
                    node2 = edge2.nodeB;
                } else if (edge1.nodeB === edge2.nodeB) {
                    shared = edge1.nodeB;
                    node1 = edge1.nodeA;
                    node2 = edge2.nodeA;
                }

                if (shared && node1 && node2) {
                    // Check if node1 and node2 are also connected (forms triangle)
                    const distance = node1.distanceTo(node2);
                    if (distance < threshold) {
                        triangles.push([shared, node1, node2]);
                    }
                }
            }
        }

        return triangles;
    }

    render(renderer, network, audioData) {
        // Render standard network first
        renderer.render(network, audioData);

        // Then render polygons on top
        if (this.triangles.length > 0) {
            renderer.renderPolygons(this.triangles, audioData);
        }
    }
}
