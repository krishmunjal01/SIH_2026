import React from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { Target, CarFront, Radio } from 'lucide-react';

export default function IncidentCommandPanel() {
  const { activeIncident } = useUrbrainStore();

  if (!activeIncident || !activeIncident.active) return null;

  return (
    <div className="absolute bottom-24 left-6 w-80 bg-critical/10 backdrop-blur-xl border border-critical/50 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.2)] p-5 z-40 animate-in fade-in slide-in-from-bottom-10 duration-500">
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-critical">
          <Target className="animate-pulse" size={20} />
          <h2 className="font-bold tracking-widest text-sm uppercase">Incident Command</h2>
        </div>
        <span className="bg-critical text-white text-[10px] font-bold px-2 py-1 rounded-sm animate-pulse">
          HIT & RUN
        </span>
      </div>

      <div className="bg-charcoal/80 rounded-xl p-4 border border-gray-700/50 relative overflow-hidden">
        {/* Subtle scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent w-full h-[200%] animate-[scan_3s_ease-in-out_infinite]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center space-x-2 text-gray-400 text-xs font-mono mb-1">
            <CarFront size={14} />
            <span>SUSPECT VEHICLE PLATE (ANPR)</span>
          </div>
          
          <div className="bg-white px-4 py-2 rounded shadow-inner border-2 border-gray-300">
            <span className="font-mono text-xl font-bold text-black tracking-widest">
              {activeIncident.suspectPlate}
            </span>
          </div>

          <div className="flex w-full justify-between mt-3 text-xs border-t border-gray-700/50 pt-2">
            <span className="text-gray-400">OCR CONFIDENCE</span>
            <span className="text-healthy font-bold font-mono">98.4%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start space-x-3 text-sm text-gray-300 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
        <Radio className="text-warning mt-0.5 shrink-0" size={16} />
        <div>
          <p className="font-semibold text-white mb-1">Ghost Radius Expanding</p>
          <p className="text-xs">
            Nearby fleet nodes have automatically entered <span className="text-warning font-bold">SEARCHING</span> mode to locate suspect vehicle.
          </p>
        </div>
      </div>

    </div>
  );
}
