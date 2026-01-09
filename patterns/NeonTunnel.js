/**
 * NeonTunnel.js
 * Hard-edged, angular, wireframe neon tunnel visual engine
 * Fully audio-reactive with step-based motion (NO EASING)
 */

import { PatternBase } from './PatternBase.js';

/**
 * Polygon types for tunnel frames
 */
const PolygonType = {
  TRIANGLE: { vertices: 3, name: 'triangle' },
  SQUARE: { vertices: 4, name: 'square' },
  PENTAGON: { vertices: 5, name: 'pentagon' },
  HEXAGON: { vertices: 6, name: 'hexagon' },
  HEPTAGON: { vertices: 7, name: 'heptagon' },
  OCTAGON: { vertices: 8, name: 'octagon' },
};

/**
 * Pattern variant modes
 */
const TunnelPattern = {
  STRAIGHT: 'straight', // Standard forward motion
  TWISTED: 'twisted', // Step-rotation per frame
  COLLAPSING: 'collapsing', // Frames compress inward
  EXPANDING: 'expanding', // Frames push outward
  SPLIT: 'split', // Two-lane tunnel
};

/**
 * Color modes
 */
const ColorMode = {
  SINGLE: 'single', // All frames one color
  GRADIENT: 'gradient', // Color changes with depth
  SPLIT: 'split', // Left/right different colors
  ALTERNATING: 'alternating', // Frame-by-frame alternation
};

/**
 * Neon color palette
 */
const NeonColors = {
  PINK: '#FF10F0',
  PURPLE: '#B026FF',
  YELLOW: '#FFFF00',
  CYAN: '#00FFFF',
  ELECTRIC_BLUE: '#0080FF',
};

const NEON_PALETTE = [
  NeonColors.PINK,
  NeonColors.PURPLE,
  NeonColors.CYAN,
  NeonColors.ELECTRIC_BLUE,
  NeonColors.YELLOW,
];

/**
 * Tunnel Frame structure
 */
class TunnelFrame {
  constructor(shapeType, vertices, depth, scale, rotation, color, thickness) {
    this.shapeType = shapeType;
    this.vertices = vertices; // Array of {x, y, z}
    this.depth = depth;
    this.scale = scale;
    this.rotation = rotation;
    this.color = color;
    this.thickness = thickness;
    this.visible = true;
  }
}

/**
 * Neon Tunnel Pattern - Main Class
 */
export class NeonTunnel extends PatternBase {
  constructor() {
    super('Neon Tunnel');

    // Tunnel geometry configuration
    this.config = {
      frameSpacing: 30, // Units between frames (REDUCED for denser tunnel)
      maxDepth: 1000, // Maximum tunnel depth
      baseScale: 600, // Base frame scale (calculated dynamically in onActivate)
      maxFrames: 35, // Maximum number of frames (INCREASED)
      fov: 600, // Field of view for perspective
      baseThickness: 4.0, // Line thickness
      connectFrames: true, // Connect frames with depth lines
    };

    // Tunnel state
    this.frames = [];
    this.currentSpeed = 1.0;
    this.currentPattern = TunnelPattern.STRAIGHT;
    this.colorMode = ColorMode.GRADIENT;
    this.axisRotation = 0;

    // Audio-reactive state
    this.beatCount = 0;
    this.barCount = 0;
    this.lastBeatTime = 0;

    // Color state
    this.currentPalette = [...NEON_PALETTE];

    // Performance
    this.frameCount = 0;
  }

  /**
   * Initialize tunnel frames
   */
  onActivate() {
    console.log('🌀 Neon Tunnel activated');

    // Calculate canvas diagonal for immersive scaling
    const canvas = document.getElementById('constellation-canvas');
    if (canvas) {
      const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
      // Set base scale to ~70% of diagonal so closest frames extend beyond edges
      this.config.baseScale = diagonal * 0.7;
    }

    this._initializeTunnel();
  }

