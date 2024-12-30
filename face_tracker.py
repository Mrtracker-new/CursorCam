import cv2
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class FaceTracker:
    def __init__(self):
        logger.debug("Initializing FaceTracker")
        self.is_tracking = False
        self.sensitivity = 1.0
        self.cap = None
        self.calibrated = False
        try:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            if self.face_cascade.empty():
                raise Exception("Failed to load face cascade classifier")
            logger.info("FaceTracker initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing FaceTracker: {str(e)}")
            raise

    def start_tracking(self):
        """Start the video capture and tracking"""
        logger.debug("Attempting to start tracking")
        try:
            if not self.is_tracking:
                self.cap = cv2.VideoCapture(0)
                if not self.cap.isOpened():
                    raise Exception("Could not open video capture")
                self.is_tracking = True
                logger.info("Tracking started successfully")
        except Exception as e:
            logger.error(f"Error starting tracking: {str(e)}")
            self.is_tracking = False
            if self.cap is not None:
                self.cap.release()
                self.cap = None
            raise

    def stop_tracking(self):
        """Stop the video capture and tracking"""
        logger.debug("Attempting to stop tracking")
        try:
            self.is_tracking = False
            if self.cap is not None:
                self.cap.release()
                self.cap = None
            logger.info("Tracking stopped successfully")
        except Exception as e:
            logger.error(f"Error stopping tracking: {str(e)}")
            raise

    def reset_calibration(self):
        logger.debug("Resetting calibration")
        try:
            self.calibrated = False
            logger.info("Calibration reset successfully")
        except Exception as e:
            logger.error(f"Error resetting calibration: {str(e)}")
            raise

    def get_processed_frame(self):
        """Get and process the current frame"""
        if not self.is_tracking or self.cap is None:
            return None

        try:
            ret, frame = self.cap.read()
            if not ret:
                logger.warning("Failed to read frame")
                return None

            # Convert frame to JSON-serializable format
            processed_frame = cv2.imencode('.jpg', frame)[1].tobytes()
            return processed_frame

        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return None

    def calibrate(self):
        """Calibrate the face tracking"""
        logger.debug("Attempting calibration")
        try:
            if not self.is_tracking:
                raise Exception("Cannot calibrate: tracking is not active")
            
            # Basic calibration implementation
            success = False
            for _ in range(10):
                ret, frame = self.cap.read()
                if ret:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = self.face_cascade.detectMultiScale(gray)
                    if len(faces) > 0:
                        success = True
                        break
            
            if not success:
                raise Exception("Could not detect face during calibration")
            
            self.calibrated = True
            logger.info("Calibration completed successfully")
        except Exception as e:
            logger.error(f"Calibration error: {str(e)}")
            raise

    def set_sensitivity(self, value):
        """Set the tracking sensitivity"""
        logger.debug(f"Setting sensitivity to {value}")
        try:
            self.sensitivity = max(0.1, min(2.0, float(value)))
            logger.info(f"Sensitivity set to {self.sensitivity}")
        except Exception as e:
            logger.error(f"Error setting sensitivity: {str(e)}")
            raise

    def __del__(self):
        """Cleanup when the object is destroyed"""
        logger.debug("FaceTracker cleanup initiated")
        try:
            self.stop_tracking()
            logger.info("FaceTracker cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")

# Verify the class is properly defined
if __name__ == "__main__":
    try:
        tracker = FaceTracker()
        logger.info("FaceTracker test initialization successful")
        tracker.start_tracking()
        logger.info("FaceTracker test start_tracking successful")
        tracker.stop_tracking()
        logger.info("FaceTracker test stop_tracking successful")
    except Exception as e:
        logger.error(f"FaceTracker test failed: {str(e)}") 