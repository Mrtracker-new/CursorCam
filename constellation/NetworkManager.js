/**
 * NetworkManager.js
 * Manages the constellation network: node generation, edge linking, and topology
 */

import { Node } from './Node.js';
import { Edge } from './Edge.js';

export class NetworkManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.nodes = [];
        this.edges = [];

        // Parameters
        this.nodeCount = 500;
        this.connectionThreshold = 150;

        // Spatial grid for optimization (divide canvas into grid cells)
        this.gridSize = 100; // Cell size in pixels
        this.grid = new Map();

        // Network state
        this.pulseScale = 1.0;
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
    }

    /**
     * Initialize the network with nodes
     */
    initialize(count) {
        this.nodeCount = count;
        this.nodes = [];

        // Create nodes
        for (let i = 0; i < this.nodeCount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const node = new Node(x, y, this.canvas);
            this.nodes.push(node);
        }

        console.log(`✨ Created ${this.nodes.length} nodes`);
    }

    /**
     * Update network state
     */
    update(audioData, beatData) {
        // Update pulse scale based on bass
        this.pulseScale = 1.0 + audioData.bassEnergy * 0.3;

        // Update all nodes
        for (const node of this.nodes) {
            node.update(audioData);
        }

        // Rebuild spatial grid for efficient neighbor search
        this._buildSpatialGrid();

        // Update edges (link nodes based on distance)
        this._updateEdges(audioData);

        // Handle beat events
        if (beatData.isBeat && beatData.confidence > 0.6) {
            this._onBeat(beatData.confidence);
        }
    }

    /**
     * Build spatial grid for optimized neighbor search
     */
    _buildSpatialGrid() {
        this.grid.clear();

        for (const node of this.nodes) {
            if (!node.active) continue;

            const cellX = Math.floor(node.x / this.gridSize);
            const cellY = Math.floor(node.y / this.gridSize);
            const key = `${cellX},${cellY}`;

            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(node);
        }
    }

    /**
     * Get neighboring nodes using spatial grid
     */
    _getNeighbors(node) {
        const cellX = Math.floor(node.x / this.gridSize);
        const cellY = Math.floor(node.y / this.gridSize);
        const neighbors = [];

        // Check current cell and adjacent cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                if (this.grid.has(key)) {
                    neighbors.push(...this.grid.get(key));
                }
            }
        }

        return neighbors;
    }

    /**
     * Update edge connections based on distance threshold
     */
    _updateEdges(audioData) {
        this.edges = [];

        // Dynamic threshold based on mid frequencies
        const dynamicThreshold = this.connectionThreshold + (audioData.midEnergy * 100);

        // For each node, find neighbors within threshold
        for (let i = 0; i < this.nodes.length; i++) {
            const nodeA = this.nodes[i];
            if (!nodeA.active) continue;

            const neighbors = this._getNeighbors(nodeA);

            for (const nodeB of neighbors) {
                if (nodeA === nodeB || !nodeB.active) continue;

                const distance = nodeA.distanceTo(nodeB);

                if (distance < dynamicThreshold) {
                    const edge = new Edge(nodeA, nodeB);
                    edge.distance = distance;
                    edge.update(audioData);
                    this.edges.push(edge);
                }
            }
        }
    }

    /**
     * Handle beat events
     */
    _onBeat(confidence) {
        // Randomly rewire 10-20% of nodes on beat
        const rewireCount = Math.floor(this.nodes.length * (0.1 + confidence * 0.1));

        for (let i = 0; i < rewireCount; i++) {
            const randomNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            randomNode.resetPosition();
        }

        // Spawn temporary burst nodes (25% of rewire count)
        const burstCount = Math.floor(rewireCount * 0.25);
        for (let i = 0; i < burstCount; i++) {
            if (this.nodes.length < this.nodeCount * 1.5) { // Cap max nodes
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                const node = new Node(x, y, this.canvas);
                node.baseSize = 5; // Larger burst nodes
                this.nodes.push(node);
            }
        }
    }

    /**
     * Set node density
     */
    setNodeCount(count) {
        this.nodeCount = count;

        // Add or remove nodes to match target count
        if (this.nodes.length < count) {
            while (this.nodes.length < count) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                this.nodes.push(new Node(x, y, this.canvas));
            }
        } else if (this.nodes.length > count * 1.2) {
            // Remove excess nodes (keep some buffer for burst nodes)
            this.nodes = this.nodes.slice(0, Math.floor(count * 1.2));
        }
    }

    /**
     * Set connection threshold
     */
    setConnectionThreshold(threshold) {
        this.connectionThreshold = threshold;
    }

    /**
     * Apply pulsing effect (for PulsingMesh pattern)
     */
    applyPulse() {
        for (const node of this.nodes) {
            const dx = node.x - this.centerX;
            const dy = node.y - this.centerY;

            node.x = this.centerX + dx * this.pulseScale;
            node.y = this.centerY + dy * this.pulseScale;
        }
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            nodeCount: this.nodes.filter(n => n.active).length,
            edgeCount: this.edges.filter(e => e.active).length
        };
    }
}
