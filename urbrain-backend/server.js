const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Chandigarh bounding box
const LAT_MIN = 30.7000;
const LAT_MAX = 30.7600;
const LON_MIN = 76.7500;
const LON_MAX = 76.8200;

function randomLatLon() {
  return {
    latitude: LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN),
    longitude: LON_MIN + Math.random() * (LON_MAX - LON_MIN)
  };
}

class DemoEngine {
  constructor() {
    this.buses = Array.from({ length: 300 }, (_, i) => this.initBus(`BUS-${String(i + 1).padStart(3, '0')}`));
    this.events = [];
  }

  initBus(id) {
    const pos = randomLatLon();
    return {
      id,
      route: `Route ${Math.floor(Math.random() * 50) + 1}`,
      latitude: pos.latitude,
      longitude: pos.longitude,
      speed: Math.floor(Math.random() * 60),
      status: "ACTIVE",
      edgeStatus: Math.random() > 0.05 ? "ONLINE" : "SYNCING",
      cameras: 5,
      heading: Math.floor(Math.random() * 360)
    };
  }

  generateEvents() {
    if (Math.random() > 0.7) {
      const bus = this.buses[Math.floor(Math.random() * this.buses.length)];
      const types = ["POTHOLE", "CONGESTION", "PEDESTRIAN_RISK", "HIT_AND_RUN"];
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = type === "HIT_AND_RUN" ? "HIGH" : ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)];
      
      const event = {
        id: `EVT-${Math.floor(Math.random() * 9000) + 1000}`,
        type,
        latitude: bus.latitude,
        longitude: bus.longitude,
        confidence: Math.floor(Math.random() * (98 - 85 + 1)) + 85,
        severity,
        busId: bus.id,
        timestamp: new Date().toISOString()
      };
      
      this.events.push(event);
      if (this.events.length > 100) {
        this.events.shift();
      }
    }
  }

  tick() {
    this.buses.forEach(bus => {
      if (bus.status === "ACTIVE") {
        bus.latitude += (Math.random() - 0.5) * 0.001;
        bus.longitude += (Math.random() - 0.5) * 0.001;
        bus.speed = Math.max(0, Math.min(80, bus.speed + Math.floor(Math.random() * 11) - 5));
        bus.heading = (bus.heading + Math.floor(Math.random() * 21) - 10 + 360) % 360;
      }
    });
    
    this.generateEvents();
    
    return {
      buses: this.buses,
      events: this.events.slice(-10)
    };
  }
}

const engine = new DemoEngine();

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

setInterval(() => {
  const data = engine.tick();
  io.emit('data', data);
}, 1000);

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`URBRAIN Demo Backend running on port ${PORT}`);
});
