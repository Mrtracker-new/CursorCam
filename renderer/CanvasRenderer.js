/**
 * CanvasRenderer.js
 * Renders the constellation network to canvas using step-based, no-interpolation drawing
 */

import { ColorSystem } from './ColorSystem.js';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colorSystem = new ColorSystem();

    // Rendering settings
    this.backgroundColor = '#000000';

    // Resize canvas to fill window
    this.resize();
  }

  /**
   * Resize canvas to match window dimensions
   */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render the entire network
   */
  render(network, audioData) {
    this.clear();

    // Render edges first (behind nodes)
    this.renderEdges(network.edges, audioData);

    // Render nodes
    this.renderNodes(network.nodes, audioData);
  }

  /**
   * Render all edges
   */
  renderEdges(edges, audioData) {
    // Get dominant color
    const color = this.colorSystem.getColorForFrequency(audioData);

    for (const edge of edges) {
      if (!edge.active) {
        continue;
      }

      const { nodeA, nodeB } = edge;

      // Set line style
      this.ctx.strokeStyle = this.colorSystem.rgbaToString(color, edge.opacity);
      this.ctx.lineWidth = edge.thickness;
      this.ctx.lineCap = 'round';

      // Draw straight line (no curves!)
      this.ctx.beginPath();
      this.ctx.moveTo(nodeA.x, nodeA.y);
      this.ctx.lineTo(nodeB.x, nodeB.y);
      this.ctx.stroke();
    }
  }

  /**
   * Render all nodes with glow effects
   */
  renderNodes(nodes, audioData) {
    // Get dominant color
    const color = this.colorSystem.getColorForFrequency(audioData);

    for (const node of nodes) {
      if (!node.active) {
        continue;
      }

      const { x, y, size, glow } = node;

      // Draw glow effect (if glow > 0)
      if (glow > 0) {
        this.ctx.shadowBlur = glow;
        this.ctx.shadowColor = this.colorSystem.rgbToString(color);
      } else {
        this.ctx.shadowBlur = 0;
      }

      // Draw node as solid circle
      this.ctx.fillStyle = this.colorSystem.rgbToString(color);
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();

      // Reset shadow
      this.ctx.shadowBlur = 0;
    }
  }

  /**
   * Render with stereo split colors (for StereoSplit pattern)
   */
  renderStereo(network, leftEnergy, rightEnergy) {
    this.clear();

    const colors = this.colorSystem.getStereoColors(leftEnergy, rightEnergy);
    const centerX = this.canvas.width / 2;

    // Render edges
    for (const edge of network.edges) {
      if (!edge.active) {
        continue;
      }

      const { nodeA, nodeB } = edge;
      const midX = (nodeA.x + nodeB.x) / 2;

      // Choose color based on edge position
      const color = midX < centerX ? colors.left : colors.right;

      this.ctx.strokeStyle = this.colorSystem.rgbaToString(color, edge.opacity);
      this.ctx.lineWidth = edge.thickness;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(nodeA.x, nodeA.y);
      this.ctx.lineTo(nodeB.x, nodeB.y);
      this.ctx.stroke();
    }

    // Render nodes
    for (const node of network.nodes) {
      if (!node.active) {
        continue;
      }

      const { x, y, size, glow } = node;
      const color = x < centerX ? colors.left : colors.right;

      if (glow > 0) {
        this.ctx.shadowBlur = glow;
        this.ctx.shadowColor = this.colorSystem.rgbToString(color);
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillStyle = this.colorSystem.rgbToString(color);
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
    }
  }

  /**
   * Render polygons (for PolygonEmergence pattern)
   */
  renderPolygons(triangles, audioData) {
    const color = this.colorSystem.getColorForFrequency(audioData);

    this.ctx.fillStyle = this.colorSystem.rgbaToString(color, 0.1);

    for (const triangle of triangles) {
      this.ctx.beginPath();
      this.ctx.moveTo(triangle[0].x, triangle[0].y);
      this.ctx.lineTo(triangle[1].x, triangle[1].y);
      this.ctx.lineTo(triangle[2].x, triangle[2].y);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  /**
   * Set color aggression
   */
  setColorAggression(value) {
    this.colorSystem.setColorAggression(value);
  }

  /**
   * Trigger color palette rotation (on beat)
   */
  rotateColors() {
    this.colorSystem.rotatePalette();
  }
}
