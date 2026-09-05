"""
╔══════════════════════════════════════════════════════════════════════════════╗
║             URBRAIN — Edge AI Integration Template                           ║
║             For: Your YOLO / Road Detection Model                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

HOW TO USE
----------
1.  Install dependencies:
        pip install requests opencv-python

2.  Fill in the two stubs in this file:
        ① get_gps_data()    → return lat/lon/speed/heading from your GPS module
        ② run_your_model()  → run your YOLO inference, return list of Detection dicts

3.  Set the constants below (BUS_ID, ROUTE, URBRAIN_URL).

4.  Run on the bus's edge device (Raspberry Pi / Jetson Nano / laptop):
        python edge_ai_integration_template.py

That's it — the URBRAIN dashboard will immediately show live bounding boxes and events.

API ENDPOINTS THIS SCRIPT USES
-------------------------------
  POST /api/telemetry    → 1 Hz GPS heartbeat   (position, speed, heading)
  POST /api/events       → fired when a hazard is detected at high confidence
  POST /api/detections   → 10 Hz bounding-box stream (live camera overlay on dashboard)

DETECTION DICT FORMAT (returned by run_your_model)
---------------------------------------------------
  {
    "label":      str,    # "Pothole", "Crack", "Vehicle", "Pedestrian", etc.
    "confidence": int,    # 0-100 (integer percent)
    "x":          float,  # bounding-box LEFT edge  as % of frame width  (0-100)
    "y":          float,  # bounding-box TOP  edge  as % of frame height (0-100)
    "w":          float,  # bounding-box WIDTH      as % of frame width  (0-100)
    "h":          float,  # bounding-box HEIGHT     as % of frame height (0-100)
    "color":      str,    # hex color string e.g. "#ef4444" (red for potholes)
  }
"""

import time
import threading
import requests
from datetime import datetime
from typing import List, Optional

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION — change these per bus
# ─────────────────────────────────────────────────────────────────────────────

BUS_ID       = "BUS-007"                # Unique ID for this physical bus
ROUTE        = "Route 42"              # Route this bus is operating on
URBRAIN_URL  = "http://localhost:8000" # URBRAIN FastAPI backend address
CAMERAS      = 5                       # Number of cameras on this bus

# Confidence threshold above which a detection becomes a /api/events POST
EVENT_POST_THRESHOLD = 75

# Map YOLO class names → URBRAIN severity levels
HAZARD_SEVERITY_MAP = {
    "Pothole":    "HIGH",
    "Crack":      "MEDIUM",
    "Debris":     "MEDIUM",
    "HitAndRun":  "HIGH",
    "Vehicle":    "LOW",
    "Pedestrian": "LOW",
}


# ─────────────────────────────────────────────────────────────────────────────
# ① GPS PROVIDER  —  plug in your GPS module here
# ─────────────────────────────────────────────────────────────────────────────

def get_gps_data() -> dict:
    """
    Return the current GPS fix for this bus.

    Replace the stub below with your actual GPS library call.

    ── Example using gpsd ──────────────────────────────────────────────────────
        import gpsd
        gpsd.connect()
        p = gpsd.get_current()
        return {
            "latitude":  p.lat,
            "longitude": p.lon,
            "speed":     p.hspeed * 3.6,   # m/s → km/h
            "heading":   p.track,           # degrees 0-360
        }

    ── Example using pyserial + pynmea2 (USB GPS dongle) ──────────────────────
        import serial, pynmea2
        with serial.Serial("/dev/ttyUSB0", 9600, timeout=1) as ser:
            line = ser.readline().decode("ascii", errors="replace")
            msg  = pynmea2.parse(line)
            return {
                "latitude":  float(msg.latitude),
                "longitude": float(msg.longitude),
                "speed":     float(msg.spd_over_grnd or 0) * 1.852,  # knots → km/h
                "heading":   float(msg.true_course or 0),
            }
    ────────────────────────────────────────────────────────────────────────────
    """
    # ──── STUB: simulated circular path around Chandigarh ────────────────────
    import math
    t = time.time()
    return {
        "latitude":  30.7333 + 0.002 * math.sin(t / 60),
        "longitude": 76.7794 + 0.002 * math.cos(t / 60),
        "speed":     30 + 10 * math.sin(t / 30),
        "heading":   (t * 2) % 360,
    }
    # ─────────────────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────────────────────
