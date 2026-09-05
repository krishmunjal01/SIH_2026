"""
URBRAIN Spatial Correlation Engine
-----------------------------------
This is the "brain" of the backend. It takes raw telemetry and event data
from individual buses and performs cross-bus verification to upgrade
PENDING detections into VERIFIED incidents.
"""

import math
import time
from typing import Dict, List, Optional
from datetime import datetime


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class CorrelationEngine:
    """
    Maintains the global state of all buses and events.
    Performs spatial correlation to verify detections across multiple buses.
    """

    VERIFICATION_RADIUS_KM = 0.05  # 50 meters
    VERIFICATION_THRESHOLD = 2     # Minimum number of buses to verify an event

    def __init__(self):
        self.buses: Dict[str, dict] = {}       # busId -> latest telemetry
        self.events: List[dict] = []           # All events (PENDING + VERIFIED)
        self.segments: List[dict] = [
            # Pre-seeded road segments matching our frontend routes
            {
                "id": "SEG-001",
                "name": "Route 42 Corridor",
                "path": [[76.7821, 30.7398], [76.7725, 30.7345], [76.7651, 30.7292], [76.7570, 30.7225], [76.7490, 30.7160]],
                "healthScore": 100
            },
            {
                "id": "SEG-002",
                "name": "Route 19 Corridor",
                "path": [[76.8086, 30.7421], [76.8000, 30.7380], [76.7915, 30.7335], [76.7820, 30.7290], [76.7735, 30.7240]],
                "healthScore": 80
            },
            {
                "id": "SEG-003",
                "name": "Route 35 Corridor",
                "path": [[76.8009, 30.7055], [76.7905, 30.7150], [76.7801, 30.7255], [76.7705, 30.7360], [76.7620, 30.7485], [76.7550, 30.7600]],
                "healthScore": 60
            }
        ]
        self._event_counter = 0

    def update_bus_telemetry(self, telemetry: dict):
        """Update the latest position/state of a bus."""
        bus_id = telemetry['busId']
        self.buses[bus_id] = {
            "id": bus_id,
            "route": telemetry.get('route', 'Unknown'),
            "latitude": telemetry['latitude'],
            "longitude": telemetry['longitude'],
            "speed": telemetry['speed'],
            "heading": telemetry['heading'],
            "status": "ACTIVE",
            "edgeStatus": telemetry.get('edgeStatus', 'ONLINE'),
            "cameras": telemetry.get('cameras', 4),
        }

    def process_new_event(self, event: dict):
        """
        Process a new detection from the Edge AI.
        First, check if this event spatially matches any existing PENDING event
        (cross-bus verification). If so, add the bus as a verifier.
        If not, create a new PENDING event.
        """
        matched_event = self._find_nearby_pending_event(
            event['latitude'], event['longitude'], event['type']
        )

        if matched_event:
            # Cross-bus verification! Another bus saw the same thing nearby.
            if event['busId'] not in matched_event['verifyingBuses']:
                matched_event['verifyingBuses'].append(event['busId'])

            # Check if we have enough verifiers to upgrade to VERIFIED
            if len(matched_event['verifyingBuses']) >= self.VERIFICATION_THRESHOLD:
                matched_event['status'] = 'VERIFIED'
                # Degrade the nearest road segment's health
                self._degrade_nearest_segment(matched_event['latitude'], matched_event['longitude'])
        else:
            # New event — mark as PENDING until another bus confirms it
            self._event_counter += 1
            new_event = {
                "id": f"EVT-{self._event_counter:04d}",
                "type": event['type'],
                "latitude": event['latitude'],
                "longitude": event['longitude'],
                "confidence": event.get('confidence', 90),
                "severity": event.get('severity', 'MEDIUM'),
                "busId": event['busId'],
                "timestamp": event.get('timestamp', datetime.now().isoformat()),
                "status": "PENDING",
                "verifyingBuses": [event['busId']]
            }
            self.events.append(new_event)

            # Keep event list manageable
            if len(self.events) > 200:
                self.events = self.events[-100:]

    def _find_nearby_pending_event(self, lat: float, lon: float, event_type: str) -> Optional[dict]:
        """Find a PENDING event of the same type within the verification radius."""
        for evt in self.events:
            if evt['status'] != 'PENDING':
                continue
            if evt['type'] != event_type:
                continue
            dist = haversine_km(lat, lon, evt['latitude'], evt['longitude'])
            if dist <= self.VERIFICATION_RADIUS_KM:
                return evt
        return None

    def _degrade_nearest_segment(self, lat: float, lon: float):
        """When a VERIFIED event is confirmed, degrade the nearest road segment's health."""
        min_dist = float('inf')
        nearest_seg = None
        for seg in self.segments:
            # Check distance to the first waypoint of each segment
            seg_lat, seg_lon = seg['path'][0][1], seg['path'][0][0]
            dist = haversine_km(lat, lon, seg_lat, seg_lon)
            if dist < min_dist:
                min_dist = dist
                nearest_seg = seg

        if nearest_seg and min_dist < 3.0:  # Within 3km
            nearest_seg['healthScore'] = max(10, nearest_seg['healthScore'] - 5)

    def get_all_buses(self) -> Dict[str, dict]:
        """Return all known bus states."""
        return self.buses

    def get_active_events(self) -> List[dict]:
        """Return the latest events."""
        return self.events[-50:]  # Return the latest 50

    def get_road_segments(self) -> List[dict]:
        """Return all road segments with current health scores."""
        return self.segments
