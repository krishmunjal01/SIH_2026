import { useUrbrainStore } from '../../store/useUrbrainStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Cpu, Thermometer, Wifi, Camera, Activity, Maximize2, Eye, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Simulated camera feed images (replace with real RTSP stream URLs when available)
const CAMERA_FEEDS = {
  front: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1280&h=720&fit=crop',
  left:  'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=1280&h=720&fit=crop',
  right: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280&h=720&fit=crop',
  rear:  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1280&h=720&fit=crop',
  cabin: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1280&h=720&fit=crop',
};

const CAMERA_LABELS = [
  { key: 'front', label: 'FRONT CAM', color: '#3b82f6' },
  { key: 'left',  label: 'LEFT CAM',  color: '#10b981' },
  { key: 'right', label: 'RIGHT CAM', color: '#10b981' },
  { key: 'rear',  label: 'REAR CAM',  color: '#f59e0b' },
  { key: 'cabin', label: 'CABIN CAM', color: '#8b5cf6' },
];

// Simulated YOLO bounding boxes for Front Cam (these will be replaced by real WebSocket data from the friend's model)
const SIMULATED_DETECTIONS = [
  { label: 'Pothole', confidence: 94, x: 35, y: 55, w: 18, h: 10, color: '#ef4444' },
  { label: 'Crack',   confidence: 87, x: 60, y: 65, w: 12, h:  7, color: '#f59e0b' },
];

interface Detection {
  label: string;
  confidence: number;
  x: number; // percent
  y: number;
  w: number;
  h: number;
  color: string;
}

