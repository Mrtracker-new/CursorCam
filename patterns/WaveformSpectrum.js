/**
 * WaveformSpectrum.js
 * Multi-mode audio visualization - 5 distinct modes
 */

import { PatternBase } from './PatternBase.js';

/**
 * Visualization modes
 */
const VisualizationMode = {
  BAR_SPECTRUM: 'bar',
  CIRCULAR_SPECTRUM: 'circular',
  WAVEFORM: 'waveform',
  SPECTROGRAM: 'spectrogram',
  CIRCULAR_WAVEFORM: 'circular-wave',
};

export class WaveformSpectrum extends PatternBase {
  constructor() {
    super('Waveform Spectrum');

    // Current visualization mode
    this.currentMode = VisualizationMode.BAR_SPECTRUM;

    // Bar spectrum settings
    this.barCount = 64;
    this.barWidth = 10;

    // Circular spectrum settings
    this.circularBarCount = 72; // More bars for smoother circle
    this.circularRadius = 0;
    this.circularRotation = 0;

    // Waveform settings
    this.waveformPoints = 512; // Number of points to draw

    // Spectrogram settings
    this.spectrogramHistory = [];
    this.spectrogramMaxHistory = 100; // Number of columns to keep
    this.spectrogramBands = 64; // Frequency bands (vertical resolution)

    // Circular waveform settings
    this.circularWavePoints = 360; // Points around the circle
    this.circularWaveRadius = 0;
  }

  /**
   * Set visualization mode
   */
  setMode(mode) {
    if (Object.values(VisualizationMode).includes(mode)) {
      this.currentMode = mode;
      console.log(`📊 Waveform mode switched to: ${mode}`);

      // Clear mode-specific data
      if (mode !== VisualizationMode.SPECTROGRAM) {
        this.spectrogramHistory = [];
      }
    }
  }

  onActivate() {
    console.log('Waveform Spectrum activated');
    // Reset to default mode
    this.currentMode = VisualizationMode.BAR_SPECTRUM;
    this.spectrogramHistory = [];
  }

  update(network, audioData, beatData) {
    // Dispatch to mode-specific update method
    switch (this.currentMode) {
      case VisualizationMode.BAR_SPECTRUM:
        this._updateBarSpectrum(network, audioData);
        break;
      case VisualizationMode.CIRCULAR_SPECTRUM:
        this._updateCircularSpectrum(network, audioData);
        break;
      case VisualizationMode.WAVEFORM:
        this._updateWaveform(network, audioData);
        break;
      case VisualizationMode.SPECTROGRAM:
        this._updateSpectrogram(network, audioData);
        break;
      case VisualizationMode.CIRCULAR_WAVEFORM:
        this._updateCircularWaveform(network, audioData);
        break;
    }
  }

  /**
   * Update - Bar Spectrum Mode (original implementation)
   */
  _updateBarSpectrum(network, audioData) {
    const targetCount = this.barCount;
    if (network.nodes.length !== targetCount) {
      network.setNodeCount(targetCount);
    }

    const spectrum = audioData.spectrum;
    if (!spectrum || spectrum.length === 0) {
      const canvas = network.canvas;
      const barWidth = canvas.width / this.barCount;
      this.barWidth = barWidth;

      for (let i = 0; i < network.nodes.length; i++) {
        const node = network.nodes[i];
        node.x = (i + 0.5) * barWidth;
        node.y = canvas.height - 10;
        node.targetX = node.x;
        node.targetY = node.y;
        node.energy = 0;
      }
      return;
    }

    const canvas = network.canvas;
    const barWidth = canvas.width / this.barCount;
    this.barWidth = barWidth;

    const spread = 0.8 + audioData.loudness * 0.2;
    const binStep = Math.floor(spectrum.length / this.barCount);

    for (let i = 0; i < network.nodes.length && i < this.barCount; i++) {
      const node = network.nodes[i];
      const binIndex = i * binStep;
      const value = spectrum[binIndex] / 255;

      node.x = (i + 0.5) * barWidth;
      node.targetX = node.x;

      const bassBoost = audioData.bassEnergy || 0;
      const highBoost = audioData.highEnergy || 0;
      const bassInfluence = i < this.barCount / 3 ? bassBoost * 0.5 : 0;
      const highInfluence = i > (this.barCount * 2) / 3 ? highBoost * 0.3 : 0;

      const height = Math.min(1.0, value + bassInfluence + highInfluence);
      const barHeightPixels = height * canvas.height * 0.7 * spread;
      node.y = Math.max(0, canvas.height - barHeightPixels);
      node.targetY = node.y;
      node.energy = value;
    }
  }

