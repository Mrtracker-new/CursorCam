import atexit
import cv2
import dlib
import numpy as np
from flask import Flask, Response, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import pyautogui
import time
from collections import deque
import logging
import json
import os
from concurrent.futures import ThreadPoolExecutor
from face_tracker import FaceTracker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('face_tracker.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Config class definition
class Config:
    # Enhanced camera settings
    CAMERA_WIDTH = 640
    CAMERA_HEIGHT = 480
    FPS = 30
    EXPOSURE = -3  # Negative value for faster response
    
    # Enhanced mouse control
    MOUSE_SMOOTHING = 0.15
    MOUSE_SPEED = 1.2
    SCREEN_PADDING = 50
    ACCELERATION_FACTOR = 1.5
    DECELERATION_FACTOR = 0.8
    
    # Enhanced calibration
    CALIBRATION_FRAMES = 15
    CALIBRATION_THRESHOLD = 0.7
    RECALIBRATION_INTERVAL = 300  # seconds
    
    # Enhanced movement
    MOVEMENT_THRESHOLD = 2.0
    MAX_MOVEMENT = 100
    SMOOTH_FACTOR = 0.3
    
    # Performance
    PROCESS_EVERY_N_FRAMES = 2
    MAX_THREADS = 4
    
    # Features
    GESTURE_RECOGNITION = True
    AUTO_EXPOSURE = True
    FACE_DETECTION_CONFIDENCE = 0.8
    
    # Debug
    DEBUG_MODE = True
    
    # Enhanced blink detection settings
    EYE_AR_THRESH = 0.23        # Eye aspect ratio threshold for blink detection
    EYE_AR_CONSEC_FRAMES = 2    # Number of consecutive frames for blink
    BLINK_COOLDOWN = 1.0        # Minimum time between blinks
    DOUBLE_BLINK_TIME = 0.5     # Maximum time between blinks for double blink
    
    # Enhanced mouth detection settings
    MOUTH_AR_THRESH = 0.5       # Mouth aspect ratio threshold
    MOUTH_AR_CONSEC_FRAMES = 3   # Number of consecutive frames for mouth open
    MOUTH_COOLDOWN = 1.0        # Minimum time between mouth actions
    
    # Enhanced click settings
    BLINK_SENSITIVITY = 0.23    # Adjustable blink threshold
    MOUTH_SENSITIVITY = 0.5     # Adjustable mouth threshold
    CLICK_COOLDOWN = 0.5        # Time between clicks
    
    # Region locking
    REGION_ENABLED = False
    REGION_BOUNDS = None        # [x1, y1, x2, y2]
    
    # User profiles
    PROFILES_PATH = "user_profiles/"
    DEFAULT_PROFILE = "default"

# UserProfile class definition
class UserProfile:
    def __init__(self, name):
        self.name = name
        self.sensitivity = 1.0
        self.smoothing = 0.15
        self.blink_threshold = Config.BLINK_SENSITIVITY
        self.mouth_threshold = Config.MOUTH_SENSITIVITY
        self.region_bounds = None
        self.calibration_data = None
    
    def save(self):
        if not os.path.exists(Config.PROFILES_PATH):
            os.makedirs(Config.PROFILES_PATH)
        
        data = {
            'sensitivity': self.sensitivity,
            'smoothing': self.smoothing,
            'blink_threshold': self.blink_threshold,
            'mouth_threshold': self.mouth_threshold,
            'region_bounds': self.region_bounds,
            'calibration_data': self.calibration_data
        }
        
        with open(f"{Config.PROFILES_PATH}{self.name}.json", 'w') as f:
            json.dump(data, f)
    
    @classmethod
    def load(cls, name):
        try:
            profile_path = f"{Config.PROFILES_PATH}{name}.json"
            if os.path.exists(profile_path):
                with open(profile_path, 'r') as f:
                    try:
                        data = json.load(f)
                        profile = cls(name)
                        profile.__dict__.update(data)
                        return profile
                    except json.JSONDecodeError:
                        logger.warning(f"Corrupted profile file for {name}, creating new profile")
                        return cls(name)
            else:
                logger.info(f"Creating new profile for {name}")
                profile = cls(name)
                profile.save()  # Save default profile
                return profile
        except Exception as e:
            logger.error(f"Error loading profile {name}: {str(e)}")
            return cls(name)  # Return default profile on error

# Add this function after the UserProfile class
def ensure_default_profile():
    """Ensure default profile exists and is valid"""
    try:
        if not os.path.exists(Config.PROFILES_PATH):
            os.makedirs(Config.PROFILES_PATH)
        
        default_profile_path = f"{Config.PROFILES_PATH}{Config.DEFAULT_PROFILE}.json"
        
        # Create default profile if it doesn't exist
        if not os.path.exists(default_profile_path):
            profile = UserProfile(Config.DEFAULT_PROFILE)
            profile.save()
            logger.info(f"Created new default profile at {default_profile_path}")
            return profile
            
        # Validate existing profile
        try:
            with open(default_profile_path, 'r') as f:
                data = json.load(f)
                # Validate required fields
                required_fields = ['sensitivity', 'smoothing', 'blink_threshold', 'mouth_threshold']
                if all(field in data for field in required_fields):
                    return UserProfile.load(Config.DEFAULT_PROFILE)
                else:
                    logger.warning("Default profile missing required fields, creating new profile")
                    profile = UserProfile(Config.DEFAULT_PROFILE)
                    profile.save()
                    return profile
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Default profile corrupted, creating new profile: {str(e)}")
            profile = UserProfile(Config.DEFAULT_PROFILE)
            profile.save()
            return profile
            
    except Exception as e:
        logger.error(f"Error ensuring default profile: {str(e)}")
        return UserProfile(Config.DEFAULT_PROFILE)

# GestureDetector class definition
class GestureDetector:
    def __init__(self):
        self.eye_ar_counter = 0
        self.mouth_ar_counter = 0
        self.last_blink_time = time.time()
        self.last_mouth_time = time.time()
        self.blink_detected = False
        self.double_blink_pending = False
        self.mouth_open = False

    def detect_blink(self, landmarks, threshold=Config.BLINK_SENSITIVITY):
        """Detect blink with custom threshold"""
        try:
            current_time = time.time()
            
            # Calculate eye aspect ratios
            left_eye_ratio = self.get_eye_aspect_ratio(landmarks, 36, 41)
            right_eye_ratio = self.get_eye_aspect_ratio(landmarks, 42, 47)
            ear = (left_eye_ratio + right_eye_ratio) / 2.0
            
            # Check if eyes are closed
            if ear < threshold:
                self.eye_ar_counter += 1
            else:
                # Check if we had enough consecutive frames for a blink
                if self.eye_ar_counter >= Config.EYE_AR_CONSEC_FRAMES:
                    # Check cooldown
                    if current_time - self.last_blink_time >= Config.BLINK_COOLDOWN:
                        self.last_blink_time = current_time
                        return True
                self.eye_ar_counter = 0
            
            return False
            
        except Exception as e:
            logger.error(f"Blink detection error: {str(e)}")
            return False

    def detect_mouth_open(self, landmarks, threshold=Config.MOUTH_SENSITIVITY):
        """Detect mouth open with custom threshold"""
        try:
            current_time = time.time()
            
            # Calculate mouth aspect ratio
            mouth_ratio = self.get_mouth_aspect_ratio(landmarks)
            
            # Check if mouth is open
            if mouth_ratio > threshold:
                self.mouth_ar_counter += 1
            else:
                # Check if we had enough consecutive frames for mouth open
                if self.mouth_ar_counter >= Config.MOUTH_AR_CONSEC_FRAMES:
                    # Check cooldown
                    if current_time - self.last_mouth_time >= Config.MOUTH_COOLDOWN:
                        self.last_mouth_time = current_time
                        return True
                self.mouth_ar_counter = 0
            
            return False
            
        except Exception as e:
            logger.error(f"Mouth detection error: {str(e)}")
            return False

    def get_eye_aspect_ratio(self, landmarks, start, end):
        """Calculate eye aspect ratio"""
        try:
            # Get eye landmarks
            eye_points = []
            for i in range(start, end + 1):
                point = landmarks.part(i)
                eye_points.append((point.x, point.y))
            
            # Calculate vertical distances
            v1 = np.linalg.norm(np.array(eye_points[1]) - np.array(eye_points[5]))
            v2 = np.linalg.norm(np.array(eye_points[2]) - np.array(eye_points[4]))
            
            # Calculate horizontal distance
            h = np.linalg.norm(np.array(eye_points[0]) - np.array(eye_points[3]))
            
            # Calculate aspect ratio
            return (v1 + v2) / (2.0 * h) if h > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Eye aspect ratio calculation error: {str(e)}")
            return 0.0

    def get_mouth_aspect_ratio(self, landmarks):
        """Calculate mouth aspect ratio"""
        try:
            # Get mouth landmarks
            mouth_points = []
            for i in range(60, 68):  # Outer mouth landmarks
                point = landmarks.part(i)
                mouth_points.append((point.x, point.y))
            
            # Calculate vertical distances
            v1 = np.linalg.norm(np.array(mouth_points[2]) - np.array(mouth_points[6]))
            v2 = np.linalg.norm(np.array(mouth_points[3]) - np.array(mouth_points[5]))
            
            # Calculate horizontal distance
            h = np.linalg.norm(np.array(mouth_points[0]) - np.array(mouth_points[4]))
            
            # Calculate aspect ratio
            return (v1 + v2) / (2.0 * h) if h > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Mouth aspect ratio calculation error: {str(e)}")
            return 0.0

# Add this class before FaceTracker
class PerformanceMonitor:
    def __init__(self):
        self.frame_times = deque(maxlen=30)
        self.fps = 0
        self.last_time = time.time()
        
    def update(self):
        """Update FPS calculation"""
        current_time = time.time()
        self.frame_times.append(current_time - self.last_time)
        self.last_time = current_time
        
        # Calculate average FPS
        if len(self.frame_times) > 0:
            self.fps = 1.0 / (sum(self.frame_times) / len(self.frame_times))
        
        return self.fps

# FaceTracker class definition
class FaceTracker:
    def __init__(self):
        self.position_history = deque(maxlen=5)
        self.velocity = np.array([0.0, 0.0])
        self.screen_w, self.screen_h = pyautogui.size()
        self.is_calibrated = False
        self.calibration_points = []
        self.reference_point = None
        self.last_update = time.time()
        self.performance = PerformanceMonitor()
        self.frame_count = 0
        self.executor = ThreadPoolExecutor(max_workers=Config.MAX_THREADS)
        self.gesture_detector = GestureDetector()
        self.is_paused = False
        self.is_tracking = True
        self.current_profile = UserProfile.load(Config.DEFAULT_PROFILE)
        self.last_click_time = time.time()
        
    def toggle_tracking(self):
        """Toggle tracking state"""
        self.is_tracking = not self.is_tracking
        if not self.is_tracking:
            self.is_calibrated = False  # Reset calibration when stopping tracking
            self.calibration_points = []
        return self.is_tracking

    def update_position(self, face_point):
        """Update position with improved smoothing and acceleration"""
        try:
            if not self.is_calibrated or not self.is_tracking:
                return None
                
            current_time = time.time()
            dt = current_time - self.last_update
            self.last_update = current_time
            
            # Calculate displacement with improved smoothing
            displacement = np.array(face_point) - self.reference_point
            
            # Apply non-linear transformation for better control
            displacement = np.sign(displacement) * np.power(np.abs(displacement), 1.5)
            
            # Update velocity with smoothing
            target_velocity = displacement * Config.MOUSE_SPEED
            self.velocity = (self.velocity * Config.SMOOTH_FACTOR + 
                           target_velocity * (1 - Config.SMOOTH_FACTOR))
            
            # Apply acceleration/deceleration
            speed = np.linalg.norm(self.velocity)
            if speed > Config.MOVEMENT_THRESHOLD:
                self.velocity *= Config.ACCELERATION_FACTOR
            else:
                self.velocity *= Config.DECELERATION_FACTOR
            
            # Get current mouse position
            current_pos = np.array(pyautogui.position())
            
            # Calculate new position
            new_pos = current_pos + self.velocity * dt
            
            # Apply bounds
            new_pos[0] = np.clip(new_pos[0], Config.SCREEN_PADDING, 
                                self.screen_w - Config.SCREEN_PADDING)
            new_pos[1] = np.clip(new_pos[1], Config.SCREEN_PADDING, 
                                self.screen_h - Config.SCREEN_PADDING)
            
            return new_pos.astype(int)
            
        except Exception as e:
            logger.error(f"Position update error: {str(e)}")
            return None

    def calibrate(self, face_point):
        """Enhanced calibration with stability check"""
        try:
            if len(self.calibration_points) < Config.CALIBRATION_FRAMES:
                self.calibration_points.append(face_point)
                return False
                
            points = np.array(self.calibration_points)
            
            # Calculate mean and standard deviation
            mean = np.mean(points, axis=0)
            std = np.std(points, axis=0)
            
            # Filter out points that are too far from mean
            good_points = points[np.all(np.abs(points - mean) < 2 * std, axis=1)]
            
            if len(good_points) >= Config.CALIBRATION_FRAMES * Config.CALIBRATION_THRESHOLD:
                self.reference_point = np.mean(good_points, axis=0)
                self.is_calibrated = True
                self.velocity = np.array([0.0, 0.0])
                
                logger.info("Calibration successful")
                return True
            
            self.calibration_points = []
            logger.warning("Calibration failed - too much movement")
            return False
            
        except Exception as e:
            logger.error(f"Calibration error: {str(e)}")
            return False

    def toggle_pause(self):
        self.is_paused = not self.is_paused
        return self.is_paused
    
    def set_profile(self, profile_name):
        self.current_profile = UserProfile.load(profile_name)
        self.reset_calibration()
    
    def update_settings(self, settings):
        if 'sensitivity' in settings:
            self.current_profile.sensitivity = float(settings['sensitivity'])
        if 'smoothing' in settings:
            self.current_profile.smoothing = float(settings['smoothing'])
        if 'blink_threshold' in settings:
            self.current_profile.blink_threshold = float(settings['blink_threshold'])
        if 'mouth_threshold' in settings:
            self.current_profile.mouth_threshold = float(settings['mouth_threshold'])
        if 'region_bounds' in settings:
            self.current_profile.region_bounds = settings['region_bounds']
        
        self.current_profile.save()
    
    def handle_click(self, click_type):
        current_time = time.time()
        if current_time - self.last_click_time >= Config.CLICK_COOLDOWN:
            self.last_click_time = current_time
            if click_type == 'right':
                pyautogui.click(button='right')
            else:
                pyautogui.click()

# Initialize Flask and global objects
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
cap = None

# Create global face tracker instance
face_tracker = FaceTracker()

# Initialize detector and predictor
detector = dlib.get_frontal_face_detector()
try:
    predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
except RuntimeError as e:
    logger.error(f"Error loading facial landmarks model: {str(e)}")
    raise

def initialize_camera():
    """Initialize camera with enhanced settings"""
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise RuntimeError("Could not open camera")
        
        # Enhanced camera settings
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, Config.CAMERA_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.CAMERA_HEIGHT)
        cap.set(cv2.CAP_PROP_FPS, Config.FPS)
        
        if Config.AUTO_EXPOSURE:
            cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)
        else:
            cap.set(cv2.CAP_PROP_EXPOSURE, Config.EXPOSURE)
        
        return cap
    except Exception as e:
        logger.error(f"Camera initialization error: {str(e)}")
        raise

