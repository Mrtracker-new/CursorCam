/**
 * StereoSplit.js
 * Mode 4: Split-color network based on stereo channels
 */

import { PatternBase } from './PatternBase.js';

export class StereoSplit extends PatternBase {
  constructor() {
    super('Stereo Split');
    this.leftEnergy = 0;
    this.rightEnergy = 0;
  }

  update(network, audioData, beatData) {
    // For now, simulate stereo by using different frequency bands
    // Left = bass + mid, Right = mid + high
    const bassValue = audioData.bass || audioData.bassEnergy || 0;
    const midValue = audioData.mids || audioData.midEnergy || 0;
    const highValue = audioData.highs || audioData.highEnergy || 0;

    this.leftEnergy = (bassValue + midValue) / 2;
    this.rightEnergy = (midValue + highValue) / 2;

    // Update network nodes with stereo-based colors
    const centerX = network.canvas.width / 2;

    for (const node of network.nodes) {
      if (node.x < centerX) {
        // Left side - warm colors
        node.energy = this.leftEnergy;
      } else {
        // Right side - cool colors
        node.energy = this.rightEnergy;
      }
    }

    // Standard network update
    network.update(audioData, beatData);
  }

  render(renderer, network, audioData) {
    // Use stereo rendering mode
    renderer.renderStereo(network, this.leftEnergy, this.rightEnergy);
  }
}
