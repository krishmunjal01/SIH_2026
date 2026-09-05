import React from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { FlyToInterpolator } from '@deck.gl/core';
import { Play, AlertOctagon, Target } from 'lucide-react';
import { demoEngine } from '../../lib/demo-engine/DemoEngine';

export default function DemoController() {
  const buses = useUrbrainStore(state => state.buses);
  const setViewState = useUrbrainStore(state => state.setViewState);

  const triggerPotholeSequence = () => {
    // 1. Find a bus to target (e.g., the first active one)
    const targetBus = buses[0];
    if (!targetBus) return;

    // 2. Command camera to fly to the bus with cinematic interpolation
    const currentState = useUrbrainStore.getState().viewState;
    setViewState({
      ...currentState,
      longitude: targetBus.longitude,
      latitude: targetBus.latitude,
      zoom: 17,
      pitch: 60,
      bearing: targetBus.heading,
      transitionDuration: 4000,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.2 })
    });

    // 3. Spawn a PENDING pothole at this bus's location after a slight delay
    // The delay gives the camera time to arrive before the event pops up.
    setTimeout(() => {
      demoEngine.triggerPotholeDetection(targetBus.id);
    }, 1500);
  };

  const triggerHitAndRunSequence = () => {
    // 1. Tell engine to spawn the incident and start growing the radius
    demoEngine.triggerHitAndRun();

    // 2. Fly camera to the epicenter (Sector 17 intersection)
    const currentState = useUrbrainStore.getState().viewState;
    setViewState({
      ...currentState,
      longitude: 76.7794,
      latitude: 30.7333,
      zoom: 15.5,
      pitch: 50,
      bearing: 20,
      transitionDuration: 4000,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.2 })
    });
  };

  const resetCamera = () => {
    demoEngine.clearHitAndRun();

    const currentState = useUrbrainStore.getState().viewState;
    setViewState({
      ...currentState,
      longitude: 76.7794,
      latitude: 30.7333,
      zoom: 13,
      pitch: 45,
      bearing: 0,
      transitionDuration: 3000,
      transitionInterpolator: new FlyToInterpolator()
    });
  };

  return (
    <div className="absolute bottom-8 left-20 bg-charcoal/90 backdrop-blur-md border border-gray-700/50 rounded-full shadow-2xl p-2 z-50 flex items-center space-x-2">
      <button 
        onClick={resetCamera}
        className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
      >
        Reset Camera
      </button>
      
      <div className="w-px h-6 bg-gray-700 mx-2"></div>
      
      <button 
        onClick={triggerPotholeSequence}
        className="flex items-center space-x-2 bg-warning/20 hover:bg-warning/30 text-warning text-xs font-bold py-2 px-4 rounded-full transition-colors"
      >
        <AlertOctagon size={14} />
        <span>Seq 1: Pothole</span>
      </button>

      <div className="w-px h-6 bg-gray-700 mx-2"></div>
      
      <button 
        onClick={triggerHitAndRunSequence}
        className="flex items-center space-x-2 bg-critical/20 hover:bg-critical/30 text-critical text-xs font-bold py-2 px-4 rounded-full transition-colors"
      >
        <Target size={14} />
        <span>Seq 2: Hit & Run</span>
      </button>
    </div>
  );
}
