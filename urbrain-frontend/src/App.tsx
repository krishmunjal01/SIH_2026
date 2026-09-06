import { useEffect, useState } from 'react';
import { demoEngine } from './lib/demo-engine/DemoEngine';
import { useUrbrainStore } from './store/useUrbrainStore';
import CityMap from './components/CityMap';
import RoadIntelligencePanel from './components/panels/RoadIntelligencePanel';
import AIActionCenter from './components/panels/AIActionCenter';
import DemoController from './components/panels/DemoController';
import IncidentCommandPanel from './components/panels/IncidentCommandPanel';
import FleetPanel from './components/panels/FleetPanel';
import InfrastructurePanel from './components/panels/InfrastructurePanel';
import IncidentLogPanel from './components/panels/IncidentLogPanel';
import CameraMatrixPanel from './components/panels/CameraMatrixPanel';
import ToastNotification from './components/panels/ToastNotification';
import { LayoutDashboard, Bus, Map as MapIcon, Route, ShieldAlert, ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// const SOCKET_URL = 'http://localhost:8000';

function App() {
  const setConnected = useUrbrainStore(state => state.setConnected);
  const buses = useUrbrainStore(state => state.buses);
  const events = useUrbrainStore(state => state.events);
  const isConnected = useUrbrainStore(state => state.isConnected);
  const is3DMode = useUrbrainStore(state => state.is3DMode);
  const set3DMode = useUrbrainStore(state => state.set3DMode);
  const viewState = useUrbrainStore(state => state.viewState);
  const setViewState = useUrbrainStore(state => state.setViewState);
  const activeIncident = useUrbrainStore(state => state.activeIncident);
  
  const [showRightPanels, setShowRightPanels] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'map' | 'route' | 'incidents'>('dashboard');

  useEffect(() => {
    // Start the singleton DemoEngine
    demoEngine.start();
    setConnected(true);

    return () => {
      demoEngine.stop();
      setConnected(false);
    };
  }, [setConnected]);

  return (
    <div className="flex h-screen bg-charcoal text-white overflow-hidden font-sans">
      
      {/* Navigation Rail */}
      <nav className="w-16 flex flex-col items-center py-4 bg-navy border-r border-gray-800 z-50">
        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-8 font-bold text-lg">
          U
        </div>
        
        <div className="flex flex-col space-y-6">
          <NavItem icon={<LayoutDashboard size={24} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Bus size={24} />} active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
          <NavItem icon={<MapIcon size={24} />} active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <NavItem icon={<Route size={24} />} active={activeTab === 'route'} onClick={() => setActiveTab('route')} />
          <NavItem icon={<ShieldAlert size={24} />} active={activeTab === 'incidents'} onClick={() => setActiveTab('incidents')} />
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative">
        
        {/* Command Bar */}
        <header className="h-14 bg-charcoal/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6 z-40 absolute top-0 left-0 right-0">
          <div className="flex items-center space-x-4">
            <h1 className="font-semibold text-lg tracking-wide text-gray-200">CITY COMMAND</h1>
            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">LIVE URBAN INTELLIGENCE</span>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-healthy animate-pulse' : 'bg-critical'}`}></span>
              <span className="text-gray-400">NETWORK {isConnected ? '98.4%' : 'OFFLINE'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-mono text-accent">{buses.length}</span>
              <span className="text-gray-400 text-xs uppercase">Active Buses</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-mono text-warning">{events.length}</span>
              <span className="text-gray-400 text-xs uppercase">Alerts</span>
            </div>

            <div className="w-px h-6 bg-gray-700 mx-2"></div>
            
            <button 
              onClick={() => {
                const newMode = !is3DMode;
                set3DMode(newMode);
                setViewState({
                  ...viewState,
                  pitch: newMode ? 60 : 45,
                  bearing: newMode ? 30 : 0,
                  zoom: newMode ? 15.5 : 13
                });
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-bold transition-all duration-300 ${
                is3DMode 
                  ? 'bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${is3DMode ? 'bg-accent animate-pulse' : 'bg-gray-500'}`}></div>
              <span>{is3DMode ? '3D TWIN: ON' : '3D TWIN: OFF'}</span>
            </button>
          </div>
        </header>

        {/* 3D Map Area */}
        <div className="flex-1 relative w-full h-full">
          <CityMap />

          <AnimatePresence>
            {activeIncident && activeIncident.active && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 pointer-events-none shadow-[inset_0_0_250px_rgba(239,68,68,0.7)] z-10"
              />
            )}
          </AnimatePresence>
          
          {/* Conditionally Render Toggle Button ONLY for Dashboard tab */}
          {activeTab === 'dashboard' && (
            <button
              onClick={() => setShowRightPanels(!showRightPanels)}
              className="absolute top-1/2 right-0 -translate-y-1/2 bg-charcoal/90 border border-gray-700 border-r-0 rounded-l-xl p-2 z-50 text-gray-400 hover:text-white transition-colors"
            >
              {showRightPanels ? <ChevronRight size={24} /> : <div className="flex flex-col items-center"><Activity size={18} className="mb-1 text-accent"/><ChevronLeft size={24} /></div>}
            </button>
          )}

          {/* Conditional View Rendering */}
          {activeTab === 'dashboard' && showRightPanels && (
            <div className="absolute right-6 top-20 bottom-4 w-96 flex flex-col gap-4 overflow-y-auto pointer-events-none z-40 pb-20" style={{ scrollbarWidth: 'none' }}>
              <RoadIntelligencePanel />
              <AIActionCenter />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DemoController />
          )}

          {activeTab === 'fleet' && <FleetPanel />}
          {activeTab === 'route' && <InfrastructurePanel />}
          {activeTab === 'incidents' && <IncidentLogPanel />}

          <IncidentCommandPanel />
          <CameraMatrixPanel />
        </div>

          {/* Global toast — rendered outside the map div so it sits above everything */}
          <ToastNotification />

      </main>
    </div>
  );
}

function NavItem({ icon, active = false, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 rounded-xl transition-all duration-200 ${active ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
    >
      {icon}
    </button>
  );
}

export default App;
