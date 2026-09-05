import React from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { ShieldAlert, MapPin, AlertOctagon } from 'lucide-react';

export default function IncidentLogPanel() {
  const { events } = useUrbrainStore();

  return (
    <div className="absolute top-20 right-6 w-96 max-h-[80vh] flex flex-col bg-charcoal/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-5 z-40 animate-in fade-in slide-in-from-right-10 duration-500">
      
      <div className="flex items-center space-x-3 mb-6">
        <ShieldAlert className="text-critical" size={24} />
        <h2 className="text-white font-semibold tracking-wide text-lg">INCIDENT LOGS</h2>
        <span className="ml-auto bg-critical/20 text-critical text-xs font-bold px-2 py-1 rounded-full">
          {events.length} TOTAL
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-10">No critical incidents logged.</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className={`bg-gray-900/80 rounded-xl p-3 border-l-4 border-gray-800 transition-colors cursor-pointer group ${event.status === 'VERIFIED' ? 'border-l-critical' : 'border-l-warning animate-pulse-slow'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-gray-200 text-sm">{event.id}</span>
                <div className="flex space-x-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    event.status === 'VERIFIED' ? 'bg-critical/20 text-critical' : 'bg-warning/20 text-warning'
                  }`}>
                    {event.status}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    event.severity === 'HIGH' ? 'bg-critical/20 text-critical' : 'bg-warning/20 text-warning'
                  }`}>
                    {event.severity}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-300 font-semibold mb-2">
                <AlertOctagon size={12} className="text-warning" />
                <span>{event.type}</span>
              </div>

              <div className="flex items-center space-x-1 text-[11px] text-gray-500 font-mono">
                <MapPin size={10} />
                <span>{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
