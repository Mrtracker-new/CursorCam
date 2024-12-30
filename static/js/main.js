document.addEventListener('DOMContentLoaded', function() {
    // Initialize socket and state
    const socket = io();
    const state = {
        isTracking: false
    };

    // DOM elements
    const elements = {
        toggleButton: document.getElementById('toggleTracking'),
        calibrateButton: document.getElementById('calibrate'),
        sensitivitySlider: document.getElementById('sensitivity-slider'),
        sensitivityDisplay: document.getElementById('sensitivity-display')
    };

    // Socket event handlers
    const socketEvents = {
        connect: () => {
            console.log('Connected to server');
        },

        disconnect: () => {
            console.log('Disconnected from server');
            updateTrackingState(false);
        },

        tracking_status: (data) => {
            updateTrackingState(data.status === 'tracking');
        },

        calibration_status: (data) => {
            if (data.status === 'complete') {
                showNotification('Calibration complete!');
            }
        },

        error: (error) => {
            console.error('Socket error:', error);
            showNotification('An error occurred. Please refresh the page.', 'error');
        }
    };

    // Helper functions
    function updateTrackingState(tracking) {
        state.isTracking = tracking;
        elements.toggleButton.textContent = tracking ? 'Stop Tracking' : 'Start Tracking';
        elements.toggleButton.classList.toggle('active', tracking);
    }

    function showNotification(message, type = 'info') {
        if (type === 'error') {
            console.error(message);
        }
        alert(message); // Consider replacing with a better notification system
    }

    // Event listeners
    elements.toggleButton.addEventListener('click', async () => {
        try {
            const response = await new Promise(resolve => 
                socket.emit('toggle_tracking', {}, resolve)
            );
            
            switch (response.status) {
                case 'tracking':
                case 'stopped':
                    updateTrackingState(response.status === 'tracking');
                    break;
                case 'error':
                    throw new Error(response.message);
                default:
                    throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            console.error('Toggle error:', error);
            showNotification(error.message, 'error');
        }
    });

    elements.calibrateButton.addEventListener('click', () => {
        if (!state.isTracking) {
            showNotification('Please start tracking first before calibrating.');
            return;
        }

        socket.emit('calibrate');
        elements.calibrateButton.classList.add('active');
        setTimeout(() => elements.calibrateButton.classList.remove('active'), 1000);
    });

    elements.sensitivitySlider.addEventListener('input', function() {
        const value = this.value;
        elements.sensitivityDisplay.textContent = value;
        socket.emit('update_settings', { sensitivity: parseFloat(value) });
    });

    // Register socket event handlers
    Object.entries(socketEvents).forEach(([event, handler]) => {
        socket.on(event, handler);
    });
});