  /**
   * Update - Circular Spectrum Mode
   */
  _updateCircularSpectrum(network, audioData) {
    const targetCount = this.circularBarCount;
    if (network.nodes.length !== targetCount) {
      network.setNodeCount(targetCount);
    }

    const spectrum = audioData.spectrum;
    const canvas = network.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;

    // Update rotation based on audio energy
    this.circularRotation += audioData.totalEnergy * 0.02;

    if (!spectrum || spectrum.length === 0) {
      this.circularRadius = maxRadius * 0.3;
      for (let i = 0; i < network.nodes.length; i++) {
        const angle = (i / this.circularBarCount) * Math.PI * 2 + this.circularRotation;
        const node = network.nodes[i];
        node.x = centerX + Math.cos(angle) * this.circularRadius;
        node.y = centerY + Math.sin(angle) * this.circularRadius;
        node.energy = 0;
      }
      return;
    }

    const binStep = Math.floor(spectrum.length / this.circularBarCount);

    for (let i = 0; i < network.nodes.length && i < this.circularBarCount; i++) {
      const binIndex = i * binStep;
      const value = spectrum[binIndex] / 255;

      const angle = (i / this.circularBarCount) * Math.PI * 2 + this.circularRotation;

      // Bass boost for intensity
      const bassBoost = audioData.bassEnergy || 0;
      const boost = i < this.circularBarCount / 3 ? bassBoost * 0.3 : 0;
      const intensity = Math.min(1.0, value + boost);

      // Bars extend outward from center
      const innerRadius = maxRadius * 0.3;
      const barLength = intensity * maxRadius * 0.6;
      const outerRadius = innerRadius + barLength;

      const node = network.nodes[i];
      node.x = centerX + Math.cos(angle) * outerRadius;
      node.y = centerY + Math.sin(angle) * outerRadius;
      node.innerX = centerX + Math.cos(angle) * innerRadius;
      node.innerY = centerY + Math.sin(angle) * innerRadius;
      node.angle = angle;
      node.energy = value;
    }
  }

  /**
   * Update - Waveform Mode (oscilloscope)
   */
  _updateWaveform(network, audioData) {
    const waveform = audioData.waveform;
    const canvas = network.canvas;

    if (!waveform || waveform.length === 0) {
      network.setNodeCount(0);
      return;
    }

    // Use subset of waveform points for performance
    const targetCount = this.waveformPoints;
    if (network.nodes.length !== targetCount) {
      network.setNodeCount(targetCount);
    }

    const step = Math.floor(waveform.length / this.waveformPoints);
    const amplitude = canvas.height * 0.4;
    const centerY = canvas.height / 2;

    for (let i = 0; i < this.waveformPoints; i++) {
      const waveIndex = i * step;
      const value = waveform[waveIndex] / 128.0 - 1.0; // Normalize to -1 to 1

      const node = network.nodes[i];
      node.x = (i / this.waveformPoints) * canvas.width;
      node.y = centerY + value * amplitude * (1 + audioData.loudness * 0.5);
      node.energy = Math.abs(value);
    }
  }

  /**
   * Update - Spectrogram Mode (scrolling heatmap)
   */
  _updateSpectrogram(network, audioData) {
    const spectrum = audioData.spectrum;

    if (!spectrum || spectrum.length === 0) {
      return;
    }

    // Sample spectrum into spectrogramBands
    const bandData = new Array(this.spectrogramBands);
    const binStep = Math.floor(spectrum.length / this.spectrogramBands);

    for (let i = 0; i < this.spectrogramBands; i++) {
      const binIndex = i * binStep;
      bandData[i] = spectrum[binIndex] / 255;
    }

    // Add to history
    this.spectrogramHistory.push(bandData);

    // Limit history size
    if (this.spectrogramHistory.length > this.spectrogramMaxHistory) {
      this.spectrogramHistory.shift();
    }

    // We don't use nodes for spectrogram - render directly to canvas
    network.setNodeCount(0);
  }

