/**
 * CameraShakeSystem.js
 * Camera shake effect for bass response
 */

export class CameraShakeSystem {
    constructor(camera) {
        this.camera = camera;

        // Original camera state
        this.originalPosition = camera.position.clone();
        this.originalRotation = camera.rotation.clone();

        // Shake state
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        this.bassThreshold = 0.7;
        this.subBassThreshold = 0.8;

        // User settings
        this.enabled = true;
        this.userIntensityMultiplier = 1.0;
    }

    /**
     * Update camera shake based on audio
     */
    update(audioData) {
        if (!this.enabled || this.userIntensityMultiplier === 0) {
            return;
        }

        const bassValue = audioData.bass || audioData.bassEnergy || 0;
        const subBass = audioData.subBass || 0;

        // Trigger shake on heavy bass
        if (bassValue > this.bassThreshold) {
            const intensity = (bassValue - this.bassThreshold) / (1 - this.bassThreshold);
            this.shakeIntensity = Math.max(this.shakeIntensity, intensity * 0.3);
        }

        // Stronger shake on sub-bass
        if (subBass > this.subBassThreshold) {
            const intensity = (subBass - this.subBassThreshold) / (1 - this.subBassThreshold);
            this.shakeIntensity = Math.max(this.shakeIntensity, intensity * 0.5);
        }

        // Apply shake if active
        if (this.shakeIntensity > 0.01) {
            this._applyShake();
            this.shakeIntensity *= this.shakeDecay;
        } else {
            // Return to original position smoothly
            this.camera.position.lerp(this.originalPosition, 0.1);
            this.camera.rotation.x += (this.originalRotation.x - this.camera.rotation.x) * 0.1;
            this.camera.rotation.y += (this.originalRotation.y - this.camera.rotation.y) * 0.1;
            this.shakeIntensity = 0;
        }
    }

    /**
     * Apply shake offset to camera
     */
    _applyShake() {
        const strength = this.shakeIntensity * this.userIntensityMultiplier;

        // Random positional offset
        const offsetX = (Math.random() - 0.5) * strength * 0.5;
        const offsetY = (Math.random() - 0.5) * strength * 0.5;
        const offsetZ = (Math.random() - 0.5) * strength * 0.3;

        this.camera.position.x = this.originalPosition.x + offsetX;
        this.camera.position.y = this.originalPosition.y + offsetY;
        this.camera.position.z = this.originalPosition.z + offsetZ;

        // Random rotational offset (subtle)
        const rotX = (Math.random() - 0.5) * strength * 0.05;
        const rotY = (Math.random() - 0.5) * strength * 0.05;

        this.camera.rotation.x = this.originalRotation.x + rotX;
        this.camera.rotation.y = this.originalRotation.y + rotY;
    }

    /**
     * Set shake intensity multiplier (0.0 - 2.0)
     */
    setIntensity(value) {
        this.userIntensityMultiplier = Math.max(0, Math.min(2, value));
    }

    /**
     * Enable/disable shake
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // Reset to original position
            this.camera.position.copy(this.originalPosition);
            this.camera.rotation.copy(this.originalRotation);
            this.shakeIntensity = 0;
        }
    }

    /**
     * Update original position (call when camera moves intentionally)
     */
    updateOrigin() {
        if (this.shakeIntensity < 0.01) {
            this.originalPosition.copy(this.camera.position);
            this.originalRotation.copy(this.camera.rotation);
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        // Reset camera to original state
        if (this.camera) {
            this.camera.position.copy(this.originalPosition);
            this.camera.rotation.copy(this.originalRotation);
        }
    }
}