function FrontCamOverlay({ liveDetections }: { liveDetections: Detection[] }) {
  const [visible, setVisible] = useState(true);
  const [activeBoxes, setActiveBoxes] = useState<Detection[]>([]);

  // Simulate YOLO detections appearing/disappearing every few seconds
  useEffect(() => {
    const cycle = () => {
      const count = Math.floor(Math.random() * 2) + 1;
      setActiveBoxes(SIMULATED_DETECTIONS.slice(0, count));
      setVisible(true);
      setTimeout(() => setVisible(false), 2000 + Math.random() * 2000);
    };
    cycle();
    const interval = setInterval(cycle, 4000);
    return () => clearInterval(interval);
  }, []);

  // Prefer real detections from the friend's model over simulated ones
  const boxes = liveDetections.length > 0 ? liveDetections : (visible ? activeBoxes : []);

  return (
    <>
      {boxes.map((box, i) => (
        <motion.div
          key={`${box.label}-${i}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute pointer-events-none"
          style={{
            left: `${box.x}%`, top: `${box.y}%`,
            width: `${box.w}%`, height: `${box.h}%`,
            border: `2px solid ${box.color}`,
            borderRadius: 3,
          }}
        >
          {/* Label tag */}
          <div
            className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap rounded-sm"
            style={{ background: box.color, color: '#fff' }}
          >
            {box.label} {box.confidence}%
          </div>
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: box.color }} />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: box.color }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: box.color }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: box.color }} />
        </motion.div>
      ))}
    </>
  );
}

function CabinCamOverlay() {
  const [drowsy, setDrowsy] = useState(false);

  // Simulate occasional drowsiness alert for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setDrowsy(prev => !prev);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 right-4">
      <AnimatePresence mode="wait">
        {drowsy ? (
          <motion.div
            key="alert"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center space-x-2 bg-critical/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-critical"
          >
            <AlertTriangle size={16} className="text-white animate-pulse" />
            <span className="text-sm font-bold text-white">⚠️ DROWSINESS DETECTED — Driver Safety Alert</span>
          </motion.div>
        ) : (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-healthy/40"
          >
            <Eye size={16} className="text-healthy" />
            <span className="text-sm font-bold text-healthy">DRIVER MONITORING: ATTENTIVE ✅</span>
            <span className="ml-auto text-xs text-gray-400">Eye Closure: 12% · Head Pose: Normal</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --------------- Main Component ---------------
export default function CameraMatrixPanel() {
  const selectedBus   = useUrbrainStore(state => state.selectedBus);
  const setSelectedBus = useUrbrainStore(state => state.setSelectedBus);

  const [expandedCamera, setExpandedCamera] = useState<string | null>(null);
  // Live detections from the friend's model (received via WebSocket)
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to backend WebSocket to receive LIVE detections from the friend's YOLO model
  useEffect(() => {
    if (!selectedBus) return;
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/detections');
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.detections) setLiveDetections(data.detections);
        } catch (_) {}
      };
      ws.onerror = () => { /* Silently fall back to simulated detections */ };
    } catch (_) {}
    return () => { wsRef.current?.close(); };
  }, [selectedBus]);

  // ESC key to close expanded view
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedCamera(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      {/* ─── Expanded Full-Screen Camera Modal ─── */}
      <AnimatePresence>
        {expandedCamera && selectedBus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700/50 bg-navy/80 shrink-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-critical animate-pulse" />
                  <span className="text-sm font-bold text-white tracking-wider">LIVE</span>
                </div>
                <span className="text-base font-bold text-white">{selectedBus.id}</span>
                <span className="text-sm text-gray-400">—</span>
                <span className="text-sm font-bold text-accent">
                  {CAMERA_LABELS.find(c => c.key === expandedCamera)?.label}
                </span>
                {expandedCamera === 'front' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">🤖 AI DETECTION ACTIVE</span>
                )}
              </div>
              <div className="flex items-center space-x-6 text-xs text-gray-400">
                <div className="flex items-center space-x-1.5"><Activity size={13} className="text-accent" /><span>{selectedBus.speed.toFixed(0)} km/h</span></div>
                <div className="flex items-center space-x-1.5"><Cpu size={13} className="text-warning" /><span>GPU 62°C</span></div>
                <div className="flex items-center space-x-1.5"><Wifi size={13} className="text-healthy" /><span>5G · 42ms</span></div>
                <button onClick={() => setExpandedCamera(null)} className="ml-4 p-2 rounded-lg bg-gray-800 hover:bg-critical/30 text-gray-400 hover:text-critical transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="flex-1 relative overflow-hidden">
              <img
                src={CAMERA_FEEDS[expandedCamera as keyof typeof CAMERA_FEEDS]}
                alt={expandedCamera}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Scanline */}
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)' }}
              />
              {/* YOLO Overlay on Front Cam */}
              <AnimatePresence>
                {expandedCamera === 'front' && <FrontCamOverlay liveDetections={liveDetections} />}
              </AnimatePresence>
              {/* Driver monitoring on Cabin Cam */}
              {expandedCamera === 'cabin' && <CabinCamOverlay />}
              {/* Timestamp */}
              <div className="absolute top-4 right-4 font-mono text-xs text-white/60 bg-black/40 px-2 py-1 rounded">
                {new Date().toLocaleTimeString()} IST
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom Camera Matrix Panel ─── */}
      <AnimatePresence>
        {selectedBus && !expandedCamera && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-x-4 bottom-4 z-50 bg-navy/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 bg-charcoal/50">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-healthy animate-pulse" />
                  <h2 className="text-base font-bold tracking-wider text-white">{selectedBus.id}</h2>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent font-mono">{selectedBus.route}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-healthy/20 text-healthy">{selectedBus.status}</span>
              </div>
              <div className="flex items-center space-x-6 text-xs text-gray-400">
                <div className="flex items-center space-x-1.5"><Activity size={13} className="text-accent" /><span>{selectedBus.speed.toFixed(0)} km/h</span></div>
                <div className="flex items-center space-x-1.5"><Cpu size={13} className="text-warning" /><span>GPU 62°C</span></div>
                <div className="flex items-center space-x-1.5"><Thermometer size={13} className="text-critical" /><span>CPU 54°C</span></div>
                <div className="flex items-center space-x-1.5"><Wifi size={13} className="text-healthy" /><span>5G · 42ms</span></div>
                <div className="flex items-center space-x-1.5"><Camera size={13} className="text-accent" /><span>{selectedBus.cameras} Active</span></div>
                <button onClick={() => setSelectedBus(null)} className="ml-2 p-1.5 rounded-lg bg-gray-800 hover:bg-critical/30 text-gray-400 hover:text-critical transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 5-Camera Grid */}
            <div className="p-4">
              <div className="grid grid-cols-5 gap-3" style={{ height: '220px' }}>
                {CAMERA_LABELS.map((cam, idx) => (
                  <motion.div
                    key={cam.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => setExpandedCamera(cam.key)}
                    className="relative rounded-xl overflow-hidden border border-gray-700/40 cursor-pointer hover:border-accent/60 transition-all group"
                  >
                    <img src={CAMERA_FEEDS[cam.key as keyof typeof CAMERA_FEEDS]} alt={cam.label} className="w-full h-full object-cover" />
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {/* LIVE */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />
                      <span className="text-[10px] font-bold text-white tracking-wider">LIVE</span>
                    </div>
                    {/* AI badge on front cam */}
                    {cam.key === 'front' && (
                      <div className="absolute top-2 right-2 bg-accent/30 px-1.5 py-0.5 rounded-md">
                        <span className="text-[10px] font-bold text-accent">AI</span>
                      </div>
                    )}
                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Video size={11} style={{ color: cam.color }} />
                        <span className="text-[10px] font-bold text-white">{cam.label}</span>
                      </div>
                    </div>
                    {/* Hover expand overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center space-x-2 bg-accent/80 px-3 py-1.5 rounded-lg">
                        <Maximize2 size={14} className="text-white" />
                        <span className="text-xs font-bold text-white">Expand</span>
                      </div>
                    </div>
                    {/* Scanline */}
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                      style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
