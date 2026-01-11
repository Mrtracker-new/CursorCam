/**
 * ThreeJsHelper.js
 * Utility class for common Three.js initialization and cleanup
 * Eliminates code duplication across Three.js-based patterns
 */

import * as THREE from 'three';

/**
 * Helper class for Three.js patterns
 * Provides reusable methods for canvas setup, scene/renderer/camera initialization, and cleanup
 */
export class ThreeJsHelper {
    /**
     * Create and initialize a Three.js canvas
     * @param {HTMLElement} mainCanvas - The main 2D canvas to replace
     * @returns {Object} { threeCanvas, mainCanvas }
     */
    static createCanvas(mainCanvas) {
        if (!mainCanvas) {
            throw new Error('Canvas not found!');
        }

        const threeCanvas = document.createElement('canvas');
        threeCanvas.id = 'three-canvas';
        threeCanvas.style.position = 'absolute';
        threeCanvas.style.top = '0';
        threeCanvas.style.left = '0';
        threeCanvas.style.width = '100%';
        threeCanvas.style.height = '100%';
        threeCanvas.style.zIndex = '1';
        threeCanvas.width = mainCanvas.width;
        threeCanvas.height = mainCanvas.height;

        mainCanvas.parentElement.appendChild(threeCanvas);
        mainCanvas.style.display = 'none';

        return { threeCanvas, mainCanvas };
    }

    /**
     * Create a Three.js scene with standard settings
     * @param {Object} options - { backgroundColor, fogColor, fogDensity }
     * @returns {THREE.Scene}
     */
    static createScene(options = {}) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(options.backgroundColor || 0x000000);

        if (options.fogColor !== undefined) {
            scene.fog = new THREE.FogExp2(options.fogColor, options.fogDensity || 0.015);
        }

        return scene;
    }

    /**
     * Create a WebGL renderer with standard settings
     * @param {HTMLCanvasElement} canvas
     * @param {Object} options - { pixelRatio, toneMapping, toneMappingExposure, antialias, alpha }
     * @returns {THREE.WebGLRenderer}
     */
    static createRenderer(canvas, options = {}) {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: options.antialias !== false,
            alpha: options.alpha || false,
        });

        renderer.setSize(canvas.width, canvas.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.pixelRatio || 2.0));

        renderer.toneMapping = options.toneMapping || THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = options.toneMappingExposure || 1.2;

        return renderer;
    }

    /**
     * Create a perspective camera with standard settings
     * @param {HTMLCanvasElement} canvas
     * @param {Object} options - { fov, near, far, position, lookAt }
     * @returns {THREE.PerspectiveCamera}
     */
    static createCamera(canvas, options = {}) {
        const aspect = canvas.width / canvas.height;
        const camera = new THREE.PerspectiveCamera(
            options.fov || 75,
            aspect,
            options.near || 0.1,
            options.far || 1000
        );

        const pos = options.position || { x: 0, y: 0, z: 0 };
        camera.position.set(pos.x, pos.y, pos.z);

        const lookAt = options.lookAt || { x: 0, y: 0, z: -10 };
        camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

        return camera;
    }

    /**
     * Cleanup Three.js resources on deactivation
     * @param {Object} resources - { threeCanvas, mainCanvas, scene, renderer, composer }
     */
    static cleanup(resources) {
        const { threeCanvas, mainCanvas, scene, renderer, composer } = resources;

        // Remove Three.js canvas
        if (threeCanvas && threeCanvas.parentElement) {
            threeCanvas.parentElement.removeChild(threeCanvas);
        }

        // Restore main canvas
        if (mainCanvas) {
            mainCanvas.style.display = 'block';
        }

        // Dispose scene resources
        if (scene) {
            scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((material) => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            scene.clear();
        }

        // Dispose renderer and composer
        if (composer) {
            composer.dispose();
        }
        if (renderer) {
            renderer.dispose();
        }
    }
}
