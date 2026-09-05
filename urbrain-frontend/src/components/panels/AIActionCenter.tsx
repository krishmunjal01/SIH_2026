import { useState } from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { Sparkles, ArrowRight, MapPin, FileText, CheckCircle2, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIActionCenter() {
  const { segments, events } = useUrbrainStore();
  const [dispatched, setDispatched] = useState(false);
  const [flagged, setFlagged]       = useState(false);
  const [reported, setReported]     = useState(false);

  const verifiedHigh = events.filter(e => e.severity === 'HIGH' && e.status === 'VERIFIED');
  const criticalSegs = [...segments].filter(s => s.healthScore < 85).sort((a, b) => a.healthScore - b.healthScore);

  if (verifiedHigh.length === 0 && criticalSegs.length === 0) return null;

  const worstSeg   = criticalSegs[0];
  const prevHealth = Math.min(100, Math.round((worstSeg?.healthScore ?? 52) + 22));
  const curHealth  = Math.round(worstSeg?.healthScore ?? 52);
  const delta      = prevHealth - curHealth;
  const etaDelta   = delta > 15 ? 8 : delta > 8 ? 4 : 2;
  const etaBase    = '10:45 AM';
  const etaRevised = etaDelta === 8 ? '10:53 AM' : etaDelta === 4 ? '10:49 AM' : '10:47 AM';

  return (
    <AnimatePresence>
      <motion.div
        key={`ai-card-${worstSeg?.id}`}
        initial={{ opacity: 0, x: 60, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 60 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="absolute bottom-8 right-6 w-96 bg-navy/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] overflow-hidden z-40"
      >
        {/* Accent top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-accent via-blue-400 to-accent" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-accent" size={16} />
              <span className="text-gray-100 font-bold text-xs tracking-widest uppercase">AI Action Engine</span>
            </div>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center space-x-1.5 bg-critical/20 px-2 py-0.5 rounded-full border border-critical/40"
            >
              <div className="w-1.5 h-1.5 bg-critical rounded-full" />
              <span className="text-[10px] font-bold text-critical tracking-wider">CRITICAL</span>
            </motion.div>
          </div>

          {/* Cause Chain */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-start space-x-2.5 bg-charcoal/60 rounded-xl p-3 border border-gray-800">
              <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Road Defect Verified</p>
                <p className="text-sm text-gray-100 font-medium">
                  {verifiedHigh.length} edge node{verifiedHigh.length > 1 ? 's' : ''} confirmed defect on{' '}
                  <span className="text-white font-bold">{worstSeg?.name ?? 'Route 42 Corridor'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-charcoal/60 rounded-xl p-3 border border-gray-800">
              <TrendingDown size={14} className="text-critical mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Health Degradation</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400 font-mono">{prevHealth}%</span>
                  <ArrowRight size={12} className="text-critical" />
                  <motion.span
                    key={curHealth}
                    initial={{ color: '#ef4444' }}
                    animate={{ color: '#f3f4f6' }}
                    transition={{ duration: 1.2 }}
                    className="text-sm font-bold font-mono"
                  >
                    {curHealth}%
                  </motion.span>
                  <span className="text-xs text-critical font-bold">−{delta}pts</span>
                </div>
                {/* Mini health bar */}
                <div className="mt-1.5 w-full bg-gray-900 rounded-full h-1">
                  <motion.div
                    initial={{ width: `${prevHealth}%` }}
                    animate={{ width: `${curHealth}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-1 rounded-full bg-critical"
                  />
                </div>
              </div>
            </div>

            {/* ETA Impact Panel */}
            <div className="flex items-start space-x-2.5 bg-charcoal/60 rounded-xl p-3 border border-gray-800">
              <Clock size={14} className="text-warning mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="text-xs text-gray-400 mb-1.5">Route 42 ETA Impact</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Expected</p>
                    <p className="text-sm font-mono font-bold text-gray-300">{etaBase}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight size={16} className="text-critical" />
                    <span className="text-[10px] text-critical font-bold mt-0.5">+{etaDelta} min</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Revised</p>
                    <p className="text-sm font-mono font-bold text-critical">{etaRevised}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prescriptive Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setDispatched(true)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                dispatched
                  ? 'bg-healthy/20 border border-healthy/40 text-healthy'
                  : 'bg-critical/20 border border-critical/40 text-critical hover:bg-critical/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                {dispatched ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{dispatched ? 'Repair Crew Dispatched ✓' : 'Dispatch Road Repair Crew'}</span>
              </div>
              {!dispatched && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
            </button>

            <div className="flex space-x-2">
              <button
                onClick={() => setFlagged(v => !v)}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  flagged
                    ? 'bg-warning/20 border-warning/40 text-warning'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                <MapPin size={13} />
                <span>{flagged ? 'Flagged ✓' : 'Flag on GIS'}</span>
              </button>

              <button
                onClick={() => setReported(v => !v)}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  reported
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                <FileText size={13} />
                <span>{reported ? 'Report Ready ✓' : 'Generate Report'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

