import { useState } from 'react';
import { useUrbrainStore } from '../../store/useUrbrainStore';
import { FlyToInterpolator } from '@deck.gl/core';
import { AlertOctagon, Target, RotateCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { demoEngine } from '../../lib/demo-engine/DemoEngine';

const STEP_LABELS: Record<number, string> = {
  1: 'Step 1/5 Â· Camera fly + anomaly detection',
  2: 'Step 2/5 Â· PENDING pothole spawned',
  3: 'Step 3/5 Â· BUS-004 approaching location...',
  4: 'Step 4/5 Â· VERIFIED Â· Road health dropping',
  5: 'Step 5/5 Â· AI Action Engine activated',
};

export default function DemoController() {
  const setViewState = useUrbrainStore(state => state.setViewState);
  const [currentStep, setCurrentStep] = useState(0);

  const triggerPotholeSequence = () => {
    demoEngine.triggerPotholeStory((step) => setCurrentStep(step));
  };

  const triggerHitAndRunSequence = () => {
    demoEngine.triggerHitAndRun();
    const currentState = useUrbrainStore.getState().viewState;
    setViewState({
      ...currentState,
      longitude: 76.7794,
      latitude: 30.7333,
      zoom: 15.5,
      pitch: 50,
      bearing: 20,
      transitionDuration: 4000,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
    });
  };

  const resetAll = () => {
    setCurrentStep(0);
    demoEngine.resetAll();
  };

  return (
    <div className="absolute bottom-8 left-20 z-50 flex flex-col items-start space-y-2">
      {/* Live step indicator */}
      <AnimatePresence>
        {currentStep > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center space-x-2 bg-slate-50/90 backdrop-blur-md border border-accent/30 px-4 py-1.5 rounded-full text-xs font-mono text-accent shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-accent rounded-full"
            />
            <span>{STEP_LABELS[currentStep] ?? 'Demo running...'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button pill */}
      <div className="bg-slate-50/90 backdrop-blur-md border border-gray-200/50 rounded-full shadow-2xl p-2 flex items-center space-x-2">
        <button
          onClick={resetAll}
          className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-white rounded-full transition-colors flex items-center space-x-1.5"
        >
          <RotateCcw size={13} />
          <span>Reset All</span>
        </button>

        <div className="w-px h-6 bg-gray-700" />

        <button
          onClick={triggerPotholeSequence}
          disabled={currentStep > 0}
          className="flex items-center space-x-2 bg-warning/20 hover:bg-warning/30 disabled:opacity-40 disabled:cursor-not-allowed text-warning text-xs font-bold py-2 px-4 rounded-full transition-all"
        >
          <AlertOctagon size={14} />
          <span>Seq 1: Pothole</span>
          <ChevronRight size={12} />
        </button>

        <div className="w-px h-6 bg-gray-700" />

        <button
          onClick={triggerHitAndRunSequence}
          className="flex items-center space-x-2 bg-critical/20 hover:bg-critical/30 text-critical text-xs font-bold py-2 px-4 rounded-full transition-colors"
        >
          <Target size={14} />
          <span>Seq 2: Hit &amp; Run</span>
        </button>
      </div>
    </div>
  );
}
