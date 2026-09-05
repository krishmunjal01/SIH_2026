# URBRAIN: The Distributed AI Brain for a Moving City
**Master Project Blueprint & Strategy Document**

## 1. Project Identity & Context
- **Hackathon:** Smart India Hackathon (SIH) 2026
- **Problem Statement:** SIH26124 (Bharat Electronics Limited - BEL) - AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet.
- **Team Name Suggestion:** NEXORA
- **Project Name:** URBRAIN
- **Elevator Pitch:** We are transforming existing public transport fleets into a distributed, multi-modal urban sensing network. By putting Edge AI on buses, we continuously generate actionable intelligence about road health, traffic bottlenecks, and public safety without requiring massive new static infrastructure.

---

## 2. The Core Differentiators (The "Moat")
*If a judge asks "Doesn't Samsara/Google Maps already do this?", these are the defenses:*

1.  **Bus-as-a-Sensor Network:** Utilizing existing municipal assets (buses) rather than expensive dedicated inspection vehicles.
2.  **Multi-Modal Edge Fusion:** Fusing Camera (YOLO vision) + IMU (physical shock) + GPS (location) locally on the bus for high-confidence event generation.
3.  **Cross-Bus Verification (Crowdsourced Machine Perception):** If Bus A detects a pothole, the system waits for Bus B and C to independently verify it before alerting authorities, eliminating false positives.
4.  **Dynamic Road Health (Temporal Tracking):** Tracking a road segment's degradation over months (e.g., Health Score 92 -> 58) rather than just logging isolated pothole events.
5.  **Expected vs. Observed Infrastructure:** Using GIS to know what *should* be there (e.g., a speed sign or zebra crossing) and having the AI flag when it is missing or degraded.
6.  **Predictive + Prescriptive AI (Action Engine):** Not just saying "Traffic is bad," but calculating "Route 42 will be delayed by 10 mins; Priority intervention recommended at Sector 17 intersection."
7.  **(Advanced) Ghost Vehicle Predictive Radius:** For hit-and-runs, predicting the suspect's expanding trajectory and dynamically alerting buses ahead of them to activate OCR scanning.
8.  **(Advanced) Environmental Context Fusion:** Multiplying hazard severity scores based on live weather (e.g., pothole + rain = critical hazard).
9.  **(Advanced) Tiered Network Architecture:** 10% of the fleet gets expensive NVIDIA Jetsons (Alpha Nodes) for heavy intelligence; 90% gets Raspberry Pi 5s (Scout Nodes) for basic pothole/traffic counting, ensuring economic viability for Indian cities.

---

## 3. The Architecture

### A. On-Bus Edge AI Node (The "Neurons")
- **Hardware (Tier 1 Alpha Node):** NVIDIA Jetson Orin Nano Super.
- **Sensors:** 4-5 Cameras (Front, Rear, Sides, Cabin), GPS, IMU.
- **Software Pipeline:** GStreamer -> NVIDIA DeepStream -> TensorRT -> AI Models.
- **The Philosophy:** *Edge-first privacy and bandwidth reduction.* The bus processes raw video locally and ONLY transmits lightweight JSON event payloads and tiny evidence clips to the cloud. Buffers data locally if the 4G/5G internet drops.

**Camera Roles:**
- **Front:** Road defects (Potholes, cracks via RDD2022 dataset) & Traffic (Vehicle counting/density).
- **Sides:** Missing infrastructure, pedestrian safety conflicts, school zones.
- **Cabin:** Driver Safety Monitoring (distraction, drowsiness) - correlated with external vehicle motion to prove "rash driving."

### B. Central Urban Platform (The "Brain")
- **Ingestion:** API / MQTT Layer receiving JSON events.
- **Event Correlation Engine (The Hard Part):** Geospacial logic that links an observation from Bus A with an observation from Bus B to create a single *Verified Incident*.
- **Databases:** PostgreSQL + PostGIS (crucial for spatial POINT and LINESTRING queries), TimescaleDB (for temporal health data).
- **Authority Routing Engine:** Intelligently routes verified incidents to the correct body (Potholes -> Municipal, Accidents -> Police, Delays -> Transport Authority).

---

## 4. The UI/UX Master Plan (The "Urban Command Center")
**Philosophy:** Must look like a premium, enterprise-grade Palantir-style intelligence platform, NOT a college CRUD dashboard or a glowing neon sci-fi movie set. Dark charcoal theme, semantic colors (Red=Critical, Amber=Warning, Green=Healthy).

**The Hero Experience:** A full-screen, functional 3D digital twin of the city (using MapLibre GL JS / Deck.gl / Three.js).

**The 5 Major Interaction Layers:**
1.  **Fleet Intelligence:** Live 3D buses moving on routes, showing Edge Node health (CPU/GPU temps).
2.  **Road Intelligence:** The map color-codes road health. Clicking a road shows historical degradation trends and verified defect counts.
3.  **Traffic & Transport Intelligence:** Glowing traffic flows, congestion bottlenecks, and actual vs. expected bus ETA deviations.
4.  **Incident Command:** The "Wow" screen. Map flies to a hit-and-run, showing the fleeing vehicle's plate, the OCR confidence, and nearby buses actively "Searching" or "Correlated".
5.  **🤖 AI Action Center:** Prescriptive cards telling authorities exactly what to do based on the data (e.g., "Recommend Priority Road Inspection: Segment A172 deteriorated 31% in 14 days.").

---

## 5. The Hackathon MVP Scope
*Do not try to build 20 modules poorly. Build 8 modules perfectly using a structured "Demo Engine" with synthetic interconnected data.*

1.  **Multi-camera Edge AI:** Simulate Front, Side, Rear streams on one Jetson.
2.  **Road Detection:** YOLO for Potholes & Cracks.
3.  **Traffic:** Vehicle detection, tracking, counting, density score.
4.  **Incident:** Vehicle detection + ANPR/OCR + GPS.
5.  **Multi-Bus Verification:** Simulate 3 buses independently detecting the same pothole to trigger the correlation engine.
6.  **GIS 3D Dashboard:** The React/Next.js command center.
7.  **ETA / Route Delay:** Visualizing Expected vs Actual arrival times.
8.  **Automated Recommendation:** The AI Action Center output.

---

## 6. The "Killer Demo" Story Flow
*How to pitch to the judges in 5 minutes:*
1.  Show the 3D City. "This is our city. And these moving markers are our buses—our mobile sensors."
2.  **Bus 017** detects a pothole (92% visual confidence) + IMU shock (96% fused confidence).
3.  It sends a JSON payload to the cloud (saving massive bandwidth).
4.  **Bus 021** passes by later and confirms it.
5.  The Central Correlation Engine upgrades it to a "Verified Defect".
6.  The Dynamic Road Health score drops from 74 -> 48.
7.  Traffic speed in that segment is shown dropping, causing a +8 min delay on Route 42.
8.  The AI Action Center pops up: *"🔴 Priority road intervention recommended."*
9.  **Conclusion:** "One event -> road intelligence -> traffic intelligence -> transport impact -> actionable decision. We didn't build a pothole detector; we built a city brain."

---

## 7. Tech Stack Summary
- **Edge AI:** NVIDIA Jetson Orin Nano Super, DeepStream, TensorRT, YOLO, ByteTrack, PaddleOCR.
- **Backend:** Python, FastAPI, PostgreSQL, PostGIS, MQTT/WebSockets.
- **Frontend:** React, Next.js, Tailwind CSS, MapLibre GL JS / Deck.gl, Framer Motion.
