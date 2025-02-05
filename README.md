# 🖱️CursorCam 🎥

**CursorCam** is a Flask-based web application that transforms your laptop's camera into a mouse controller using facial recognition. By tracking facial movements, the application mimics mouse movements, allowing you to control your device hands-free. The system incorporates advanced calibration and user profiles for customization and accuracy.

---

## 🚀Features

- **🎯 Facial Recognition Mouse Control**: Uses your camera to track face movements and control the mouse pointer.
- **🎨Calibration System**: Provides an easy calibration process to improve tracking accuracy and user comfort.
- **🔒User Profiles**: Save and load user preferences, including sensitivity, smoothing, and screen region bounds.
- **🖥️ Region Locking**: Option to restrict mouse movements within a specified region on the screen.
- **🕹️Real-time Face Tracking**: Tracks facial landmarks to update the mouse position smoothly.
- **🛠️ Responsive Interface**: Built with Flask and Flask-SocketIO for a real-time user experience.

---

## 🛠️Installation

### Requirements

- `Python 3.x`
- `pip`
- `OpenCV`
- `dlib`
- `pyautogui`
- `Flask`
- `Flask-SocketIO`

### Step-by-Step Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Mrtracker-new/CursorCam.git
   cd CursorCam
### Install dependencies:

    pip install -r requirements.txt

### Download the shape predictor model:

Download the **shape_predictor_68_face_landmarks.dat** from dlib's model repository and place it in the root directory of the project.

### Run the Flask app:

    python app.py

Open a web browser and go to http://127.0.0.1:5000/ to start using CursorCam.

## 📸Usage

### 🛡️ Calibration:

To begin using the face tracking system, you need to calibrate by sitting still in front of the camera for a few moments. Calibration ensures that the system tracks your face with precision.
Once calibrated, the system will track your face and move the mouse cursor based on your facial movements.

**Tracking**:

Toggle tracking on or off using the interface. When tracking is on, your face movements control the mouse pointer.
The system allows smooth control with adjustable sensitivity and smoothing settings for comfort.

**User Profiles**:

Save your settings as a profile for future use. This allows you to store your calibration data, sensitivity, and other preferences.
Load and switch between profiles based on different users or preferences.

**Region Locking**:

Enable region locking to limit mouse movement to a specific area of your screen. This is useful for users who prefer a restricted movement area.

## Configuration

### You can customize various settings in the Config class:

- **CAMERA_WIDTH and CAMERA_HEIGHT**: Set the resolution of the camera feed.
- **FPS**: Frame rate for the camera.
- **MOUSE_SMOOTHING**: The smoothing factor applied to mouse movement.
- **MOUSE_SPEED**: Adjust the sensitivity of the mouse movement based on face displacement.
- **SCREEN_PADDING**: Padding around the edges of the screen where the cursor can't go.
- **CALIBRATION_FRAMES and CALIBRATION_THRESHOLD**: Control the calibration process.
- **REGION_BOUNDS**: Define the region of the screen where the mouse can move.
- **DEBUG_MODE**: Enable detailed logging for debugging.

## Troubleshooting
- **Camera not opening**: Ensure that no other application is using the camera. Restart the application if necessary.

- **Calibration issues**: If calibration fails, ensure you're staying still and not moving too much. The system requires a steady face for accurate calibration.

- **Performance issues**: Lower the camera resolution or frame rate if the application lags on slower systems.

## 📜License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝Contributing
Feel free to fork the repository, submit issues, and open pull requests for improvements. Whether it's bug fixes, new features, or better documentation, your contributions are welcome!

## 🎉Acknowledgements
- ### **dlib**: For face detection and facial landmark prediction.
- ### **pyautogui**: For simulating mouse movements.
- ### **OpenCV**: For image processing and capturing camera frames.

## 📧Contact
For inquiries, reach out to me at: rolanlobo901@gmail.com
Happy tracking! 👀💻

# ✨ CursorCam - Making computers more accessible, one face at a time! ✨
