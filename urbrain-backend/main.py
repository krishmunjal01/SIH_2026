import asyncio
from datetime import datetime
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List, Optional

from engine.correlation import CorrelationEngine

app = FastAPI(title="URBRAIN Ingestion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Correlation Engine instance
correlation_engine = CorrelationEngine()

# Connected detection WebSocket clients (browsers watching the camera panel)
detection_clients: list = []

# --- Pydantic Models for Ingestion ---
class TelemetryData(BaseModel):
    busId: str
    latitude: float
    longitude: float
    speed: float
    heading: float
    route: str
    edgeStatus: str = "ONLINE"
    cameras: int = 4

class EventDetection(BaseModel):
    busId: str
    type: str # "POTHOLE", "HIT_AND_RUN", "CONGESTION"
    latitude: float
    longitude: float
    confidence: int
    severity: str # "LOW", "MEDIUM", "HIGH"

# --- API Endpoints ---

@app.post("/api/telemetry")
async def post_telemetry(data: TelemetryData):
    # This endpoint is hit at 1Hz by the Edge AI on the bus
    correlation_engine.update_bus_telemetry(data.dict())
    return {"status": "success"}

@app.post("/api/events")
async def post_event(data: EventDetection):
    # This endpoint is hit when YOLO detects a pothole/hazard
    event_dict = data.dict()
    event_dict['timestamp'] = datetime.now().isoformat()
    correlation_engine.process_new_event(event_dict)
    return {"status": "success", "message": "Event processed and correlated"}


# --- WebSocket for LIVE bounding-box detections (from friend's YOLO model) ---

class DetectionPayload(BaseModel):
    busId: str
    detections: list  # [{label, confidence, x, y, w, h}]

@app.post("/api/detections")
async def post_detections(data: DetectionPayload):
    """Your friend's Edge AI script POSTs bounding boxes here at ~10Hz.
    We instantly broadcast them to all connected React frontends."""
    payload = {"detections": data.detections, "busId": data.busId}
    dead = []
    for ws in detection_clients:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        detection_clients.remove(ws)
    return {"status": "ok", "broadcasted_to": len(detection_clients)}

@app.websocket("/ws/detections")
async def detections_ws(websocket: WebSocket):
    """React frontend connects here to receive live YOLO bounding boxes."""
    await websocket.accept()
    detection_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except Exception:
        if websocket in detection_clients:
            detection_clients.remove(websocket)

# --- WebSocket Bridge for React Frontend ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Stream the global state to the dashboard at 1Hz
            data = {
                "buses": list(correlation_engine.get_all_buses().values()),
                "events": correlation_engine.get_active_events(),
                "segments": correlation_engine.get_road_segments()
            }
            await websocket.send_json(data)
            await asyncio.sleep(1.0)
    except Exception as e:
        print(f"WebSocket closed: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
