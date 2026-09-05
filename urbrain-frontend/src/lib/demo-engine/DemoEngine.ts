import { useUrbrainStore } from '../../store/useUrbrainStore';
import type { Bus, Event, RoadSegment, Incident } from '../../store/useUrbrainStore';
import { FlyToInterpolator } from '@deck.gl/core';

// Helper to calculate distance between two coordinates (km)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
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
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  let brng = Math.atan2(y, x);
  brng = (brng * 180) / Math.PI;
  brng = (brng + 360) % 360;
  return brng;
}

// Realistic waypoints around Chandigarh
const ROUTES: [number, number][][] = [
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
  ],
];

const INITIAL_SEGMENT_HEALTH = [100, 80, 60];

const INITIAL_EVENTS: Event[] = [
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
    verifyingBuses: ['BUS-002', 'BUS-003'],
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
    verifyingBuses: ['BUS-005', 'BUS-008'],
  },
];

interface BusState extends Bus {
  routeIndex: number;
  legIndex: number;
  progress: number;
  direction: 1 | -1;
  baseSpeed: number;
}

let _toastIdCounter = 0;
function fireToast(type: 'detect' | 'verify' | 'verified' | 'action', message: string) {
  useUrbrainStore.getState().setDemoToast({ type, message, id: ++_toastIdCounter });
}

