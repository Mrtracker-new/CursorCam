/**
 * Node.js
 * Represents a single node in the constellation network
 */

export class Node {
    constructor(x, y, canvas) {
        // Position
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;

        // Canvas boundaries for wrapping
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;

        // Visual properties
        this.baseSize = 3;
        this.size = this.baseSize;
        this.targetSize = this.baseSize;
        this.glow = 0;
        this.targetGlow = 0;

        // Color (RGB)
        this.color = { r: 0, g: 255, b: 255 }; // Default cyan

        // State
        this.active = true;
        this.energy = 0;

        // For snap movement
        this.velocityX = 0;
        this.velocityY = 0;
    }

    /**
     * Update node state (called each frame)
     */
    update(audioData) {
        if (!this.active) return;

        // Step-based movement (no smooth interpolation)
        // Occasional random jumps based on high frequency energy
        if (Math.random() < audioData.highEnergy * 0.02) {
            const jumpDistance = 20 + audioData.highEnergy * 30;
            const angle = Math.random() * Math.PI * 2;
            this.targetX = this.x + Math.cos(angle) * jumpDistance;
            this.targetY = this.y + Math.sin(angle) * jumpDistance;

            // Wrap around canvas
            this.targetX = (this.targetX + this.canvasWidth) % this.canvasWidth;
            this.targetY = (this.targetY + this.canvasHeight) % this.canvasHeight;
        }

        // Snap to target position (step-based, no easing)
        if (Math.abs(this.x - this.targetX) > 1 || Math.abs(this.y - this.targetY) > 1) {
            this.x = this.targetX;
            this.y = this.targetY;
        }

        // Update size based on bass (step-based)
        this.targetSize = this.baseSize + audioData.bassEnergy * 20;
        this.size = this.targetSize; // No interpolation

        // Update glow based on high frequencies (step-based)
        this.targetGlow = audioData.highEnergy * 30;
        this.glow = this.targetGlow; // No interpolation

        // Update energy
        this.energy = audioData.totalEnergy;
    }

    /**
     * Set node color
     */
    setColor(r, g, b) {
        this.color.r = r;
        this.color.g = g;
        this.color.b = b;
    }

    /**
     * Calculate distance to another node
     */
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Reset node to random position
     */
    resetPosition() {
        this.x = Math.random() * this.canvasWidth;
        this.y = Math.random() * this.canvasHeight;
        this.targetX = this.x;
        this.targetY = this.y;
    }
}
