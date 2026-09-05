import { useUrbrainStore } from '../../store/useUrbrainStore';
import type { Bus, Event, RoadSegment, Incident } from '../../store/useUrbrainStore';

// Helper to calculate distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate heading from point A to point B
function getHeading(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = ((lat1) * Math.PI) / 180;
  const lat2Rad = ((lat2) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  let brng = Math.atan2(y, x);
  brng = (brng * 180) / Math.PI;
  brng = (brng + 360) % 360;
  return brng;
}

// Realistic waypoints around Chandigarh
const ROUTES = [
  // Route 42: Sector 17 to Sector 43 ISBT
  [
    [76.7821, 30.7398],
    [76.7725, 30.7345],
    [76.7651, 30.7292],
    [76.7570, 30.7225],
    [76.7490, 30.7160],
  ],
  // Route 19: Sukhna Lake to Sector 22
  [
    [76.8086, 30.7421],
    [76.8000, 30.7380],
    [76.7915, 30.7335],
    [76.7820, 30.7290],
    [76.7735, 30.7240],
  ],
  // Route 35: Elante to PGI
  [
    [76.8009, 30.7055],
    [76.7905, 30.7150],
    [76.7801, 30.7255],
    [76.7705, 30.7360],
    [76.7620, 30.7485],
    [76.7550, 30.7600],
  ]
];

interface BusState extends Bus {
  routeIndex: number;
  legIndex: number;
  progress: number; // 0 to 1 along the current leg
  direction: 1 | -1;
  baseSpeed: number;
}

class DemoEngine {
  private buses: BusState[] = [];
  private events: Event[] = [];
  private segments: RoadSegment[] = [];
  private timer: NodeJS.Timeout | null = null;
  private lastTick: number = 0;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Generate 12 buses distributed across the 3 routes
    const busCount = 12;
    for (let i = 0; i < busCount; i++) {
      const routeIndex = i % ROUTES.length;
      const route = ROUTES[routeIndex];
      const legIndex = Math.floor(Math.random() * (route.length - 1));
      
      this.buses.push({
        id: `BUS-${String(i + 1).padStart(3, '0')}`,
        route: `Route ${['42', '19', '35'][routeIndex]}`,
        latitude: route[legIndex][1],
        longitude: route[legIndex][0],
        speed: 40 + Math.random() * 20, // km/h
        status: 'ACTIVE',
        edgeStatus: 'ONLINE',
        cameras: 4,
        heading: 0,
        // Internal state
        routeIndex,
        legIndex,
        progress: Math.random(),
        direction: Math.random() > 0.5 ? 1 : -1,
        baseSpeed: 40 + Math.random() * 20
      });
    }

    // Generate some static events (potholes, etc)
    this.events = [
      {
        id: 'EVT-001',
        type: 'Pothole',
        latitude: 30.7345,
        longitude: 76.7725,
        confidence: 92,
        severity: 'HIGH',
        busId: 'BUS-002',
        timestamp: new Date().toISOString(),
        status: 'VERIFIED',
        verifyingBuses: ['BUS-002', 'BUS-003']
      },
      {
        id: 'EVT-002',
        type: 'Crack',
        latitude: 30.7290,
        longitude: 76.7820,
        confidence: 88,
        severity: 'MEDIUM',
        busId: 'BUS-005',
        timestamp: new Date().toISOString(),
        status: 'VERIFIED',
        verifyingBuses: ['BUS-005', 'BUS-008']
      }
    ];

    // Generate road segments based on the routes
    this.segments = ROUTES.map((route, idx) => ({
      id: `SEG-00${idx + 1}`,
      name: `Route ${['42', '19', '35'][idx]} Corridor`,
      path: route,
      healthScore: 100 - (idx * 20) // Give them initial different scores: 100, 80, 60
    }));
  }

  public triggerPotholeDetection(busId: string) {
    const bus = this.buses.find(b => b.id === busId);
    if (!bus) return;

    // Spawn a pending pothole at the bus's location
    const incident: Event = {
      id: `EVT-${Date.now()}`,
      type: 'Pothole',
      latitude: bus.latitude,
      longitude: bus.longitude,
      confidence: 94,
      severity: 'HIGH',
      busId: bus.id,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      verifyingBuses: [bus.id]
    };

    this.events.push(incident);
    useUrbrainStore.getState().setEvents([...this.events]);
  }

  public triggerHitAndRun() {
    const incident: Incident = {
      id: 'INC-991',
      type: 'HIT_AND_RUN',
      latitude: 30.7333,
      longitude: 76.7794, // Sector 17 intersection
      radius: 0.1, // Start small (km)
      suspectPlate: 'CH01-BR-8291',
      active: true
    };
    useUrbrainStore.getState().setActiveIncident(incident);
  }

  public clearHitAndRun() {
    useUrbrainStore.getState().setActiveIncident(null);
    this.buses.forEach(bus => bus.status = 'ACTIVE');
  }

  public start() {
    if (this.timer) return;
    this.lastTick = Date.now();
    // Run engine at 1Hz (every 1000ms) and let Deck.gl handle the 60fps WebGL GPU interpolation.
    // This dramatically reduces React re-renders and makes the UI ultra-smooth!
    this.timer = setInterval(() => this.tick(), 1000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000; // seconds
    this.lastTick = now;

    this.buses.forEach(bus => {
      const route = ROUTES[bus.routeIndex];
      
      let p1 = route[bus.legIndex];
      let p2 = route[bus.legIndex + bus.direction];

      if (!p2) {
        // Reverse direction at the end of the route
        bus.direction *= -1;
        p2 = route[bus.legIndex + bus.direction];
      }

      // Distance of current leg in km
      const legDist = getDistance(p1[1], p1[0], p2[1], p2[0]);
      
      // Speed modulation (slow down near events)
      let currentSpeed = bus.baseSpeed;
      this.events.forEach(evt => {
        const distToEvt = getDistance(bus.latitude, bus.longitude, evt.latitude, evt.longitude);
        if (distToEvt < 0.2) { // within 200 meters of an event
          currentSpeed = bus.baseSpeed * 0.4; // slow down by 60%
        }
      });
      
      bus.speed = currentSpeed;

      // Distance to travel this tick (km) = (km/h) * (h)
      const distToTravel = currentSpeed * (dt / 3600);
      
      // How much progress is made on this leg (0 to 1)
      const progressDelta = distToTravel / legDist;
      bus.progress += progressDelta;

      if (bus.progress >= 1) {
        // Move to next leg
        bus.progress = 0;
        bus.legIndex += bus.direction;
        
        // Handle edges again just in case
        if (bus.legIndex >= route.length - 1 && bus.direction === 1) {
          bus.direction = -1;
          bus.legIndex = route.length - 1;
        } else if (bus.legIndex <= 0 && bus.direction === -1) {
          bus.direction = 1;
          bus.legIndex = 0;
        }
      }

      // Recalculate p1, p2 as legIndex might have changed
      p1 = route[bus.legIndex];
      p2 = route[bus.legIndex + bus.direction] || p1; // Fallback

      // Interpolate position
      bus.longitude = p1[0] + (p2[0] - p1[0]) * bus.progress;
      bus.latitude = p1[1] + (p2[1] - p1[1]) * bus.progress;
      
      // Calculate heading
      bus.heading = getHeading(p1[1], p1[0], p2[1], p2[0]);
    });

    // Cross-bus verification logic
    this.events.forEach(evt => {
      if (evt.status === 'PENDING') {
        this.buses.forEach(bus => {
          if (!evt.verifyingBuses.includes(bus.id)) {
            const dist = getDistance(bus.latitude, bus.longitude, evt.latitude, evt.longitude);
            if (dist < 0.05) { // 50 meters
              evt.verifyingBuses.push(bus.id);
            }
          }
        });
        
        if (evt.verifyingBuses.length >= 2) {
          evt.status = 'VERIFIED';
        }
      }
    });

    // Update road health dynamically (if a VERIFIED event is near a segment, drop its health slowly)
    this.segments.forEach(segment => {
      let isDegrading = false;
      this.events.forEach(evt => {
        if (evt.status !== 'VERIFIED') return;
        // Simple check: is event near the first waypoint of the segment
        const dist = getDistance(segment.path[0][1], segment.path[0][0], evt.latitude, evt.longitude);
        if (dist < 2.0) { // arbitrary wide radius for demo effect
          isDegrading = true;
        }
      });
      if (isDegrading && segment.healthScore > 30) {
        segment.healthScore -= 0.05 * dt; // slow degradation
      }
    });

    // Handle active incident (Ghost Radius expansion)
    const store = useUrbrainStore.getState();
    const activeIncident = store.activeIncident;
    
    if (activeIncident && activeIncident.active) {
      // Expand radius by ~16 meters per second (approx 60km/h)
      const newRadius = activeIncident.radius + (0.016 * dt);
      store.setActiveIncident({ ...activeIncident, radius: newRadius });
      
      // Update buses status if they are inside the radius
      this.buses.forEach(bus => {
        const dist = getDistance(bus.latitude, bus.longitude, activeIncident.latitude, activeIncident.longitude);
        if (dist <= newRadius) {
          bus.status = 'SEARCHING';
        }
      });
    }

    // Strip internal properties before sending to store
    const cleanBuses = this.buses.map(b => {
      const { routeIndex, legIndex, progress, direction, baseSpeed, ...cleanBus } = b;
      return cleanBus;
    });

    store.setBuses(cleanBuses);
    store.setEvents([...this.events]);
    store.setSegments([...this.segments]);
  }
}

export const demoEngine = new DemoEngine();