  /**
   * Initialize tunnel with frames
   */
  _initializeTunnel() {
    this.frames = [];

    for (let depth = 0; depth < this.config.maxDepth; depth += this.config.frameSpacing) {
      const frame = this._generatePolygonFrame(
        this._randomPolygonType(),
        depth,
        this.config.baseScale,
        0,
        this._randomNeonColor(),
        this.config.baseThickness
      );
      this.frames.push(frame);
    }
  }

  /**
   * Generate a polygon frame with dynamic canvas-aware scaling
   */
  _generatePolygonFrame(polygonType, depth, baseScale, rotation, color, thickness) {
    const vertices = [];
    const numVertices = polygonType.vertices;
    const angleStep = (Math.PI * 2) / numVertices;

    // Dynamic scaling based on depth for immersive effect
    // Closer frames = much larger (extend beyond screen)
    // Further frames = smaller (create depth illusion)
    const depthFactor = 1.0 - depth / this.config.maxDepth;
    const dynamicScale = baseScale * (0.3 + depthFactor * 2.5); // Range: 0.3x to 2.8x

    for (let i = 0; i < numVertices; i++) {
      const angle = i * angleStep + rotation;
      const x = Math.cos(angle) * dynamicScale;
      const y = Math.sin(angle) * dynamicScale;
      vertices.push({ x, y, z: depth });
    }

    return new TunnelFrame(polygonType, vertices, depth, dynamicScale, rotation, color, thickness);
  }

  /**
   * Generate irregular polygon
   */
  _generateIrregularPolygon(
    numVertices,
    depth,
    scale,
    rotation,
    color,
    thickness,
    randomnessFactor = 0.3
  ) {
    const vertices = [];
    const angleStep = (Math.PI * 2) / numVertices;

    for (let i = 0; i < numVertices; i++) {
      const angle = i * angleStep + rotation;
      const radius = scale * (1.0 + (Math.random() - 0.5) * randomnessFactor);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      vertices.push({ x, y, z: depth });
    }

    return new TunnelFrame(
      { vertices: numVertices, name: 'irregular' },
      vertices,
      depth,
      scale,
      rotation,
      color,
      thickness
    );
  }