def init_camera():
    """Initialize camera on startup"""
    global cap
    if cap is None or not cap.isOpened():
        cap = initialize_camera()

@atexit.register
def cleanup():
    """Release camera on shutdown"""
    global cap
    if cap is not None:
        cap.release()
        cap = None

def process_frame(frame, face_tracker):
    """Process frame with enhanced gesture detection"""
    try:
        if not face_tracker.is_tracking:
            cv2.putText(frame, "TRACKING STOPPED", (10, 30),
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            return True
            
        if face_tracker.is_paused:
            cv2.putText(frame, "PAUSED", (10, 30),
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            return True
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = detector(gray, 0)
        
        if faces:
            face = faces[0]
            landmarks = predictor(gray, face)
            nose_point = (landmarks.part(30).x, landmarks.part(30).y)
            
            # Handle calibration
            if not face_tracker.is_calibrated:
                if face_tracker.calibrate(nose_point):
                    cv2.putText(frame, "Calibration Complete!", (10, 30),
                              cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    face_tracker.current_profile.calibration_data = face_tracker.reference_point
                    face_tracker.current_profile.save()
                else:
                    progress = len(face_tracker.calibration_points) / Config.CALIBRATION_FRAMES * 100
                    cv2.putText(frame, f"Calibrating... {progress:.0f}%", (10, 30),
                              cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            else:
                # Handle mouse movement with region locking
                new_pos = face_tracker.update_position(nose_point)
                if new_pos is not None and not face_tracker.is_paused:
                    if face_tracker.current_profile.region_bounds:
                        x1, y1, x2, y2 = face_tracker.current_profile.region_bounds
                        new_pos = (
                            np.clip(new_pos[0], x1, x2),
                            np.clip(new_pos[1], y1, y2)
                        )
                    pyautogui.moveTo(*new_pos)
                
                # Handle gestures with custom thresholds
                if face_tracker.gesture_detector.detect_blink(
                    landmarks, face_tracker.current_profile.blink_threshold):
                    face_tracker.handle_click('right')
                    cv2.putText(frame, "Right Click!", (10, 60),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                if face_tracker.gesture_detector.detect_mouth_open(
                    landmarks, face_tracker.current_profile.mouth_threshold):
                    face_tracker.handle_click('left')
                    cv2.putText(frame, "Left Click!", (10, 90),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Draw debug info
            if Config.DEBUG_MODE:
                draw_debug_info(frame, landmarks, nose_point, face_tracker)
            
            return True
        else:
            cv2.putText(frame, "No face detected", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            return False
            
    except Exception as e:
        logger.error(f"Frame processing error: {str(e)}")
        return False

def draw_debug_info(frame, landmarks, nose_point, face_tracker):
    """Draw debug visualization"""
    # Draw facial landmarks
    for n in range(68):
        x = landmarks.part(n).x
        y = landmarks.part(n).y
        cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)
    
    # Draw nose point
    cv2.circle(frame, nose_point, 3, (0, 0, 255), -1)
    
    # Draw reference point if calibrated
    if face_tracker.reference_point is not None:
        ref_point = tuple(map(int, face_tracker.reference_point))
        cv2.circle(frame, ref_point, 3, (255, 0, 0), -1)
        cv2.line(frame, nose_point, ref_point, (0, 255, 0), 1)
    
    # Draw FPS
    fps = face_tracker.performance.fps
    cv2.putText(frame, f"FPS: {fps:.1f}", (10, frame.shape[0] - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    # Draw eye and mouth ratios
    left_eye_ratio = face_tracker.gesture_detector.get_eye_aspect_ratio(landmarks, 36, 41)
    right_eye_ratio = face_tracker.gesture_detector.get_eye_aspect_ratio(landmarks, 42, 47)
    mouth_ratio = face_tracker.gesture_detector.get_mouth_aspect_ratio(landmarks)
    
    cv2.putText(frame, f"Eye Ratio: {(left_eye_ratio + right_eye_ratio) / 2:.2f}", 
                (10, frame.shape[0] - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"Mouth Ratio: {mouth_ratio:.2f}", 
                (10, frame.shape[0] - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

def generate_frames():
    """Generate video frames with enhanced processing"""
    global face_tracker  # Use the global face_tracker instance
    
    while True:
        try:
            ret, frame = cap.read()
            if not ret:
                continue
            
            # Mirror frame
            frame = cv2.flip(frame, 1)
            
            # Process every N frames for performance
            face_tracker.frame_count += 1
            if face_tracker.frame_count % Config.PROCESS_EVERY_N_FRAMES == 0:
                process_frame(frame, face_tracker)
            
            # Update performance metrics
            face_tracker.performance.update()
            
            # Convert frame to jpg
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                   
        except Exception as e:
            logger.error(f"Frame generation error: {str(e)}")
            continue

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@socketio.on('calibrate')
def handle_calibration():
    """Handle calibration request"""
    try:
        face_tracker.reset_calibration()  # Use existing face_tracker instance
        return {'status': 'calibrating'}
    except Exception as e:
        logger.error(f"Calibration request error: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    profiles = []
    if os.path.exists(Config.PROFILES_PATH):
        profiles = [f[:-5] for f in os.listdir(Config.PROFILES_PATH) if f.endswith('.json')]
    return jsonify(profiles)

@socketio.on('update_settings')
def handle_settings_update(data):
    try:
        face_tracker.update_settings(data)
        return {'status': 'success'}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}

@socketio.on('toggle_pause')
def handle_toggle_pause():
    try:
        is_paused = face_tracker.toggle_pause()
        return {'status': 'paused' if is_paused else 'tracking'}
    except Exception as e:
        logger.error(f"Error toggling pause: {str(e)}")
        return {'status': 'error', 'message': str(e)}

@socketio.on('set_profile')
def handle_set_profile(data):
    try:
        face_tracker.set_profile(data['name'])
        return {'status': 'success'}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}

@socketio.on('toggle_tracking')
def handle_toggle_tracking():  # Removed unused data parameter
    try:
        if face_tracker.is_tracking:
            face_tracker.stop_tracking()
            status = 'stopped'
        else:
            face_tracker.start_tracking()
            status = 'tracking'
        
        response = {'status': status}
        emit('tracking_status', response)
        return response
    except Exception as e:
        logger.error(f"Toggle tracking error: {str(e)}")
        error_response = {'status': 'error', 'message': str(e)}
        emit('error', error_response)
        return error_response

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    try:
        # Send current tracking status to newly connected client
        response = {'status': 'tracking' if face_tracker.is_tracking else 'stopped'}
        socketio.emit('tracking_status', response, room=request.sid)
        logger.info(f"Client connected, sent status: {response}")
    except Exception as e:
        logger.error(f"Error handling connection: {str(e)}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    try:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Error handling disconnection: {str(e)}")

# Add this line at the end of the file
app = socketio.run(app)
