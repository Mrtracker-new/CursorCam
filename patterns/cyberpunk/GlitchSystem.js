/**
 * GlitchSystem.js
 * Screen glitch effects for beat drops (chromatic aberration, distortion, noise)
 */

import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class GlitchSystem {
  constructor(composer, colorManager) {
    this.composer = composer;
    this.colorManager = colorManager;

    // Glitch state
    this.glitchIntensity = 0;
    this.glitchDecay = 0.92;
    this.enabled = true;

    // Shader pass
    this.glitchPass = null;

    // Glitch shader
    this.glitchShader = {
      uniforms: {
        tDiffuse: { value: null },
        intensity: { value: 0.0 },
        chromaticAberration: { value: 0.0 },
        distortion: { value: 0.0 },
        scanLines: { value: 0.0 },
        noiseAmount: { value: 0.0 },
        time: { value: 0.0 },
      },

      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float intensity;
        uniform float chromaticAberration;
        uniform float distortion;
        uniform float scanLines;
        uniform float noiseAmount;
        uniform float time;
        varying vec2 vUv;
        
        // Random function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Block displacement
          if (intensity > 0.3) {
            float blockY = floor(uv.y * 20.0 + time * 5.0);
            float offset = (random(vec2(blockY, time * 2.0)) - 0.5) * distortion * 0.1;
            uv.x += offset;
          }
          
          // Chromatic aberration
          vec2 offset = vec2(chromaticAberration) * 0.01;
          float r = texture2D(tDiffuse, uv + offset).r;
          float g = texture2D(tDiffuse, uv).g;
          float b = texture2D(tDiffuse, uv - offset).b;
          
          vec4 color = vec4(r, g, b, 1.0);
          
          // Scan lines
          if (scanLines >0.0) {
            float scanLine = sin(uv.y * 800.0 + time * 10.0) * 0.5 + 0.5;
            color.rgb *= 1.0 - scanLines * 0.3 * (1.0 - scanLine);
          }
          
          // Static noise
          if (noiseAmount > 0.0) {
            float noise = random(uv + time);
            color.rgb += (noise - 0.5) * noiseAmount * 0.2;
          }
          
          gl_FragColor = color;
        }
      `,
    };
  }

  /**
   * Initialize glitch pass and add to composer
   */
  create() {
    this.glitchPass = new ShaderPass(this.glitchShader);
    this.glitchPass.enabled = false; // Start disabled
    this.composer.addPass(this.glitchPass);
  }

  /**
   * Update glitch effect
   */
  update(audioData, stateVisuals) {
    if (!this.enabled || !this.glitchPass) {
      return;
    }

    // Update time uniform
    this.glitchPass.uniforms.time.value += 0.016; // ~60fps

    // Decay glitch intensity
    if (this.glitchIntensity > 0.01) {
      this.glitchIntensity *= this.glitchDecay;
      this._updateUniforms();
    } else if (this.glitchIntensity > 0) {
      this.glitchIntensity = 0;
      this.glitchPass.enabled = false;
    }

    // Subtle glitch on regular beats in certain states
    if (audioData.isBeat && audioData.beatStrength >= 3) {
      const currentState = stateVisuals;
      if (currentState.lightningIntensity > 1.5) {
        // High energy states
        this.triggerGlitch(0.3);
      }
    }
  }

  /**
   * Trigger glitch effect
   */
  triggerGlitch(intensity = 1.0) {
    if (!this.enabled || !this.glitchPass) {
      return;
    }

    this.glitchIntensity = Math.max(this.glitchIntensity, intensity);
    this.glitchPass.enabled = true;
    this._updateUniforms();

    console.log(`📺 Glitch triggered: ${intensity.toFixed(2)}`);
  }

  /**
   * Update shader uniforms based on intensity
   */
  _updateUniforms() {
    const intensity = this.glitchIntensity;

    this.glitchPass.uniforms.intensity.value = intensity;
    this.glitchPass.uniforms.chromaticAberration.value = intensity * 2.0;
    this.glitchPass.uniforms.distortion.value = intensity;
    this.glitchPass.uniforms.scanLines.value = intensity * 0.5;
    this.glitchPass.uniforms.noiseAmount.value = intensity * 0.7;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.glitchPass) {
      this.glitchPass.enabled = false;
      this.glitchIntensity = 0;
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.glitchPass && this.composer) {
      this.composer.removePass(this.glitchPass);
    }
  }
}