  /**
   * Random polygon type
   */
  _randomPolygonType() {
    const types = Object.values(PolygonType);
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Random neon color
   */
  _randomNeonColor() {
    return NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)];
  }

  /**
   * Update tunnel state
   */
  update(network, audioData, beatData) {
    this.frameCount++;

    // Handle beat events
    if (beatData.isBeat && beatData.confidence > 0.6) {
      this._onBeat(audioData, beatData);
    }

    // Map audio to visual parameters
    const visualParams = this._mapAudioToVisuals(audioData, beatData);

    // Update tunnel motion
    this._updateMotion(visualParams);

    // Apply pattern variant
    this._applyPattern();

    // Assign colors
    this._assignColors();
  }

  /**
   * Map audio data to visual parameters
   * REDESIGNED FOR MUSIC-REACTIVE PULSING
   */
  _mapAudioToVisuals(audioData, beatData) {
    // BASS → SLOW SPEED + DRAMATIC PULSING (not fast motion)
    const baseSpeed = this._map(audioData.bassEnergy, 0.0, 1.0, 0.2, 1.5); // MUCH SLOWER
    const tunnelSpeed = baseSpeed;

    // BASS → AGGRESSIVE SCALE PULSE (main visual effect)
    // This makes the tunnel BREATHE with the music
    const bassPulse = 1.0 + audioData.bassEnergy * 1.5; // Range: 1.0x to 2.5x (HUGE pulse)

    // ADDITIONAL: Global bass-driven "breathing" effect
    const breathingPulse = Math.sin(this.frameCount * 0.05) * audioData.bassEnergy * 0.2;

    // MID → Complexity & Rotation (MORE REACTIVE)
    let targetVertexCount = 5;
    let rotationStep = 0;

    if (audioData.midEnergy > 0.3) {
      // Lower threshold for more reactivity
      targetVertexCount = Math.floor(this._map(audioData.midEnergy, 0.3, 1.0, 4, 8));
      rotationStep = this._map(audioData.midEnergy, 0.0, 1.0, 0, 90); // More rotation
    }

    // HIGH → Flicker & Color (MORE AGGRESSIVE)
    const flickerRate = this._map(audioData.highEnergy, 0.0, 1.0, 0, 20); // 2x flicker rate
    const shouldFlicker = Math.random() < flickerRate / 60.0;

    // BEAT-REACTIVE THICKNESS (ENHANCED)
    const thicknessPulse = 1.0 + audioData.totalEnergy * 1.0; // 2x thickness range

    return {
      speed: tunnelSpeed,
      scaleFactor: bassPulse + breathingPulse, // Combined pulsing
      vertexCount: targetVertexCount,
      rotation: rotationStep,
      shouldFlicker,
      thicknessPulse,
    };
  }

  /**
   * Update tunnel motion (step-based, NO easing)
   * REDESIGNED: Slower motion, focus on PULSING not SPEED
   */
  _updateMotion(visualParams) {
    // INSTANT speed change (NO easing)
    this.currentSpeed = visualParams.speed;

    // Move tunnel frames toward camera (REDUCED multiplier for slower motion)
    const deltaZ = this.currentSpeed * 0.8; // SLOWER movement

    for (const frame of this.frames) {
      frame.depth -= deltaZ;

      // Recycle frames that pass camera
      if (frame.depth < -this.config.frameSpacing) {
        frame.depth += this.config.maxDepth;

        // Regenerate frame with new shape
        const newType = this._randomPolygonType();
        frame.shapeType = newType;
        frame.vertices = this._generatePolygonVertices(
          newType.vertices,
          frame.scale,
          frame.rotation
        );
      }
    }

    // Apply scale pulse (INSTANT, no interpolation) - ENHANCED
    for (const frame of this.frames) {
      // Dynamic depth-based scaling
      const depthFactor = 1.0 - frame.depth / this.config.maxDepth;
      const baseFrameScale = this.config.baseScale * (0.3 + depthFactor * 2.5);

      // Apply bass pulse
      frame.scale = baseFrameScale * visualParams.scaleFactor;

      // Apply thickness pulse
      frame.thickness = this.config.baseThickness * visualParams.thicknessPulse;

      // Regenerate vertices with new scale
      frame.vertices = this._generatePolygonVertices(
        frame.shapeType.vertices,
        frame.scale,
        frame.rotation
      );
    }

    // Apply flicker
    if (visualParams.shouldFlicker) {
      for (const frame of this.frames) {
        if (Math.random() < 0.3) {
          frame.visible = !frame.visible;
        }
      }
    } else {
      // Ensure all frames are visible when not flickering
      for (const frame of this.frames) {
        frame.visible = true;
      }
    }
  }

  /**
   * Generate polygon vertices
   */
  _generatePolygonVertices(numVertices, scale, rotation) {
    const vertices = [];
    const angleStep = (Math.PI * 2) / numVertices;

    for (let i = 0; i < numVertices; i++) {
      const angle = i * angleStep + rotation;
      const x = Math.cos(angle) * scale;
      const y = Math.sin(angle) * scale;
      vertices.push({ x, y, z: 0 }); // Z will be set by frame depth
    }

    return vertices;
  }

  /**
   * Apply pattern variant transformations
   */
  _applyPattern() {
    switch (this.currentPattern) {
      case TunnelPattern.STRAIGHT:
        // No modifications needed
        break;

      case TunnelPattern.TWISTED:
        // Step-rotation based on depth
        for (const frame of this.frames) {
          const rotationSteps = Math.floor(frame.depth / 100);
          frame.rotation = rotationSteps * 15 * (Math.PI / 180); // 15° per step
        }
        break;

      case TunnelPattern.COLLAPSING:
        // Scale decreases with depth
        for (const frame of this.frames) {
          const depthRatio = frame.depth / this.config.maxDepth;
          frame.scale = this.config.baseScale * (1.0 - depthRatio * 0.7);
        }
        break;

      case TunnelPattern.EXPANDING:
        // Scale increases with depth
        for (const frame of this.frames) {
          const depthRatio = frame.depth / this.config.maxDepth;
          frame.scale = this.config.baseScale * (1.0 + depthRatio * 0.5);
        }
        break;

      case TunnelPattern.SPLIT:
        // Will be handled in render (render twice with offset)
        break;
    }
  }

  /**
   * Assign colors to frames
   * ENHANCED: Use ALL 5 neon colors actively
   */
  _assignColors() {
    switch (this.colorMode) {
      case ColorMode.SINGLE:
        // Rotate through colors on beats (more variety)
        const singleColor = this.currentPalette[this.beatCount % this.currentPalette.length];
        for (const frame of this.frames) {
          frame.color = singleColor;
        }
        break;

      case ColorMode.GRADIENT:
        // RANDOM COLOR PER FRAME (maximum variety!)
        for (const frame of this.frames) {
          frame.color = this._randomNeonColor();
        }
        break;

      case ColorMode.SPLIT:
      // Split by position (not applicable for tunnel, fallback to alternating)
      case ColorMode.ALTERNATING:
        // Cycle through ALL 5 colors (not just 2)
        for (let i = 0; i < this.frames.length; i++) {
          this.frames[i].color = this.currentPalette[i % this.currentPalette.length];
        }
        break;
    }
  }

  /**
   * Handle beat events
   */
  _onBeat(audioData, beatData) {
    this.beatCount++;

    // Every 4 beats: change color mode
    if (this.beatCount % 4 === 0) {
      this.barCount++;
      this._changeColorMode();
    }

    // Every 16 beats: change pattern variant
    if (this.beatCount % 16 === 0) {
      this._changePattern();
    }

    // Beat drop effects (instant changes)
    if (beatData.confidence > 0.8) {
      this._onBeatDrop();
    }
  }

  /**
   * Handle beat drop (strong beat)
   * ENHANCED: More dramatic and visible effects
   */
  _onBeatDrop() {
    // 1. Random shape change (50% chance per frame - MORE FREQUENT)
    for (const frame of this.frames) {
      if (Math.random() < 0.5) {
        const newType = this._randomPolygonType();
        frame.shapeType = newType;
        frame.vertices = this._generatePolygonVertices(
          newType.vertices,
          frame.scale,
          frame.rotation
        );
      }
    }

    // 2. Axis rotation (90° steps) (70% chance - MORE FREQUENT)
    if (Math.random() < 0.7) {
      this.axisRotation += 90;
    }

    // 3. INSTANT SCALE BURST (NEW - visual "hit")
    for (const frame of this.frames) {
      frame.thickness = this.config.baseThickness * 2.0; // Thick burst
    }

    // 4. Depth jump (60% chance - MORE FREQUENT)
    if (Math.random() < 0.6) {
      const depthJump = (Math.random() - 0.5) * 600; // ±300 units (LARGER)
      for (const frame of this.frames) {
        frame.depth += depthJump;
      }
    }

    // 5. Color palette shuffle (NEW)
    if (Math.random() < 0.5) {
      this.currentPalette = [...NEON_PALETTE].sort(() => Math.random() - 0.5);
    }
  }

  /**
   * Change color mode
   */
  _changeColorMode() {
    const modes = Object.values(ColorMode);
    const currentIndex = modes.indexOf(this.colorMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.colorMode = modes[nextIndex];
  }

  /**
   * Change pattern variant
   */
  _changePattern() {
    const patterns = Object.values(TunnelPattern);
    const currentIndex = patterns.indexOf(this.currentPattern);
    const nextIndex = (currentIndex + 1) % patterns.length;
    this.currentPattern = patterns[nextIndex];
    console.log(`🔄 Pattern changed to: ${this.currentPattern}`);
  }

  /**
   * Render the tunnel
   */
  render(renderer, network, audioData) {
    const ctx = renderer.ctx;
    const canvas = renderer.canvas;

    // Clear with pure black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get visible frames (cull frames outside viewport)
    const visibleFrames = this._cullFrames();

    // Sort frames back-to-front for proper wireframe rendering
    visibleFrames.sort((a, b) => b.depth - a.depth);

    // Render connecting lines first (depth connections)
    if (this.config.connectFrames) {
      this._renderConnectingLines(ctx, canvas, visibleFrames);
    }

    // Render frames
    if (this.currentPattern === TunnelPattern.SPLIT) {
      // Render twice with offset
      this._renderFrames(ctx, canvas, visibleFrames, -100);
      this._renderFrames(ctx, canvas, visibleFrames, 100);
    } else {
      this._renderFrames(ctx, canvas, visibleFrames, 0);
    }
  }

  /**
   * Cull frames outside viewport
   */
  _cullFrames() {
    return this.frames.filter((frame) => {
      return frame.depth >= -100 && frame.depth <= this.config.maxDepth && frame.visible;
    });
  }

  /**
   * Render connecting lines between frames (fills the tunnel corridor)
   */
  _renderConnectingLines(ctx, canvas, frames) {
    if (frames.length < 2) {
      return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((this.axisRotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Connect consecutive frames
    for (let i = 0; i < frames.length - 1; i++) {
      const frame1 = frames[i];
      const frame2 = frames[i + 1];

      // Skip if frames are too far apart
      if (Math.abs(frame1.depth - frame2.depth) > this.config.frameSpacing * 2) {
        continue;
      }

      // Project both frames
      const vertices1 = this._applyPerspective(frame1, canvas.width, canvas.height, 0);
      const vertices2 = this._applyPerspective(frame2, canvas.width, canvas.height, 0);

      // Connect corresponding vertices
      const numConnections = Math.min(vertices1.length, vertices2.length);

      // Draw lines between corresponding vertices
      ctx.lineWidth = frame1.thickness * 0.5; // Thinner connecting lines
      ctx.lineCap = 'round';
      ctx.strokeStyle = frame1.color;
      ctx.globalAlpha = 0.6; // Slightly transparent for depth

      for (let v = 0; v < numConnections; v++) {
        const v1 = vertices1[v];
        const v2 = vertices2[v];

        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1.0; // Reset alpha
    ctx.restore();
  }

  /**
   * Render tunnel frames
   */
  _renderFrames(ctx, canvas, frames, offsetX = 0) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Apply axis rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((this.axisRotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    for (const frame of frames) {
      // Apply perspective projection
      const projectedVertices = this._applyPerspective(frame, canvas.width, canvas.height, offsetX);

      // Draw wireframe
      ctx.strokeStyle = frame.color;
      ctx.lineWidth = frame.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';

      ctx.beginPath();
      for (let i = 0; i < projectedVertices.length; i++) {
        const v = projectedVertices[i];
        if (i === 0) {
          ctx.moveTo(v.x, v.y);
        } else {
          ctx.lineTo(v.x, v.y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Apply perspective projection to frame vertices
   */
  _applyPerspective(frame, canvasWidth, canvasHeight, offsetX = 0) {
    const projectedVertices = [];
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Perspective scale factor
    const perspectiveScale = this.config.fov / (frame.depth + this.config.fov);

    for (const vertex of frame.vertices) {
      // Apply frame rotation to vertex
      const rotatedX = vertex.x * Math.cos(frame.rotation) - vertex.y * Math.sin(frame.rotation);
      const rotatedY = vertex.x * Math.sin(frame.rotation) + vertex.y * Math.cos(frame.rotation);

      // Project to screen space
      const screenX = rotatedX * perspectiveScale + centerX + offsetX;
      const screenY = rotatedY * perspectiveScale + centerY;

      projectedVertices.push({ x: screenX, y: screenY });
    }

    return projectedVertices;
  }

  /**
   * Utility: Map value from one range to another
   */
  _map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
}
