import React from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIActionCenter() {
  const { segments, events } = useUrbrainStore();

  const criticalSegments = segments.filter(s => s.healthScore < 50);
  const criticalEvents = events.filter(e => e.severity === 'HIGH' && e.status === 'VERIFIED');

  // Only show if there is something critical
  if (criticalSegments.length === 0 && criticalEvents.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="absolute bottom-8 right-6 w-96 bg-charcoal/95 backdrop-blur-xl border-l-4 border-l-accent border-y border-r border-gray-700 rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] p-5 z-40"
    >
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="text-accent" size={18} />
        <h3 className="text-gray-100 font-bold text-sm tracking-widest uppercase">AI Action Engine</h3>
      </div>
      
      <div className="text-sm text-gray-300 mb-4 leading-relaxed">
        Multiple edge nodes have verified a critical infrastructure degradation on <strong className="text-white">{criticalSegments[0]?.name || 'a major route'}</strong>. 
        Traffic flow has decreased by 60%.
      </div>

      <button className="w-full bg-accent hover:bg-blue-600 text-white text-sm font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-between group">
        <span>Dispatch Rapid Response Team</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
}