class DemoEngine {
  private buses: BusState[] = [];
  private events: Event[] = [];
  private segments: RoadSegment[] = [];
  private timer: NodeJS.Timeout | null = null;
  private lastTick: number = 0;
  private storyTimers: NodeJS.Timeout[] = [];
  private storyRunning = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
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
        speed: 40 + Math.random() * 20,
        status: 'ACTIVE',
        edgeStatus: 'ONLINE',
        cameras: 4,
        heading: 0,
        routeIndex,
        legIndex,
        progress: Math.random(),
        direction: Math.random() > 0.5 ? 1 : -1,
        baseSpeed: 40 + Math.random() * 20,
      });
    }

    // Deep clone initial events
    this.events = INITIAL_EVENTS.map(e => ({ ...e, verifyingBuses: [...e.verifyingBuses] }));

    this.segments = ROUTES.map((route, idx) => ({
      id: `SEG-00${idx + 1}`,
      name: `Route ${['42', '19', '35'][idx]} Corridor`,
      path: route,
      healthScore: INITIAL_SEGMENT_HEALTH[idx],
    }));
  }

  // ─── Scripted 5-Step Pothole Story ────────────────────────────────────────

  public triggerPotholeStory(onStep: (step: number) => void) {
    if (this.storyRunning) return;
    this.storyRunning = true;

    const store = useUrbrainStore.getState();
    const targetBus = this.buses[0]; // BUS-001 on Route 42
    if (!targetBus) return;

    // ── Step 1 (0s): Camera fly + detection toast ────────────────────────────
    onStep(1);
    store.setViewState({
      longitude: targetBus.longitude,
      latitude: targetBus.latitude,
      zoom: 17,
      pitch: 65,
      bearing: targetBus.heading,
      transitionDuration: 3500,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
    });
    fireToast('detect', '🔍 BUS-001: Road Anomaly Detected  ·  Confidence: 94%  ·  Route 42');

    // ── Step 2 (2.5s): Spawn PENDING pothole at bus location ─────────────────
    this.storyTimers.push(setTimeout(() => {
      onStep(2);
      const potholeEvt: Event = {
        id: `EVT-STORY-${Date.now()}`,
        type: 'Pothole',
        latitude: targetBus.latitude - 0.0005,
        longitude: targetBus.longitude + 0.0003,
        confidence: 94,
        severity: 'HIGH',
        busId: targetBus.id,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        verifyingBuses: [targetBus.id],
      };
      this.events.push(potholeEvt);
      store.setEvents([...this.events]);
      fireToast('verify', '⏳ EVT-STORY: BUS-001 reported pothole  ·  Awaiting cross-bus verification...');
    }, 2500));

    // ── Step 3 (8s): Teleport BUS-004 to corroborate ────────────────────────
    this.storyTimers.push(setTimeout(() => {
      onStep(3);
      const bus4 = this.buses.find(b => b.id === 'BUS-004');
      const storyEvt = this.events.find(e => e.id.startsWith('EVT-STORY'));
      if (bus4 && storyEvt) {
        // Move BUS-004 to within 35m of the pothole
        bus4.latitude  = storyEvt.latitude  + 0.00028; // ~31m north
        bus4.longitude = storyEvt.longitude - 0.00020; // ~17m west
        bus4.speed     = 22;
      }
      fireToast('verify', '🛰️ BUS-004 approaching same coordinates  ·  Spatial correlation running...');
    }, 8000));

    // ── Step 4 (10s): Force verification ────────────────────────────────────
    this.storyTimers.push(setTimeout(() => {
      onStep(4);
      const bus4    = this.buses.find(b => b.id === 'BUS-004');
      const storyEvt = this.events.find(e => e.id.startsWith('EVT-STORY'));
      if (bus4 && storyEvt && !storyEvt.verifyingBuses.includes(bus4.id)) {
        storyEvt.verifyingBuses.push(bus4.id);
        storyEvt.status = 'VERIFIED';
      }
      // Drop Route 42 segment health sharply
      const seg42 = this.segments.find(s => s.id === 'SEG-001');
      if (seg42) seg42.healthScore = Math.max(28, seg42.healthScore - 22);

      store.setEvents([...this.events]);
      store.setSegments([...this.segments]);
      fireToast('verified', '🚨 VERIFIED INCIDENT  ·  2 buses confirmed  ·  Route 42 Health: 100 → 78  ·  ETA +8 min');
    }, 10000));

    // ── Step 5 (12s): AI Action Center slides in ────────────────────────────
    this.storyTimers.push(setTimeout(() => {
      onStep(5);
      fireToast('action', '🤖 AI Engine: Priority Road Intervention on Route 42 Corridor  ·  Dispatching crew');
    }, 12500));

    // ── Story complete (14s): reset running flag ──────────────────────────────
    this.storyTimers.push(setTimeout(() => {
      this.storyRunning = false;
      onStep(0); // 0 = idle
    }, 14000));
  }

  // ─── Existing Triggers (kept for compatibility) ───────────────────────────

  public triggerPotholeDetection(busId: string) {
    const bus = this.buses.find(b => b.id === busId);
    if (!bus) return;
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
      verifyingBuses: [bus.id],
    };
    this.events.push(incident);
    useUrbrainStore.getState().setEvents([...this.events]);
  }

  public triggerHitAndRun() {
    const incident: Incident = {
      id: 'INC-991',
      type: 'HIT_AND_RUN',
      latitude: 30.7333,
      longitude: 76.7794,
      radius: 0.1,
      suspectPlate: 'CH01-BR-8291',
      active: true,
    };
    useUrbrainStore.getState().setActiveIncident(incident);
  }

  public clearHitAndRun() {
    useUrbrainStore.getState().setActiveIncident(null);
    this.buses.forEach(bus => (bus.status = 'ACTIVE'));
  }

  // ─── Reset Everything ────────────────────────────────────────────────────

  public resetAll() {
    // Cancel any running story timers
    this.storyTimers.forEach(t => clearTimeout(t));
    this.storyTimers = [];
    this.storyRunning = false;

    // Reset events to initial set
    this.events = INITIAL_EVENTS.map(e => ({ ...e, verifyingBuses: [...e.verifyingBuses] }));

    // Reset segment health
    this.segments.forEach((seg, idx) => {
      seg.healthScore = INITIAL_SEGMENT_HEALTH[idx];
    });

    // Reset bus statuses
    this.buses.forEach(bus => (bus.status = 'ACTIVE'));

    const store = useUrbrainStore.getState();
    store.setEvents([...this.events]);
    store.setSegments([...this.segments]);
    store.setActiveIncident(null);
    store.setDemoToast(null);

    // Reset camera
    store.setViewState({
      longitude: 76.7794,
      latitude: 30.7333,
      zoom: 13,
      pitch: 45,
      bearing: 0,
      transitionDuration: 2500,
      transitionInterpolator: new FlyToInterpolator(),
    });
  }

  // ─── Engine Lifecycle ────────────────────────────────────────────────────

  public start() {
    if (this.timer) return;
    this.lastTick = Date.now();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.storyTimers.forEach(t => clearTimeout(t));
    this.storyTimers = [];
  }

  private tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    this.buses.forEach(bus => {
      const route = ROUTES[bus.routeIndex];

      let p1 = route[bus.legIndex];
      let p2 = route[bus.legIndex + bus.direction];

      if (!p2) {
        bus.direction *= -1;
        p2 = route[bus.legIndex + bus.direction];
      }

      const legDist = getDistance(p1[1], p1[0], p2[1], p2[0]);

      // Speed modulation: slow down near events
      let currentSpeed = bus.baseSpeed;
      this.events.forEach(evt => {
        const distToEvt = getDistance(bus.latitude, bus.longitude, evt.latitude, evt.longitude);
        if (distToEvt < 0.2) currentSpeed = bus.baseSpeed * 0.4;
      });
      bus.speed = currentSpeed;

      const distToTravel = currentSpeed * (dt / 3600);
      const progressDelta = distToTravel / legDist;
      bus.progress += progressDelta;

      if (bus.progress >= 1) {
        bus.progress = 0;
        bus.legIndex += bus.direction;
        if (bus.legIndex >= route.length - 1 && bus.direction === 1) {
          bus.direction = -1;
          bus.legIndex = route.length - 1;
        } else if (bus.legIndex <= 0 && bus.direction === -1) {
          bus.direction = 1;
          bus.legIndex = 0;
        }
      }

      p1 = route[bus.legIndex];
      p2 = route[bus.legIndex + bus.direction] || p1;

      bus.longitude = p1[0] + (p2[0] - p1[0]) * bus.progress;
      bus.latitude  = p1[1] + (p2[1] - p1[1]) * bus.progress;
      bus.heading   = getHeading(p1[1], p1[0], p2[1], p2[0]);
    });

    // Cross-bus verification (organic, not story-driven)
    this.events.forEach(evt => {
      if (evt.status === 'PENDING') {
        this.buses.forEach(bus => {
          if (!evt.verifyingBuses.includes(bus.id)) {
            const dist = getDistance(bus.latitude, bus.longitude, evt.latitude, evt.longitude);
            if (dist < 0.05) evt.verifyingBuses.push(bus.id);
          }
        });
        if (evt.verifyingBuses.length >= 2) evt.status = 'VERIFIED';
      }
    });

    // Slow road health degradation near verified events
    this.segments.forEach(segment => {
      let isDegrading = false;
      this.events.forEach(evt => {
        if (evt.status !== 'VERIFIED') return;
        const dist = getDistance(segment.path[0][1], segment.path[0][0], evt.latitude, evt.longitude);
        if (dist < 2.0) isDegrading = true;
      });
      if (isDegrading && segment.healthScore > 30) {
        segment.healthScore -= 0.05 * dt;
      }
    });

    // Ghost radius expansion
    const store = useUrbrainStore.getState();
    const activeIncident = store.activeIncident;
    if (activeIncident && activeIncident.active) {
      const newRadius = activeIncident.radius + 0.016 * dt;
      store.setActiveIncident({ ...activeIncident, radius: newRadius });
      this.buses.forEach(bus => {
        const dist = getDistance(bus.latitude, bus.longitude, activeIncident.latitude, activeIncident.longitude);
        if (dist <= newRadius) bus.status = 'SEARCHING';
      });
    }

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