# ② YOUR MODEL  —  plug in your YOLO / inference pipeline here
# ─────────────────────────────────────────────────────────────────────────────

def run_your_model(frame) -> List[dict]:
    """
    Run inference on the camera frame and return a list of Detection dicts.

    Parameters
    ----------
    frame : np.ndarray or None
        BGR image from cv2.VideoCapture (H × W × 3).
        None if no camera is available (stub mode).

    Returns
    -------
    List[dict]  — each dict has keys: label, confidence, x, y, w, h, color

    ── Example using YOLOv8 (Ultralytics) ─────────────────────────────────────

        # At the top of this file (outside the function), load model once:
        #   from ultralytics import YOLO
        #   _model = YOLO("pothole_detector.pt")

        results = _model(frame)[0]
        h, w    = frame.shape[:2]
        dets    = []
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            label  = _model.names[int(box.cls[0])]
            conf   = int(box.conf[0] * 100)
            dets.append({
                "label":      label,
                "confidence": conf,
                "x":  (x1 / w) * 100,
                "y":  (y1 / h) * 100,
                "w":  ((x2 - x1) / w) * 100,
                "h":  ((y2 - y1) / h) * 100,
                "color": "#ef4444" if label == "Pothole" else "#f59e0b",
            })
        return dets

    ── Example using OpenCV DNN (ONNX model) ──────────────────────────────────

        # Load once:  net = cv2.dnn.readNetFromONNX("model.onnx")
        # Preprocess frame, run net.forward(), then parse output blobs.
        # Convert absolute pixel coords to % of frame width/height.
    ────────────────────────────────────────────────────────────────────────────
    """
    # ──── STUB: returns random fake detections for end-to-end testing ────────
    import random
    if random.random() < 0.3:          # 30% chance of a detection per frame
        label = random.choice(["Pothole", "Crack", "Debris"])
        return [{
            "label":      label,
            "confidence": random.randint(70, 98),
            "x":          random.uniform(20, 60),
            "y":          random.uniform(40, 70),
            "w":          random.uniform(10, 20),
            "h":          random.uniform(5,  12),
            "color":      "#ef4444" if label == "Pothole" else "#f59e0b",
        }]
    return []
    # ─────────────────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────────────────────
# URBRAIN SENDER — internal helpers (no need to modify)
# ─────────────────────────────────────────────────────────────────────────────

def _post(endpoint: str, payload: dict, silent: bool = True) -> Optional[int]:
    """POST payload to the URBRAIN backend. Returns HTTP status or None on error."""
    try:
        r = requests.post(f"{URBRAIN_URL}{endpoint}", json=payload, timeout=2)
        if not silent:
            print(f"    → {endpoint}  [{r.status_code}]  {r.text[:80]}")
        return r.status_code
    except requests.exceptions.ConnectionError:
        if not silent:
            print(f"    ✗ Cannot reach {URBRAIN_URL}{endpoint} — is the backend running?")
    except Exception as e:
        if not silent:
            print(f"    ✗ Error posting to {endpoint}: {e}")
    return None


def telemetry_loop():
    """
    Background thread: sends GPS/state heartbeat to /api/telemetry at 1 Hz.
    Keeps the bus marker moving on the dashboard map.
    """
    print(f"[TELEMETRY]  Started  →  {URBRAIN_URL}/api/telemetry  @ 1 Hz")
    while True:
        gps = get_gps_data()
        _post("/api/telemetry", {
            "busId":      BUS_ID,
            "latitude":   gps["latitude"],
            "longitude":  gps["longitude"],
            "speed":      round(gps["speed"], 1),
            "heading":    round(gps["heading"], 1),
            "route":      ROUTE,
            "edgeStatus": "ONLINE",
            "cameras":    CAMERAS,
        })
        time.sleep(1.0)