  /**
   * Update - Circular Waveform Mode (circular oscilloscope)
   */
  _updateCircularWaveform(network, audioData) {
    const waveform = audioData.waveform;
    const canvas = network.canvas;

    if (!waveform || waveform.length === 0) {
      network.setNodeCount(0);
      return;
    }

    const targetCount = this.circularWavePoints;
    if (network.nodes.length !== targetCount) {
      network.setNodeCount(targetCount);
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.25;
    const maxDisplacement = baseRadius * 0.5;

    const step = Math.floor(waveform.length / this.circularWavePoints);

    for (let i = 0; i < this.circularWavePoints; i++) {
      const waveIndex = i * step;
      const value = waveform[waveIndex] / 128.0 - 1.0; // -1 to 1

      const angle = (i / this.circularWavePoints) * Math.PI * 2;
      const displacement = value * maxDisplacement * (1 + audioData.loudness * 0.5);
      const radius = baseRadius + displacement;

      const node = network.nodes[i];
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      node.energy = Math.abs(value);
    }
  }

  render(renderer, network, audioData) {
    // Dispatch to mode-specific render method
    switch (this.currentMode) {
      case VisualizationMode.BAR_SPECTRUM:
        this._renderBarSpectrum(renderer, network, audioData);
        break;
      case VisualizationMode.CIRCULAR_SPECTRUM:
        this._renderCircularSpectrum(renderer, network, audioData);
        break;
      case VisualizationMode.WAVEFORM:
        this._renderWaveform(renderer, network, audioData);
        break;
      case VisualizationMode.SPECTROGRAM:
        this._renderSpectrogram(renderer, network, audioData);
        break;
      case VisualizationMode.CIRCULAR_WAVEFORM:
        this._renderCircularWaveform(renderer, network, audioData);
        break;
    }
  }

  /**
   * Render - Bar Spectrum Mode
   */
  _renderBarSpectrum(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const color = renderer.colorSystem.getColorForAudioState(audioData);
    const colorStr = renderer.colorSystem.rgbToString(color);

    for (let i = 0; i < network.nodes.length; i++) {
      const node = network.nodes[i];
      const barHeight = Math.max(2, canvas.height - node.y);

      ctx.fillStyle = colorStr;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(node.x - this.barWidth / 2, node.y, this.barWidth * 0.8, barHeight);

      if (node.energy > 0.1) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = node.energy * 0.5;
        ctx.fillRect(node.x - this.barWidth / 2, node.y, this.barWidth * 0.8, 5);
      }
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * Render - Circular Spectrum Mode
   */
  _renderCircularSpectrum(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const color = renderer.colorSystem.getColorForAudioState(audioData);
    const colorStr = renderer.colorSystem.rgbToString(color);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let i = 0; i < network.nodes.length; i++) {
      const node = network.nodes[i];

      // Draw bar from inner to outer radius
      ctx.beginPath();
      ctx.moveTo(node.innerX, node.innerY);
      ctx.lineTo(node.x, node.y);
      ctx.strokeStyle = colorStr;
      ctx.globalAlpha = 0.7 + node.energy * 0.3;
      ctx.stroke();

      // Glow effect
      if (node.energy > 0.1) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = node.energy;
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * Render - Waveform Mode
   */
  _renderWaveform(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (network.nodes.length === 0) {
      return;
    }

    const color = renderer.colorSystem.getColorForAudioState(audioData);
    const colorStr = renderer.colorSystem.rgbToString(color);

    // Draw waveform as connected line
    ctx.beginPath();
    ctx.moveTo(network.nodes[0].x, network.nodes[0].y);

    for (let i = 1; i < network.nodes.length; i++) {
      ctx.lineTo(network.nodes[i].x, network.nodes[i].y);
    }

    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    // Add glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = colorStr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1.0;
  }

  /**
   * Render - Spectrogram Mode
   */
  _renderSpectrogram(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.spectrogramHistory.length === 0) {
      return;
    }

    const columnWidth = canvas.width / this.spectrogramMaxHistory;
    const rowHeight = canvas.height / this.spectrogramBands;

    // Draw each column from history
    for (let col = 0; col < this.spectrogramHistory.length; col++) {
      const bandData = this.spectrogramHistory[col];
      const x = col * columnWidth;

      for (let row = 0; row < this.spectrogramBands; row++) {
        const value = bandData[row];
        const y = canvas.height - (row + 1) * rowHeight; // Flip vertically

        // Color based on intensity (heatmap)
        const hue = 240 - value * 240; // Blue (240) to Red (0)
        const saturation = 100;
        const lightness = value * 50;

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, y, columnWidth + 1, rowHeight + 1); // +1 to avoid gaps
      }
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * Render - Circular Waveform Mode
   */
  _renderCircularWaveform(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (network.nodes.length === 0) {
      return;
    }

    const color = renderer.colorSystem.getColorForAudioState(audioData);
    const colorStr = renderer.colorSystem.rgbToString(color);

    // Draw circular waveform as connected line
    ctx.beginPath();
    ctx.moveTo(network.nodes[0].x, network.nodes[0].y);

    for (let i = 1; i < network.nodes.length; i++) {
      ctx.lineTo(network.nodes[i].x, network.nodes[i].y);
    }

    // Close the circle
    ctx.closePath();

    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = colorStr;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill with semi-transparent color
    ctx.fillStyle = colorStr;
    ctx.globalAlpha = 0.1;
    ctx.fill();

    ctx.globalAlpha = 1.0;
  }
}
