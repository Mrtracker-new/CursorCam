/**
 * Edge.js
 * Represents a connection between two nodes
 */

export class Edge {
  constructor(nodeA, nodeB) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;

    // Visual properties
    this.baseThickness = 1;
    this.thickness = this.baseThickness;
    this.opacity = 0.6;
    this.targetOpacity = 0.6;

    // State
    this.active = true;
    this.distance = 0;
  }

  /**
   * Update edge state
   */
  update(audioData) {
    if (!this.active) {
      return;
    }

    // Calculate current distance
    this.distance = this.nodeA.distanceTo(this.nodeB);

    // Update thickness based on bass (step-based)
    this.thickness = this.baseThickness + audioData.bassEnergy * 3;

    // Flicker based on high frequencies (step-based)
    // Random opacity changes create flickering effect
    if (Math.random() < audioData.highEnergy * 0.3) {
      this.targetOpacity = 0.2 + Math.random() * 0.6;
    } else {
      this.targetOpacity = 0.6 + audioData.highEnergy * 0.4;
    }

    // Snap to target opacity (no interpolation)
    this.opacity = this.targetOpacity;
  }

  /**
   * Check if edge should remain active based on distance threshold
   */
  shouldExist(threshold) {
    return this.distance < threshold;
  }

  /**
   * Get midpoint of edge (useful for polygon rendering)
   */
  getMidpoint() {
    return {
      x: (this.nodeA.x + this.nodeB.x) / 2,
      y: (this.nodeA.y + this.nodeB.y) / 2,
    };
  }
}
