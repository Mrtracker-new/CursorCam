/**
 * PatternBase.js
 * Abstract base class for pattern modes
 */

export class PatternBase {
    constructor(name) {
        this.name = name;
    }

    /**
     * Update pattern state
     * @param {NetworkManager} network - The constellation network
     * @param {Object} audioData - Current audio analysis
     * @param {Object} beatData - Beat detection data
     */
    update(network, audioData, beatData) {
        throw new Error('update() must be implemented by subclass');
    }

    /**
     * Render pattern
     * @param {CanvasRenderer} renderer - The canvas renderer
     * @param {NetworkManager} network - The constellation network
     * @param {Object} audioData - Current audio analysis
     */
    render(renderer, network, audioData) {
        throw new Error('render() must be implemented by subclass');
    }

    /**
     * Called when pattern is activated
     */
    onActivate() {
        // Override if needed
    }

    /**
     * Called when pattern is deactivated
     */
    onDeactivate() {
        // Override if needed
    }
}
