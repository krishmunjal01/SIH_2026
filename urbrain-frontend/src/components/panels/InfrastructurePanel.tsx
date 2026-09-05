import React from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { Route as RouteIcon, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function InfrastructurePanel() {
  const { segments } = useUrbrainStore();

  return (
    <div className="absolute top-20 right-6 w-96 max-h-[80vh] flex flex-col bg-navy/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-5 z-40 animate-in fade-in slide-in-from-right-10 duration-500">
      
      <div className="flex items-center space-x-3 mb-6">
        <RouteIcon className="text-accent" size={24} />
        <h2 className="text-white font-semibold tracking-wide text-lg">INFRASTRUCTURE HEALTH</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {segments.map((seg) => (
          <div key={seg.id} className="bg-charcoal/80 rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-start mb-3">
              <span className="font-semibold text-gray-200">{seg.name}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                seg.healthScore > 80 ? 'bg-healthy/20 text-healthy' :
                seg.healthScore > 50 ? 'bg-warning/20 text-warning' :
                'bg-critical/20 text-critical'
              }`}>
                {Math.round(seg.healthScore)}% HEALTH
              </span>
            </div>
            
            <div className="w-full bg-gray-900 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  seg.healthScore > 80 ? 'bg-healthy' : seg.healthScore > 50 ? 'bg-warning' : 'bg-critical'
                }`}
                style={{ width: `${seg.healthScore}%` }}
              ></div>
            </div>

            {seg.healthScore > 80 ? (
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <ShieldCheck size={14} className="text-healthy" />
                <span>Corridor operating optimally.</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <AlertTriangle size={14} className={seg.healthScore < 50 ? 'text-critical' : 'text-warning'} />
                <span>Structural degradation detected on route.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
