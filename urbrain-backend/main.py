import asyncio
import json
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="URBRAIN Demo Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chandigarh bounding box for demo data
LAT_MIN, LAT_MAX = 30.7000, 30.7600
LON_MIN, LON_MAX = 76.7500, 76.8200

def random_lat_lon():
    return {
        "latitude": random.uniform(LAT_MIN, LAT_MAX),
        "longitude": random.uniform(LON_MIN, LON_MAX)
    }

class DemoEngine:
    def __init__(self):
        self.buses = [self.init_bus(f"BUS-{str(i).zfill(3)}") for i in range(1, 301)]
        self.events = []
        
    def init_bus(self, bus_id):
        return {
            "id": bus_id,
            "route": f"Route {random.randint(1, 50)}",
            **random_lat_lon(),
            "speed": random.randint(0, 60),
            "status": "ACTIVE",
            "edgeStatus": "ONLINE" if random.random() > 0.05 else "SYNCING",
            "cameras": 5,
            "heading": random.randint(0, 360)
        }
        
    def generate_events(self):
        if random.random() > 0.7:
            bus = random.choice(self.buses)
            event_type = random.choice(["POTHOLE", "CONGESTION", "PEDESTRIAN_RISK", "HIT_AND_RUN"])
            severity = "HIGH" if event_type == "HIT_AND_RUN" else random.choice(["LOW", "MEDIUM", "HIGH"])
            
            event = {
                "id": f"EVT-{random.randint(1000, 9999)}",
                "type": event_type,
                "latitude": bus["latitude"],
                "longitude": bus["longitude"],
                "confidence": random.randint(85, 98),
                "severity": severity,
                "busId": bus["id"],
                "timestamp": datetime.now().isoformat()
            }
            self.events.append(event)
            # Keep only recent events
            if len(self.events) > 100:
                self.events.pop(0)

    def tick(self):
        # Update bus positions
        for bus in self.buses:
            if bus["status"] == "ACTIVE":
                # Move slightly
                bus["latitude"] += random.uniform(-0.0005, 0.0005)
                bus["longitude"] += random.uniform(-0.0005, 0.0005)
                bus["speed"] = max(0, min(80, bus["speed"] + random.randint(-5, 5)))
                bus["heading"] = (bus["heading"] + random.randint(-10, 10)) % 360
        
        self.generate_events()
        
        return {
            "buses": self.buses,
            "events": self.events[-10:] # send latest 10 events
        }

engine = DemoEngine()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = engine.tick()
            await websocket.send_json(data)
            await asyncio.sleep(1.0) # 1 update per second
    except Exception as e:
        print(f"WebSocket closed: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
