/**
 * Type definitions for Network/Constellation System
 */

/**
 * 2D position
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 2D velocity
 */
export interface Velocity {
  vx: number;
  vy: number;
}

/**
 * Node in the constellation network
 */
export interface INode {
  /** Unique node ID */
  id: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** X velocity */
  vx: number;
  /** Y velocity */
  vy: number;
  /** Node radius */
  radius: number;
  /** Canvas width (for boundary detection) */
  canvasWidth: number;
  /** Canvas height (for boundary detection) */
  canvasHeight: number;

  /**
   * Update node position
   */
  update(): void;

  /**
   * Calculate distance to another node
   */
  distanceTo(other: INode): number;
}

/**
 * Edge connecting two nodes
 */
export interface IEdge {
  /** First node */
  nodeA: INode;
  /** Second node */
  nodeB: INode;
  /** Distance between nodes */
  distance: number;
  /** Edge opacity (0-1) */
  opacity: number;

  /**
   * Update edge properties
   */
  update(): void;
}

/**
 * Network statistics
 */
export interface NetworkStats {
  /** Number of active nodes */
  nodeCount: number;
  /** Number of active edges */
  edgeCount: number;
  /** Average node velocity */
  avgVelocity?: number;
  /** Network density (edges per node) */
  density?: number;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  /** Number of nodes to create */
  nodeCount: number;
  /** Maximum connection distance */
  connectionThreshold: number;
  /** Node movement speed multiplier */
  speedMultiplier: number;
  /** Enable edge optimization (spatial partitioning) */
  optimizeEdges: boolean;
}

/**
 * Canvas bounds
 */
export interface CanvasBounds {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}
