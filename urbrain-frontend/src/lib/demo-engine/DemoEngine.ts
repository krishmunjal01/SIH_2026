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

// Realistic waypoints around Chandigarh (OSRM road-snapped)
const ROUTES: [number, number][][] = [
  // PGI to Elante (Madhya Marg)
  [
    [76.772539, 30.763421],
    [76.773859, 30.761668],
    [76.773925, 30.761579],
    [76.774241, 30.761148],
    [76.775565, 30.759347],
    [76.775875, 30.759219],
    [76.776021, 30.759175],
    [76.77616, 30.759034],
    [76.776185, 30.758921],
    [76.776118, 30.758746],
    [76.776486, 30.758176],
    [76.778263, 30.755912],
    [76.779996, 30.753704],
    [76.780446, 30.753226],
    [76.780631, 30.753223],
    [76.780764, 30.75316],
    [76.780868, 30.753016],
    [76.780873, 30.752873],
    [76.780907, 30.752555],
    [76.781719, 30.751561],
    [76.782569, 30.750522],
    [76.783615, 30.749242],
    [76.784991, 30.747561],
    [76.785595, 30.747137],
    [76.786124, 30.746885],
    [76.78614, 30.746242],
    [76.788023, 30.743974],
    [76.790906, 30.740606],
    [76.791145, 30.74033],
    [76.791651, 30.739744],
    [76.795654, 30.735257],
    [76.796077, 30.735003],
    [76.796247, 30.73498],
    [76.796416, 30.734848],
    [76.796457, 30.734732],
    [76.796428, 30.734583],
    [76.796638, 30.734179],
    [76.798842, 30.73183],
    [76.799477, 30.731154],
    [76.801124, 30.729416],
    [76.801406, 30.729336],
    [76.801553, 30.729292],
    [76.801691, 30.729151],
    [76.801716, 30.729038],
    [76.801764, 30.72873],
    [76.804247, 30.726137],
    [76.806393, 30.723927],
    [76.806733, 30.723763],
    [76.806902, 30.72374],
    [76.807071, 30.723607],
    [76.807109, 30.723491],
    [76.807207, 30.72312],
    [76.809481, 30.720854],
    [76.811891, 30.718455],
    [76.812359, 30.717818],
    [76.811114, 30.717013],
    [76.807947, 30.714889],
    [76.808121, 30.714542],
    [76.80588, 30.713079],
    [76.803441, 30.711554],
    [76.801242, 30.710178],
    [76.802747, 30.708642],
    [76.802188, 30.707495],
    [76.800959, 30.706706],
    [76.80028, 30.706251],
  ],
  // ISBT 43 to Railway Station (Dakshin Marg)
  [
    [76.756815, 30.722726],
    [76.757489, 30.722641],
    [76.757878, 30.722489],
    [76.759946, 30.723719],
    [76.760592, 30.724095],
    [76.760806, 30.72429],
    [76.761405, 30.724562],
    [76.761901, 30.723973],
    [76.762601, 30.723157],
    [76.762977, 30.723112],
    [76.763751, 30.723437],
    [76.767665, 30.725943],
    [76.767864, 30.726241],
    [76.767911, 30.726546],
    [76.768139, 30.726729],
    [76.768487, 30.726752],
    [76.768842, 30.72675],
    [76.769404, 30.727046],
    [76.773593, 30.729635],
    [76.774656, 30.730295],
    [76.779109, 30.733083],
    [76.779362, 30.733402],
    [76.77944, 30.733611],
    [76.779623, 30.733714],
    [76.779808, 30.733711],
    [76.779941, 30.733648],
    [76.780045, 30.733504],
    [76.78005, 30.733361],
    [76.780065, 30.733136],
    [76.780236, 30.732876],
    [76.782317, 30.730539],
    [76.784627, 30.727991],
    [76.784868, 30.727959],
    [76.785014, 30.727915],
    [76.785135, 30.727804],
    [76.785178, 30.727661],
    [76.785166, 30.727407],
    [76.786472, 30.725941],
    [76.789717, 30.722423],
    [76.789907, 30.722309],
    [76.79011, 30.722285],
    [76.790256, 30.722241],
    [76.790394, 30.722099],
    [76.790419, 30.721987],
    [76.790381, 30.721853],
    [76.790586, 30.72151],
    [76.793178, 30.718826],
    [76.795428, 30.716701],
    [76.795597, 30.716678],
    [76.795766, 30.716545],
    [76.795803, 30.716429],
    [76.795778, 30.716281],
    [76.79795, 30.713978],
    [76.80087, 30.711088],
    [76.801446, 30.711157],
    [76.80685, 30.71456],
    [76.807619, 30.715041],
    [76.808009, 30.714711],
    [76.808398, 30.714188],
    [76.808612, 30.713966],
    [76.808963, 30.713715],
    [76.809232, 30.713535],
    [76.811594, 30.712103],
    [76.812383, 30.711703],
    [76.813446, 30.711079],
    [76.816654, 30.709117],
    [76.816871, 30.708975],
    [76.817099, 30.708615],
    [76.817384, 30.708245],
    [76.817574, 30.708121],
    [76.818145, 30.707988],
    [76.820189, 30.707567],
    [76.819332, 30.704394],
  ],
  // Sukhna Lake to Sector 17 (Jan Marg)
  [
    [76.808795, 30.742224],
    [76.807517, 30.741834],
    [76.807367, 30.741397],
    [76.807003, 30.741267],
    [76.806729, 30.7415],
    [76.80669, 30.741891],
    [76.804411, 30.744748],
    [76.802357, 30.747144],
    [76.802012, 30.747245],
    [76.798498, 30.745163],
    [76.796666, 30.743954],
    [76.792146, 30.741143],
    [76.791152, 30.740525],
    [76.790828, 30.740322],
    [76.787643, 30.738327],
    [76.784927, 30.736627],
    [76.784733, 30.736721],
    [76.78409, 30.73747],
    [76.783768, 30.737864],
    [76.783639, 30.738024],
    [76.783035, 30.738817],
    [76.782517, 30.739146],
    [76.781874, 30.739334],
    [76.781694, 30.739551],
  ],
  // Panjab University to Sector 34 (Vidya Path)
  [
    [76.767073, 30.760233],
    [76.768999, 30.757969],
    [76.767398, 30.756917],
    [76.767646, 30.756565],
    [76.768818, 30.754961],
    [76.766696, 30.753153],
    [76.76486, 30.751951],
    [76.764864, 30.751808],
    [76.764775, 30.751664],
    [76.764583, 30.751576],
    [76.764406, 30.75159],
    [76.764079, 30.751516],
    [76.759543, 30.748704],
    [76.754227, 30.745432],
    [76.753968, 30.745038],
    [76.753971, 30.744815],
    [76.754358, 30.744259],
    [76.756866, 30.740909],
    [76.758111, 30.739372],
    [76.758414, 30.739257],
    [76.758552, 30.739115],
    [76.758577, 30.739002],
    [76.758603, 30.738633],
    [76.75978, 30.737091],
    [76.761562, 30.734835],
    [76.762611, 30.733534],
    [76.763004, 30.73331],
    [76.76315, 30.733266],
    [76.763279, 30.733133],
    [76.763313, 30.733012],
    [76.763334, 30.732688],
    [76.763612, 30.73226],
    [76.767937, 30.726959],
    [76.76815, 30.726801],
    [76.768487, 30.726752],
    [76.768782, 30.726551],
    [76.768823, 30.726213],
    [76.768876, 30.725858],
    [76.769716, 30.724849],
    [76.772853, 30.721223],
    [76.773283, 30.72092],
    [76.773525, 30.720923],
    [76.773733, 30.72082],
    [76.773861, 30.720489],
    [76.773784, 30.720321],
    [76.773548, 30.720176],
    [76.773123, 30.720241],
    [76.772636, 30.719988],
    [76.770418, 30.718596],
  ],
];

const INITIAL_SEGMENT_HEALTH = [100, 80, 60, 95];

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
        route: ['Madhya Marg', 'Dakshin Marg', 'Jan Marg', 'Vidya Path'][routeIndex],
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
      name: `${['Madhya Marg', 'Dakshin Marg', 'Jan Marg', 'Vidya Path'][idx]} Corridor`,
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
    fireToast('detect', '🔍 BUS-001: Road Anomaly Detected  ·  Confidence: 94%  ·  Madhya Marg');

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
      // Drop Madhya Marg segment health sharply
      const seg42 = this.segments.find(s => s.id === 'SEG-001');
      if (seg42) seg42.healthScore = Math.max(28, seg42.healthScore - 22);

      store.setEvents([...this.events]);
      store.setSegments([...this.segments]);
      fireToast('verified', '🚨 VERIFIED INCIDENT  ·  2 buses confirmed  ·  Madhya Marg Health: 100 → 78  ·  ETA +8 min');
    }, 10000));

    // ── Step 5 (12s): AI Action Center slides in ────────────────────────────
    this.storyTimers.push(setTimeout(() => {
      onStep(5);
      fireToast('action', '🤖 AI Engine: Priority Road Intervention on Madhya Marg Corridor  ·  Dispatching crew');
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
