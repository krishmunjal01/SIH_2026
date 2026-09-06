<div align="center">

# 👁️ URBAN EYE
### Live Intelligence by Team Prism

**Smart India Hackathon 2026 · Problem Statement SIH26124 · BEL**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://team-prism-sih-2026.vercel.app//)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_6-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Deck.gl](https://img.shields.io/badge/Deck.gl-9.x-orange?style=for-the-badge)](https://deck.gl/)

> *Transforming every public bus into a mobile AI sensor — giving cities a living, breathing nervous system.*

</div>

---

## 🧠 What is Urban Eye?

Urban Eye is an **AI-Powered Mobile Urban Intelligence Platform** that repurposes existing public transport fleets as a city-wide distributed sensing network. Instead of deploying expensive dedicated inspection vehicles or static sensor infrastructure, we mount Edge AI nodes on buses that continuously scan their environment — detecting road defects, traffic anomalies, and safety incidents in real-time.

The intelligence from individual buses is aggregated, **cross-verified by multiple independent buses**, and surfaced to city authorities through a **premium 3D Digital Twin command center**.

**One bus sees a pothole. Three buses confirm it. The city responds. Automatically.**

---

## ✨ Key Differentiators

| Feature | Urban Eye | Traditional Systems |
|---|---|---|
| **Sensor Platform** | Existing bus fleet (zero new hardware on roads) | Dedicated inspection vehicles or static sensors |
| **Event Confidence** | Cross-bus multi-modal fusion (Camera + IMU + GPS) | Single-source detection |
| **False Positive Rate** | Near-zero (2+ bus verification required) | High |
| **Road Health** | Temporal degradation tracking over months | Point-in-time snapshots |
| **Response** | Prescriptive AI recommendations auto-routed to authorities | Manual reporting |
| **Cost Model** | Tiered (NVIDIA Jetson for 10% Alpha nodes, RPi5 for 90% Scout nodes) | Uniform high-cost infrastructure |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    URBAN EYE SYSTEM ARCHITECTURE                │
├──────────────┬──────────────────────────────┬───────────────────┤
│  Edge Layer  │      Backend (Brain)         │  Frontend (UI)    │
│              │                              │                   │
│  NVIDIA      │  FastAPI (Python)            │  React 19 + Vite  │
│  Jetson      │  ├─ /api/telemetry           │  ├─ CityMap.tsx   │
│  Orin Nano   │  ├─ /api/events              │  │  (DeckGL 3D)   │
│              │  ├─ /api/detections          │  ├─ DemoEngine.ts │
│  Cameras ──► │  └─ /ws (live stream)        │  │  (simulation)  │
│  IMU ──────► │                              │  └─ 9 Panels      │
│  GPS ──────► │  Correlation Engine          │                   │
│              │  ├─ Spatial verification     │  Node.js Server   │
│  YOLO v8 +   │  ├─ Road health scoring      │  (Socket.IO for   │
│  ByteTrack + │  └─ Authority routing        │   real-time demo) │
│  PaddleOCR   │                              │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```

---

## 📁 Repository Structure

```
SIH_2026/
├── urbrain-frontend/           # React 19 + Vite + Deck.gl Dashboard
│   ├── public/
│   │   ├── scene.glb           # 3D bus model (GLTF)
│   │   ├── pothole1.jpeg       # Evidence image assets
│   │   ├── pothole2.jpeg
│   │   └── crack.jpeg
│   ├── src/
│   │   ├── App.tsx             # Root layout, nav rail, header, tab routing
│   │   ├── components/
│   │   │   ├── CityMap.tsx     # DeckGL 3D map, bus layers, event markers, popups
│   │   │   └── panels/
│   │   │       ├── AIActionCenter.tsx       # Prescriptive AI recommendation cards
│   │   │       ├── CameraMatrixPanel.tsx    # Live YOLO bounding box feed
│   │   │       ├── DemoController.tsx       # Scripted demo story buttons
│   │   │       ├── FleetPanel.tsx           # Bus fleet status list
│   │   │       ├── IncidentCommandPanel.tsx # Hit & Run incident command UI
│   │   │       ├── IncidentLogPanel.tsx     # Historical event log
│   │   │       ├── InfrastructurePanel.tsx  # Road infrastructure summary
│   │   │       ├── RoadIntelligencePanel.tsx # Route health bars and stats
│   │   │       └── ToastNotification.tsx    # Animated live event toasts
│   │   ├── lib/
│   │   │   └── demo-engine/
│   │   │       └── DemoEngine.ts  # Singleton simulation engine with OSRM routes
│   │   ├── store/
│   │   │   └── useUrbrainStore.ts # Zustand global state (buses, events, segments)
│   │   └── index.css              # Tailwind v4 + custom design tokens
│   ├── api/
│   │   └── protomaps.ts           # Vercel Serverless proxy for map tiles
│   └── vite.config.ts
│
├── urbrain-backend/            # Dual-server backend
│   ├── main.py                 # FastAPI: ingestion API + WebSocket bridge
│   ├── server.js               # Node.js/Socket.IO: demo data streamer
│   ├── engine/
│   │   ├── __init__.py
│   │   └── correlation.py      # Geospatial cross-bus event correlation engine
│   └── requirements.txt
│
└── urbrain_master_blueprint.md # Full project strategy document
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 6.x | Type safety |
| Vite | 8.x | Build tooling |
| Deck.gl | 9.x | 3D geospatial rendering |
| MapLibre GL | 6.x | Base map rendering |
| react-map-gl | 8.x | React bindings for MapLibre |
| Zustand | 5.x | Global state management |
| Framer Motion | 13.x | Animations |
| Lucide React | 1.x | Icon library |
| Tailwind CSS | 4.x | Utility-first styling |
| Socket.IO Client | 4.x | Real-time WebSocket comms |

