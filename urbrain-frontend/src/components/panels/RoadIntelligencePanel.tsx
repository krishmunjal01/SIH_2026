import React, { useEffect, useState } from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// A simple animated number component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    if (displayValue === value) return;
    
    const duration = 1200; // ms
    const steps = 30;
    const stepTime = duration / steps;
    const diff = value - displayValue;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(prev => prev + (diff / steps));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]); // intentionally omitting displayValue from deps to avoid re-triggering the effect

  return <span>{Math.round(displayValue)}</span>;
}

// Simulated sparkline component
function Sparkline({ color, degrading }: { color: string, degrading: boolean }) {
  // If degrading, dip the last point sharply
  const pts = degrading 
    ? "0,20 15,18 30,22 45,19 60,17 75,25 90,45" 
    : "0,20 15,18 30,22 45,19 60,17 75,15 90,16";
  
  return (
    <svg width="70" height="25" viewBox="0 0 90 50" className="opacity-80">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

export default function RoadIntelligencePanel() {
  const { segments, events } = useUrbrainStore();

  const criticalSegments = [...segments].sort((a, b) => a.healthScore - b.healthScore).slice(0, 3);
  
  if (segments.length === 0) return null;

  return (
    <div className="pointer-events-auto shrink-0 w-full self-end bg-navy/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-5">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="text-accent" size={20} />
        <h2 className="text-white font-semibold tracking-wide text-sm">ROAD INTELLIGENCE</h2>
      </div>

      <div className="space-y-3">
        {criticalSegments.map((seg) => {
          // Find if there are verified defects for this segment
          const segEvents = events.filter(e => e.status === 'VERIFIED');
          const defectCount = seg.name.includes('42') ? segEvents.length : 0;
          const degrading = seg.healthScore < 70;
          
          return (
            <motion.div 
              layout
              key={seg.id} 
              className={`bg-charcoal/70 rounded-xl p-3 border transition-colors ${degrading ? 'border-critical/40' : 'border-gray-800'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-200">{seg.name}</span>
                
                <div className={`flex items-center space-x-1.5 text-xs font-bold px-2 py-1 rounded-full ${
                  seg.healthScore > 80 ? 'bg-healthy/20 text-healthy' :
                  seg.healthScore > 50 ? 'bg-warning/20 text-warning' :
                  'bg-critical/20 text-critical'
                }`}>
                  {/* If degrading sharply in demo (health 52), show the previous score */}
                  {seg.healthScore === 52 && (
                    <>
                      <span className="opacity-60 line-through">74</span>
                      <ArrowRight size={10} />
                    </>
                  )}
                  <span><AnimatedNumber value={seg.healthScore} />%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-3">
                <div>
                  {defectCount > 0 ? (
                    <div className="flex items-center space-x-1.5 text-critical text-[10px] font-bold tracking-wider">
                      <AlertTriangle size={12} />
                      <span>{defectCount} VERIFIED DEFECT{defectCount > 1 ? 'S' : ''}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-healthy rounded-full" />
                      <span>Normal Wear</span>
                    </div>
                  )}
                </div>
                
                <Sparkline 
                  color={seg.healthScore > 80 ? '#10B981' : seg.healthScore > 50 ? '#F59E0B' : '#EF4444'} 
                  degrading={degrading}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
