/**
 * WaveformSpectrum.js
 * Direct FFT visualization mode - waveform/spectrum visualization
 */

import { PatternBase } from './PatternBase.js';

export class WaveformSpectrum extends PatternBase {
    constructor() {
        super('Waveform Spectrum');
        this.barCount = 64; // Number of frequency bars
        this.barWidth = 10; // Default bar width
    }

    onActivate() {
        // Pattern activated - ready to render
        console.log('Waveform Spectrum activated');
    }

    update(network, audioData, beatData) {
        // Waveform/Spectrum Mode Audio Mapping:
        // Raw FFT → direct geometry displacement
        // Bass → amplitude height
        // Highs → sharp spikes
        // Loudness → overall spread

        // We use the network nodes as visualization bars
        // Rebuild nodes if count doesn't match
        const targetCount = this.barCount;

        if (network.nodes.length !== targetCount) {
            network.setNodeCount(targetCount);
        }

        // Get raw spectrum data
        const spectrum = audioData.spectrum;
        if (!spectrum || spectrum.length === 0) {
            // No spectrum data - set default positions
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

        // Calculate spread based on loudness
        const spread = 0.8 + (audioData.loudness * 0.2); // 0.8 to 1.0

        // Map spectrum bins to nodes
        const binStep = Math.floor(spectrum.length / this.barCount);

        for (let i = 0; i < network.nodes.length && i < this.barCount; i++) {
            const node = network.nodes[i];

            // Get spectrum value for this bar
            const binIndex = i * binStep;
            const value = spectrum[binIndex] / 255; // Normalize to 0-1

            // Position bars horizontally
            node.x = (i + 0.5) * barWidth;
            node.targetX = node.x;

            // Height based on FFT value (bass → taller, highs → sharper spikes)
            const bassBoost = audioData.bass || audioData.bassEnergy || 0;
            const highBoost = audioData.highs || audioData.highEnergy || 0;

            // Bass frequencies = more height, high frequencies = more spike
            const bassInfluence = i < this.barCount / 3 ? bassBoost * 0.5 : 0;
            const highInfluence = i > (this.barCount * 2) / 3 ? highBoost * 0.3 : 0;

            // Clamp height to prevent bars from going off-screen
            const height = Math.min(1.0, value + bassInfluence + highInfluence);

            // Position vertically from bottom of canvas
            const barHeightPixels = height * canvas.height * 0.7 * spread;
            node.y = Math.max(0, canvas.height - barHeightPixels); // Ensure y never goes negative
            node.targetY = node.y;

            // Store energy for rendering
            node.energy = value;
        }

        // Don't call network.update() - we're manually controlling all positions
        // This prevents nodes from drifting
    }

    render(renderer, network, audioData) {
        // Clear canvas with fade effect
        const ctx = renderer.ctx;
        const canvas = renderer.canvas;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw waveform bars
        const color = renderer.colorSystem.getColorForAudioState(audioData);
        const colorStr = renderer.colorSystem.rgbToString(color);

        for (let i = 0; i < network.nodes.length; i++) {
            const node = network.nodes[i];
            const barHeight = Math.max(2, canvas.height - node.y); // Minimum 2px height

            // Draw bar
            ctx.fillStyle = colorStr;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(
                node.x - this.barWidth / 2,
                node.y,
                this.barWidth * 0.8,
                barHeight
            );

            // Draw glow on top
            if (node.energy > 0.1) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = node.energy * 0.5;
                ctx.fillRect(
                    node.x - this.barWidth / 2,
                    node.y,
                    this.barWidth * 0.8,
                    5
                );
            }
        }

        ctx.globalAlpha = 1.0;
    }
}
