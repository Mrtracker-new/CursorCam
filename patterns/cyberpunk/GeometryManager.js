/**
 * GeometryManager.js
 * Manages all geometric elements in the cyberpunk scene
 */

import * as THREE from 'three';

export class GeometryManager {
    constructor(scene, colorManager) {
        this.scene = scene;
        this.colorManager = colorManager;

        // Geometry elements
        this.tunnel = null;
        this.tunnel2 = null;
        this.hexagons = [];
        this.diamonds = [];
        this.panels = [];
        this.shockwaveRings = [];

        // Animation state
        this.rotation = 0;
        this.tunnelOffset = 0;

        // Configuration
        this.config = {
            tunnel: {
                radius: 8,
                length: 100,
                segments: 6, // Hexagonal
                speed: 0.1
            },
            hexagons: {
                count: 5,
                spacing: 3,
                baseSize: 2.0
            },
            shockwave: {
                maxRadius: 15,
                speed: 0.5,
                duration: 60 // frames
            }
        };
    }

    /**
     * Create all geometry
     */
    create() {
        this.createHexTunnel();
        this.createRotatingHexagons();
    }

    /**
     * Create hexagonal tunnel
     */
    createHexTunnel() {
        const geometry = new THREE.CylinderGeometry(
            this.config.tunnel.radius,
            this.config.tunnel.radius,
            this.config.tunnel.length,
            this.config.tunnel.segments,
            1,
            true
        );

        geometry.rotateX(Math.PI / 2);

        // Wireframe material
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: this.colorManager.palette.electricCyan,
            linewidth: 2
        });

        this.tunnel = new THREE.LineSegments(edges, material);
        this.tunnel.position.z = -this.config.tunnel.length / 2;
        this.scene.add(this.tunnel);

        // Create duplicate for seamless looping
        this.tunnel2 = this.tunnel.clone();
        this.tunnel2.position.z = this.tunnel.position.z - this.config.tunnel.length;
        this.scene.add(this.tunnel2);
    }

    /**
     * Create rotating hexagons at various depths
     */
    createRotatingHexagons() {
        for (let i = 0; i < this.config.hexagons.count; i++) {
            const size = this.config.hexagons.baseSize - (i * 0.3);
            const hexShape = this.createHexagonShape(size);

            const material = new THREE.LineBasicMaterial({
                color: i % 2 === 0 ?
                    this.colorManager.palette.electricCyan :
                    this.colorManager.palette.neonPink,
                linewidth: 3
            });

            const hexagon = new THREE.LineLoop(hexShape, material);
            hexagon.position.z = -10 - (i * this.config.hexagons.spacing);
            hexagon.userData = {
                baseSize: size,
                index: i,
                rotationSpeed: 0.01 + (i * 0.005)
            };

            this.hexagons.push(hexagon);
            this.scene.add(hexagon);
        }
    }

    /**
     * Create hexagon shape geometry
     */
    createHexagonShape(radius) {
        const points = [];
        const sides = 6;

        for (let i = 0; i <= sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(new THREE.Vector3(x, y, 0));
        }

        return new THREE.BufferGeometry().setFromPoints(points);
    }

    /**
     * Create shockwave ring (spawned on bass hits)
     */
    createShockwave(origin, color, intensity) {
        const geometry = this.createHexagonShape(0.5);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0,
            linewidth: 3
        });

        const ring = new THREE.LineLoop(geometry, material);
        ring.position.copy(origin);
        ring.userData = {
            age: 0,
            maxAge: this.config.shockwave.duration,
            speed: this.config.shockwave.speed * intensity,
            initialOpacity: 1.0
        };

        this.shockwaveRings.push(ring);
        this.scene.add(ring);
    }

    /**
     * Update geometry based on audio
     */
    update(audioData, stateVisuals) {
        this.updateTunnel(audioData, stateVisuals);
        this.updateHexagons(audioData, stateVisuals);
        this.updateShockwaves();
    }

    /**
     * Update tunnel movement and bass pulse
     */
    updateTunnel(audioData, stateVisuals) {
        const speed = this.config.tunnel.speed * stateVisuals.tunnelSpeed;

        // Move tunnel forward
        this.tunnel.position.z += speed;
        this.tunnel2.position.z += speed;

        // Loop tunnel segments
        if (this.tunnel.position.z > this.config.tunnel.length / 2) {
            this.tunnel.position.z -= this.config.tunnel.length * 2;
        }
        if (this.tunnel2.position.z > this.config.tunnel.length / 2) {
            this.tunnel2.position.z -= this.config.tunnel.length * 2;
        }

        // Bass pulse effect (instant scale, no easing)
        const bassScale = 1.0 + (audioData.bass * 0.3 * stateVisuals.geometryScale);
        this.tunnel.scale.set(bassScale, bassScale, 1);
        this.tunnel2.scale.set(bassScale, bassScale, 1);

        // Update tunnel color based on dominant frequency
        const dominantColor = this.colorManager.getDominantColor(audioData);
        this.tunnel.material.color.setHex(dominantColor);
        this.tunnel2.material.color.setHex(dominantColor);
    }

    /**
     * Update rotating hexagons
     */
    updateHexagons(audioData, stateVisuals) {
        for (const hexagon of this.hexagons) {
            // Stepped rotation (not smooth)
            const rotationStep = hexagon.userData.rotationSpeed * stateVisuals.rotationSpeed;
            hexagon.rotation.z += rotationStep;

            // Bass-driven scale (instant)
            const bassScale = 1.0 + (audioData.bass * 0.5 * stateVisuals.geometryScale);
            const scale = hexagon.userData.baseSize * bassScale;
            hexagon.scale.set(scale, scale, 1);

            // Mid-driven Z oscillation
            const zOffset = Math.sin(Date.now() * 0.001 + hexagon.userData.index) * audioData.mids * 2;
            hexagon.position.z = -10 - (hexagon.userData.index * this.config.hexagons.spacing) + zOffset;
        }
    }

    /**
     * Update shockwave rings
     */
    updateShockwaves() {
        for (let i = this.shockwaveRings.length - 1; i >= 0; i--) {
            const ring = this.shockwaveRings[i];
            ring.userData.age++;

            // Expand ring
            const progress = ring.userData.age / ring.userData.maxAge;
            const radius = 0.5 + (progress * this.config.shockwave.maxRadius);
            ring.scale.set(radius, radius, 1);

            // Fade out
            ring.material.opacity = ring.userData.initialOpacity * (1 - progress);

            // Remove if expired
            if (ring.userData.age >= ring.userData.maxAge) {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
                this.shockwaveRings.splice(i, 1);
            }
        }
    }

    /**
     * Handle beat event
     */
    onBeat(beatStrength, audioData) {
        if (beatStrength >= 2) { // Medium or strong beat
            const color = this.colorManager.getDominantColor(audioData);
            this.createShockwave(new THREE.Vector3(0, 0, -10), color, beatStrength / 3);
        }
    }

    /**
     * Handle beat drop
     */
    onBeatDrop(intensity) {
        // Create multiple shockwaves
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createShockwave(
                    new THREE.Vector3(0, 0, -10 - i * 2),
                    this.colorManager.palette.neonPink,
                    intensity
                );
            }, i * 100);
        }

        // Tunnel "collapse" effect (instant scale change)
        this.tunnel.scale.set(0.5, 0.5, 1);
        this.tunnel2.scale.set(0.5, 0.5, 1);
    }

    /**
     * Cleanup
     */
    dispose() {
        // Dispose tunnel
        if (this.tunnel) {
            this.tunnel.geometry.dispose();
            this.tunnel.material.dispose();
        }
        if (this.tunnel2) {
            this.tunnel2.geometry.dispose();
            this.tunnel2.material.dispose();
        }

        // Dispose hexagons
        for (const hex of this.hexagons) {
            hex.geometry.dispose();
            hex.material.dispose();
            this.scene.remove(hex);
        }

        // Dispose shockwaves
        for (const ring of this.shockwaveRings) {
            ring.geometry.dispose();
            ring.material.dispose();
            this.scene.remove(ring);
        }

        this.hexagons = [];
        this.shockwaveRings = [];
    }
}