### Backend

| Technology | Purpose |
|---|---|
| FastAPI (Python) | Edge AI event ingestion REST API + WebSocket bridge |
| Uvicorn | ASGI server |
| Node.js + Express | Demo data streaming server |
| Socket.IO | Real-time bidirectional bus/event data push |
| Pydantic | Data validation for telemetry + detection payloads |

### Edge AI (Architecture)

| Technology | Purpose |
|---|---|
| NVIDIA Jetson Orin Nano Super | Alpha Node compute platform |
| Raspberry Pi 5 | Scout Node compute platform |
| NVIDIA DeepStream + TensorRT | Optimized GPU inference pipeline |
| YOLOv8 (RDD2022 dataset) | Road defect detection (potholes, cracks) |
| ByteTrack | Multi-object tracking for traffic counting |
| PaddleOCR | License plate / ANPR recognition |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:
- **Node.js** ≥ 20.x — [nodejs.org](https://nodejs.org/)
- **Python** ≥ 3.10 — [python.org](https://python.org/)
- **Git** — [git-scm.com](https://git-scm.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/krishmunjal01/SIH_2026.git
cd SIH_2026
```

---

### 2. Start the Frontend

```bash
cd urbrain-frontend
npm install
npm run dev
```

The dashboard will be live at **http://localhost:5173**

> **Note:** The frontend runs in full demo mode out of the box using the built-in `DemoEngine.ts` simulation. No backend is required to see the 3D city, moving buses, event markers, and the full scripted demo story.

---

### 3. Start the Backend *(Optional — for real data integration)*

The backend has two servers. Open two separate terminals.

**Terminal A — FastAPI Ingestion Server (Python)**
```bash
cd urbrain-backend
pip install -r requirements.txt
python main.py
# API available at http://localhost:8000
```

**Terminal B — Node.js Demo Streamer**
```bash
cd urbrain-backend
npm install
node server.js
# Socket.IO server available at http://localhost:8000
```

---

### 4. Build for Production

```bash
cd urbrain-frontend
npm run build
# Output in urbrain-frontend/dist/
```

---

## 🎮 Demo Walkthrough

Once the frontend is running, follow this judge-facing demo flow:

### Step 1 — Observe the 3D City Twin
The map opens on **Chandigarh** with **12 buses** actively moving along 4 real OSRM road-snapped corridors. Toggle **"3D TWIN: ON"** in the header to switch to 3D bus models with physically-based rendering (PBR) lighting.

### Step 2 — Click an Event Marker
The 3 colored circular markers represent verified road defects. Click any marker to open an **evidence popup** featuring:
- Full evidence photograph from the detecting bus
- Confidence score, reporting bus ID, verification count, and timestamp
- A **4-stage dispatch workflow**: Dispatch → Confirm → Loading → ✅ Success

### Step 3 — Run the Scripted Pothole Story
Click **"Seq 1: Pothole"** in the bottom Demo Controller:
1. Camera flies to BUS-001 with a detection toast notification
2. A `PENDING` pothole event spawns at the bus location
3. BUS-004 is teleported into range to independently verify
4. Event is upgraded to `VERIFIED`; Madhya Marg health score drops
5. AI Action Center activates with a prescriptive repair recommendation

### Step 4 — Run the Hit & Run Scenario
Click **"Seq 2: Hit & Run"** to trigger the incident command scenario — a red ghost-radius circle expands outward from the incident point and nearby buses switch into `SEARCHING` mode.

### Step 5 — Explore the Intelligence Panels
Use the **side panel toggle** (right chevron button) to reveal:
- **Road Intelligence Panel** — live health bars for all 4 corridors
- **AI Action Center** — prescriptive alert cards ranked by priority
- **Camera Matrix** — simulated live YOLO bounding box detection feed

---

## 🗺️ Route Data

Buses run on **real road-snapped coordinates** fetched from the OSRM routing engine ensuring no bus ever clips through buildings.

| Route | Corridor | Approx. Length |
|---|---|---|
| Route 1 | Madhya Marg (PGI → Elante Mall) | ~8 km |
| Route 2 | Dakshin Marg (ISBT 43 → Railway Station) | ~7 km |
| Route 3 | Jan Marg (Sukhna Lake → Sector 17) | ~4 km |
| Route 4 | Vidya Path (Panjab University → Sector 34) | ~6 km |

---

## 🔌 API Reference

### FastAPI Endpoints (`main.py`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/telemetry` | Ingest bus GPS + status at 1Hz |
| `POST` | `/api/events` | Ingest a road defect or incident detection |
| `POST` | `/api/detections` | Ingest raw YOLO bounding boxes at ~10Hz |
| `WS` | `/ws` | Stream live bus + event state to dashboard |
| `WS` | `/ws/detections` | Stream live YOLO detections to Camera Matrix panel |

### Example — Telemetry Payload
```json
{
  "busId": "BUS-017",
  "latitude": 30.7460,
  "longitude": 76.7861,
  "speed": 42.5,
  "heading": 180,
  "route": "Madhya Marg",
  "edgeStatus": "ONLINE",
  "cameras": 4
}
```

### Example — Event Detection Payload
```json
{
  "busId": "BUS-017",
  "type": "POTHOLE",
  "latitude": 30.7462,
  "longitude": 76.7862,
  "confidence": 94,
  "severity": "HIGH"
}
```

---

## 🏛️ System Design Highlights

### Cross-Bus Verification Engine (`correlation.py`)
The `CorrelationEngine` class maintains a spatial index of all active events. When a new detection arrives from Bus A, it performs a **50-metre geofence search** for matching events from other buses. Once **2+ independent buses** report the same location, the event upgrades from `PENDING → VERIFIED` and the affected road segment's health score degrades proportionally to event severity.

### Road Health Scoring
Each road segment maintains a `healthScore` (0–100) that continuously degrades near verified events. This gives authorities a **temporal view of infrastructure decline** — not just isolated incident reports — enabling **predictive maintenance scheduling**.

### DemoEngine.ts (Frontend Simulation)
The frontend includes a complete standalone simulation engine (`DemoEngine.ts`) that runs entirely client-side. It uses real OSRM-derived GPS waypoints, simulates bus movement with correct heading/speed physics, and drives the full 5-step scripted demo story with timers. This means the dashboard works perfectly without any backend connection — ideal for demos, conferences, and judging panels.

### Edge-First Privacy
Raw video **never leaves the bus**. Only lightweight JSON event payloads (~200 bytes each) and optional short evidence clips are transmitted to the backend — making the system viable on India's 4G/5G networks without massive bandwidth requirements.

---

## 👥 Team Prism

Developed for **Smart India Hackathon 2026**
- **Problem Statement:** SIH26124
- **Organising Body:** Bharat Electronics Limited (BEL)
- **Category:** AI/ML · Smart Cities · Urban Infrastructure

---

## 📄 License

This project was developed for Smart India Hackathon 2026. All rights reserved by Team Prism.

---

<div align="center">
  <sub>Built with ❤️ for Smart India Hackathon 2026 · Urban Eye by Team Prism</sub>
</div>