def camera_inference_loop():
    """
    Main loop (runs on the calling thread):
      1. Grabs a frame from the front camera (device index 0).
      2. Runs your model to get detections.
      3. Streams bounding boxes to /api/detections at ~10 Hz.
      4. For high-confidence hazards, also fires /api/events (triggers map icon).
    """
    print(f"[INFERENCE]  Started  →  {URBRAIN_URL}/api/detections  @ 10 Hz")

    # Try to open the physical camera; fall back to stub mode if unavailable
    cap = None
    use_cv2 = False
    try:
        import cv2
        cap = cv2.VideoCapture(0)   # Change 0 to your camera device/RTSP URL
        use_cv2 = cap.isOpened()
        if use_cv2:
            print(f"[CAMERA]     Opened camera device 0")
        else:
            print("[CAMERA]     No camera found — running in stub mode")
    except ImportError:
        print("[CAMERA]     opencv-python not installed — running in stub mode")

    TARGET_FPS    = 10
    FRAME_BUDGET  = 1.0 / TARGET_FPS
    gps_snapshot  = get_gps_data()
    gps_refresh_t = time.time()
    frame_count   = 0

    while True:
        t0 = time.time()

        # Refresh GPS snapshot every 5 seconds
        if t0 - gps_refresh_t >= 5.0:
            gps_snapshot  = get_gps_data()
            gps_refresh_t = t0

        # Grab frame
        frame = None
        if use_cv2 and cap:
            ret, frame = cap.read()
            if not ret:
                time.sleep(FRAME_BUDGET)
                continue

        # Run model
        detections = run_your_model(frame)

        # ── Send bounding boxes → live overlay in the camera panel ──────────
        if detections:
            _post("/api/detections", {
                "busId":      BUS_ID,
                "detections": detections,
            })

        # ── Fire incident events for high-confidence hazards ────────────────
        for det in detections:
            is_hazard = det["label"] in HAZARD_SEVERITY_MAP
            if is_hazard and det["confidence"] >= EVENT_POST_THRESHOLD:
                event_type = det["label"].upper().replace(" ", "_")
                status = _post("/api/events", {
                    "busId":      BUS_ID,
                    "type":       event_type,
                    "latitude":   gps_snapshot["latitude"],
                    "longitude":  gps_snapshot["longitude"],
                    "confidence": det["confidence"],
                    "severity":   HAZARD_SEVERITY_MAP[det["label"]],
                }, silent=False)
                if status == 200:
                    print(f"    🚨 {det['label']} ({det['confidence']}%)  "
                          f"@ {gps_snapshot['latitude']:.5f}, {gps_snapshot['longitude']:.5f}")

        # Print a status line every 30 frames
        frame_count += 1
        if frame_count % 30 == 0:
            n   = len(detections)
            fps = 1.0 / max(time.time() - t0, 0.001)
            print(f"[{datetime.now().strftime('%H:%M:%S')}]  "
                  f"{n} det(s)  |  {fps:.1f} fps  |  "
                  f"GPS: {gps_snapshot['latitude']:.4f}, {gps_snapshot['longitude']:.4f}")

        # Throttle to TARGET_FPS
        sleep_time = FRAME_BUDGET - (time.time() - t0)
        if sleep_time > 0:
            time.sleep(sleep_time)


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print()
    print("╔" + "═" * 58 + "╗")
    print(f"║  URBRAIN Edge AI Client — {BUS_ID:<32}║")
    print(f"║  Backend : {URBRAIN_URL:<47}║")
    print(f"║  Route   : {ROUTE:<47}║")
    print("╠" + "═" * 58 + "╣")
    print("║  Fill in these two stubs before the hackathon:          ║")
    print("║    ① get_gps_data()    — connect your GPS module        ║")
    print("║    ② run_your_model()  — plug in your YOLO pipeline     ║")
    print("╚" + "═" * 58 + "╝")
    print()

    # Start GPS heartbeat in background
    t_thread = threading.Thread(target=telemetry_loop, daemon=True)
    t_thread.start()

    # Run camera inference on main thread (clean Ctrl+C exit)
    try:
        camera_inference_loop()
    except KeyboardInterrupt:
        print("\n[EXIT] Stopped by user. Goodbye!")
