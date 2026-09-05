import React from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { AlertTriangle, Activity } from 'lucide-react';

export default function RoadIntelligencePanel() {
  const { segments } = useUrbrainStore();

  // Sort segments by health (worst first)
  const criticalSegments = [...segments].sort((a, b) => a.healthScore - b.healthScore).slice(0, 3);

  if (segments.length === 0) return null;

  return (
    <div className="absolute top-20 right-6 w-80 bg-navy/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-5 z-40">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="text-accent" size={20} />
        <h2 className="text-white font-semibold tracking-wide">ROAD INTELLIGENCE</h2>
      </div>

      <div className="space-y-4">
        {criticalSegments.map((seg) => (
          <div key={seg.id} className="bg-charcoal/50 rounded-xl p-3 border border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-gray-200">{seg.name}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                seg.healthScore > 80 ? 'bg-healthy/20 text-healthy' :
                seg.healthScore > 50 ? 'bg-warning/20 text-warning' :
                'bg-critical/20 text-critical'
              }`}>
                {Math.round(seg.healthScore)}% HEALTH
              </span>
            </div>
            
            {seg.healthScore < 50 && (
              <div className="flex items-center space-x-2 text-critical mt-2 text-xs">
                <AlertTriangle size={14} />
                <span>Priority Maintenance Required</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
