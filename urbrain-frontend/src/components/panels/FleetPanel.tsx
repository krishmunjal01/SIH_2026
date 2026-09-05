import React from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { Bus, Navigation2 } from 'lucide-react';

export default function FleetPanel() {
  const { buses } = useUrbrainStore();

  return (
    <div className="absolute top-20 left-20 w-96 max-h-[80vh] flex flex-col bg-navy/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-5 z-40 animate-in fade-in slide-in-from-left-10 duration-500">
      
      <div className="flex items-center space-x-3 mb-6">
        <Bus className="text-accent" size={24} />
        <h2 className="text-white font-semibold tracking-wide text-lg">FLEET TELEMATICS</h2>
        <span className="ml-auto bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-full">
          {buses.length} ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {buses.map((bus) => (
          <div key={bus.id} className="bg-charcoal/80 rounded-xl p-3 border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer group">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono font-bold text-gray-200 group-hover:text-white transition-colors">{bus.id}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                bus.status === 'SEARCHING' ? 'bg-warning/20 text-warning animate-pulse' : 'bg-healthy/20 text-healthy'
              }`}>
                {bus.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Navigation2 size={14} className="text-gray-500" />
                <span>{Math.round(bus.heading)}&deg;</span>
              </div>
              <span className="font-mono text-gray-300">{(bus.speed * 3.6).toFixed(1)} km/h</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
