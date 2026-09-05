import { useEffect } from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, ShieldAlert, Sparkles, X } from 'lucide-react';

const TOAST_CONFIG = {
  detect: {
    icon: Search,
    bg: 'bg-accent/10 border-accent/40',
    iconColor: 'text-accent',
    dot: 'bg-accent',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.4)]',
    label: 'ANOMALY DETECTED',
    labelColor: 'text-accent',
  },
  verify: {
    icon: Clock,
    bg: 'bg-warning/10 border-warning/40',
    iconColor: 'text-warning',
    dot: 'bg-warning',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.35)]',
    label: 'VERIFYING',
    labelColor: 'text-warning',
  },
  verified: {
    icon: ShieldAlert,
    bg: 'bg-critical/10 border-critical/50',
    iconColor: 'text-critical',
    dot: 'bg-critical',
    glow: 'shadow-[0_0_40px_rgba(239,68,68,0.5)]',
    label: 'INCIDENT VERIFIED',
    labelColor: 'text-critical',
  },
  action: {
    icon: Sparkles,
    bg: 'bg-navy border-accent/60',
    iconColor: 'text-accent',
    dot: 'bg-accent',
    glow: 'shadow-[0_0_35px_rgba(59,130,246,0.5)]',
    label: 'AI ACTION',
    labelColor: 'text-accent',
  },
};

export default function ToastNotification() {
  const demoToast = useUrbrainStore(state => state.demoToast);
  const setDemoToast = useUrbrainStore(state => state.setDemoToast);

  useEffect(() => {
    if (!demoToast) return;
    const t = setTimeout(() => setDemoToast(null), 4500);
    return () => clearTimeout(t);
  }, [demoToast, setDemoToast]);

  const cfg = demoToast ? TOAST_CONFIG[demoToast.type] : null;
  const Icon = cfg?.icon ?? Search;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] pointer-events-none flex flex-col items-center">
      <AnimatePresence mode="wait">
        {demoToast && cfg && (
          <motion.div
            key={demoToast.id}
            initial={{ opacity: 0, y: -32, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`pointer-events-auto flex items-center space-x-3 px-5 py-3 rounded-2xl border backdrop-blur-xl ${cfg.bg} ${cfg.glow} max-w-xl`}
          >
            <div className="relative shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
            </div>
            <Icon size={16} className={`${cfg.iconColor} shrink-0`} />
            <div className="flex flex-col min-w-0">
              <span className={`text-[10px] font-black tracking-widest uppercase ${cfg.labelColor}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-gray-200 font-medium leading-snug mt-0.5 truncate">
                {demoToast.message}
              </span>
            </div>
            <button
              onClick={() => setDemoToast(null)}
              className="ml-2 shrink-0 text-gray-500 hover:text-gray-200 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
