/**
 * PerformanceMonitor.js
 * Tracks and displays FPS and performance metrics
 */

export class PerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.maxFrames = 60;
    this.lastTime = performance.now();
    this.fps = 0;
    this.frameTime = 0;

    // DOM elements
    this.fpsElement = document.getElementById('fps-value');
    this.frameTimeElement = document.getElementById('frametime-value');
    this.nodeCountElement = document.getElementById('node-count');
    this.edgeCountElement = document.getElementById('edge-count');
  }

  /**
   * Update performance metrics
   */
  update() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Track frame times
    this.frameTimes.push(delta);
    if (this.frameTimes.length > this.maxFrames) {
      this.frameTimes.shift();
    }

    // Calculate average FPS
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.fps = Math.round(1000 / avgFrameTime);
    this.frameTime = avgFrameTime.toFixed(1);
  }

  /**
   * Update display
   */
  display(nodeCount, edgeCount) {
    if (this.fpsElement) {
      this.fpsElement.textContent = this.fps;
    }
    if (this.frameTimeElement) {
      this.frameTimeElement.textContent = this.frameTime;
    }
    if (this.nodeCountElement) {
      this.nodeCountElement.textContent = nodeCount;
    }
    if (this.edgeCountElement) {
      this.edgeCountElement.textContent = edgeCount;
    }
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Check if performance is degrading
   */
  isPerformanceLow() {
    return this.fps < 30 && this.frameTimes.length >= this.maxFrames;
  }
}
