/**
 * PatternBase.js
 * Abstract base class for pattern modes
 * @module patterns/PatternBase
 */

/**
 * @typedef {import('../src/types').AudioData} AudioData
 * @typedef {import('../src/types').BeatData} BeatData
 * @typedef {import('../constellation/NetworkManager').NetworkManager} NetworkManager
 * @typedef {import('../renderer/CanvasRenderer').CanvasRenderer} CanvasRenderer
 */

/**
 * Base class for all visual patterns
 * @implements {import('../src/types').IPattern}
 */
export class PatternBase {
  /**
   * Create a new pattern
   * @param {string} name - Display name for the pattern
   */
  constructor(name) {
    /** @type {string} Pattern display name */
    this.name = name;
  }

  /**
   * Update pattern state based on audio data
   * Override this method in subclasses to implement pattern-specific behavior
   *
   * @param {NetworkManager} network - The constellation network manager
   * @param {AudioData} audioData - Current audio analysis data
   * @param {BeatData} beatData - Beat detection data (legacy, prefer audioData.isBeat)
   * @throws {Error} If not implemented by subclass
   */
  update(network, audioData, beatData) {
    throw new Error('update() must be implemented by subclass');
  }

  /**
   * Render pattern to canvas
   * Override this method in subclasses to implement pattern-specific rendering
   *
   * @param {CanvasRenderer} renderer - The canvas renderer for 2D drawing
   * @param {NetworkManager} network - The constellation network manager
   * @param {AudioData} audioData - Current audio analysis data
   * @throws {Error} If not implemented by subclass
   */
  render(renderer, network, audioData) {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Called when pattern is activated (becomes visible)
   * Override in subclasses to setup pattern-specific resources
   */
  onActivate() {
    // Override if needed
  }

  /**
   * Called when pattern is deactivated (becomes hidden)
   * Override in subclasses to cleanup pattern-specific resources
   */
  onDeactivate() {
    // Override if needed
  }
}
