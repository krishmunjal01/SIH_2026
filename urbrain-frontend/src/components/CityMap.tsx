import React, { useState, useMemo } from 'react';
import Map from 'react-map-gl/maplibre';
import { Maximize2, X } from 'lucide-react';
import DeckGL from '@deck.gl/react';
import { WebMercatorViewport } from '@deck.gl/core';
import { IconLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useUrbrainStore } from '../store/useUrbrainStore';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Fix for Vite production build Web Worker issues
setWorkerUrl(workerUrl);


// Free light basemap from CartoDB (no API key required)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Removed SECTORS array as it is no longer used for PolygonLayer

// Removed local INITIAL_VIEW_STATE in favor of global store

// SVG string for the navigation arrow (Google Maps style)
const NAV_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" stroke-width="2"/>
  <path d="M32 14 L48 46 L32 38 L16 46 Z" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linejoin="round"/>
</svg>
`;
const NAV_ICON_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(NAV_ICON_SVG)}`;

export default function CityMap() {
  const buses = useUrbrainStore(state => state.buses);
  const events = useUrbrainStore(state => state.events);
  const segments = useUrbrainStore(state => state.segments);
  const activeIncident = useUrbrainStore(state => state.activeIncident);
  const viewState = useUrbrainStore(state => state.viewState);
  const setViewState = useUrbrainStore(state => state.setViewState);
  const is3DMode = useUrbrainStore(state => state.is3DMode);
  const setSelectedBus = useUrbrainStore(state => state.setSelectedBus);
  const selectedEvent = useUrbrainStore(state => state.selectedEvent);
  const setSelectedEvent = useUrbrainStore(state => state.setSelectedEvent);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [dispatchState, setDispatchState] = useState<'idle' | 'confirm' | 'loading' | 'success'>('idle');

  const viewport = useMemo(() => new WebMercatorViewport(viewState), [viewState]);

  let popupX = 0;
  let popupY = 0;
  let isTopAnchor = false;
  
  if (selectedEvent) {
    const projected = viewport.project([selectedEvent.longitude, selectedEvent.latitude]);
    popupX = projected[0];
    popupY = projected[1];
    isTopAnchor = popupY < 380;
  }

  const layers: any[] = [
    is3DMode 
      ? new ScenegraphLayer({
          id: 'buses-3d-layer',
          data: buses,
          pickable: true,
          scenegraph: '/scene.glb',
          getPosition: d => [d.longitude, d.latitude, 0],
          getOrientation: d => [0, -d.heading + 180, 90], // Flipped 180 degrees so they face forward (the model was natively pointing South)
          getTranslation: [-1.2, 0, 0], // Shift the visual model left by 1.2 units to fix off-center origin in the .glb file
          sizeScale: 20, // Increased size because this new model has a different native scale
          _lighting: 'pbr', // Restored PBR lighting so textures and materials render correctly!
          onClick: (info: any) => { if (info.object) setSelectedBus(info.object); },
          transitions: {
            getPosition: { duration: 1000, easing: (t: number) => t }
            // Removed getOrientation transition to prevent 180-degree gimbal lock bugs when turning around
          }
        })
      : new IconLayer({
          id: 'buses-layer',
      data: buses,
      pickable: true,
      onClick: (info: any) => { if (info.object) setSelectedBus(info.object); },
      iconAtlas: NAV_ICON_URL,
      iconMapping: {
        bus: { x: 0, y: 0, width: 64, height: 64, anchorX: 32, anchorY: 32 }
      },
      getIcon: () => 'bus',
      sizeScale: 1,
      getPosition: (d) => [d.longitude, d.latitude],
      getSize: () => 40,
      getColor: (d) => d.status === 'SEARCHING' ? [245, 158, 11] : [59, 130, 246], // Amber if searching, else blue
      getAngle: (d) => -d.heading,
      transitions: {
        getPosition: {
          duration: 1000,
          easing: (t: number) => t
        },
        getAngle: {
          duration: 1000,
          easing: (t: number) => t
        }
      }
    }),
    new IconLayer({
      id: 'events-layer',
      data: events,
      pickable: true,
      onClick: (info: any) => { if (info.object) setSelectedEvent(info.object); },
      iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
      iconMapping: {
        marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
      },
      getIcon: () => 'marker',
      sizeScale: 15,
      getPosition: (d) => [d.longitude, d.latitude],
      getSize: () => 2,
      getColor: (d) => d.severity === 'HIGH' ? [239, 68, 68] : (d.severity === 'MEDIUM' ? [245, 158, 11] : [16, 185, 129])
    }),
    new PathLayer({
      id: 'segments-glow-layer',
      data: segments,
      pickable: false,
      widthScale: 1,
      widthMinPixels: 8,
      widthMaxPixels: 15,
      jointRounded: true,
      capRounded: true,
      getPath: d => d.path,
      getColor: d => {
        if (d.healthScore > 80) return [16, 185, 129, 40]; // Green glow
        if (d.healthScore > 50) return [245, 158, 11, 40]; // Amber glow
        return [239, 68, 68, 40]; // Red glow
      },
      getWidth: () => 10
    }),
    new PathLayer({
      id: 'segments-layer',
      data: segments,
      pickable: true,
      widthScale: 1,
      widthMinPixels: 2,
      widthMaxPixels: 5,
      jointRounded: true,
      capRounded: true,
      getPath: d => d.path,
      getColor: d => {
        if (d.healthScore > 80) return [16, 185, 129, 200]; // Green core
        if (d.healthScore > 50) return [245, 158, 11, 200]; // Amber core
        return [239, 68, 68, 200]; // Red core
      },
      getWidth: () => 3
    })
  ];

  // Temporarily removed the placeholder GeoJson building layer 
  // as it may have been causing WebGL crashes due to invalid geometry types.

  if (activeIncident && activeIncident.active) {
    layers.push(
      new ScatterplotLayer({
        id: 'ghost-radius-layer',
        data: [activeIncident],
        pickable: false,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 1000, // multiply km to meters
        radiusMinPixels: 1,
        radiusMaxPixels: 10000,
        lineWidthMinPixels: 2,
        getPosition: d => [d.longitude, d.latitude],
        getRadius: d => d.radius, // in km
        getFillColor: [239, 68, 68, 30], // transparent red
        getLineColor: [239, 68, 68, 200],
        transitions: {
          getRadius: {
            duration: 1000,
            easing: (t: number) => t
          }
        }
      })
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as any)}
        controller={true}
        layers={layers}
        style={{ position: 'absolute' }}
        getTooltip={({ object }) => {
          if (!object) return null;
          if (object.route) return `Bus: ${object.id}\nSpeed: ${Math.round(object.speed)} km/h`;
          if (object.name) return `Route: ${object.name}\nHealth: ${Math.round(object.healthScore)}%`;
          return `Event: ${object.type}\nSeverity: ${object.severity}`;
        }}
      >
        <Map 
          mapStyle={MAP_STYLE} 
          style={{ width: '100vw', height: '100vh' }}
          transformRequest={(url, resourceType) => {
            // On Vercel, the Protomaps public demo key gets a 403 Forbidden because it's restricted to localhost.
            // We use a Vercel Serverless Function proxy (/api/protomaps) to bypass this restriction for the demo!
            if (url.includes('protomaps.com') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              return { url: `/api/protomaps?url=${encodeURIComponent(url)}` };
            }
            return { url };
          }}
          onLoad={(e) => {
            const map = e.target;
            if (!map.getSource('openmaptiles')) {
              map.addSource('openmaptiles', {
                type: 'vector',
                url: 'https://api.protomaps.com/tiles/v3.json?key=1003762824b9687f' // public demo key
              });
              map.addLayer({
                id: '3d-buildings',
                source: 'openmaptiles',
                'source-layer': 'buildings',
                type: 'fill-extrusion',
                paint: {
                  'fill-extrusion-color': '#E2E8F0', // Frosted silver for light theme
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': 0,
                  'fill-extrusion-opacity': 0.75,
                }
              });
            }
          }}
        />
      </DeckGL>

      {/* Custom Projected Popup Overlay (guarantees clickability above DeckGL) */}
      {selectedEvent && (
        <div 
          className="absolute z-50 pointer-events-auto transition-transform duration-300 ease-out"
          style={{ 
            left: popupX, 
            top: popupY, 
            transform: isTopAnchor ? 'translate(-50%, 15px)' : 'translate(-50%, -100%)',
            marginTop: isTopAnchor ? '0' : '-15px' 
          }}
        >
          <div className="relative">
            {/* Close button — hidden during loading/success */}
            {dispatchState !== 'loading' && dispatchState !== 'success' && (
              <button 
                onClick={(e) => { e.stopPropagation(); setDispatchState('idle'); setSelectedEvent(null); }}
                className="absolute -top-3 -right-3 z-10 p-1.5 bg-gray-900/80 hover:bg-black rounded-full text-white shadow-lg cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            )}

            <div 
              className="w-80 bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-xl overflow-hidden flex flex-col cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedEvent.imageUrl && (
                <div 
                  className="relative h-36 w-full group cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setFullScreenImage(selectedEvent.imageUrl!); }}
                >
                  <img src={selectedEvent.imageUrl} alt="Road Anomaly" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent"></div>
                  
                  {/* Expand icon on hover */}
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={16} />
                  </div>
                  <div className="absolute bottom-3 left-4 text-white">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full shadow-sm ${selectedEvent.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-white/90">{selectedEvent.severity} SEVERITY</span>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight text-white tracking-wide">Road {selectedEvent.type}</h3>
                  </div>
                </div>
              )}
              <div className="p-4 bg-white/60">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-5">
                  <div>
                    <div className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-0.5">Confidence</div>
                    <div className="font-semibold text-gray-900 flex items-center">
                      <span className="text-blue-600 mr-1">🎯</span> {selectedEvent.confidence}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-0.5">Reported By</div>
                    <div className="font-semibold text-gray-900 flex items-center">
                      <span className="text-blue-600 mr-1">🚌</span> {selectedEvent.busId}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-0.5">Verified By</div>
                    <div className="font-semibold text-gray-900 flex items-center">
                      <span className="text-blue-600 mr-1">✔️</span> {selectedEvent.verifyingBuses.length} Buses
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-0.5">Time</div>
                    <div className="font-semibold text-gray-900 flex items-center">
                      <span className="text-blue-600 mr-1">🕒</span> {new Date(selectedEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* ── 4-State Dispatch Footer ────────────────────────── */}
                <div className="transition-all duration-300">

                  {/* State 1: IDLE */}
                  {dispatchState === 'idle' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDispatchState('confirm'); }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg transition-all shadow-sm tracking-wide cursor-pointer"
                    >
                      🔧 Dispatch Repair Crew
                    </button>
                  )}

                  {/* State 2: CONFIRM */}
                  {dispatchState === 'confirm' && (
                    <div className="space-y-2">
                      <p className="text-center text-xs text-gray-500 font-medium">
                        ⚠️ Confirm dispatch to <span className="font-bold text-gray-800">{selectedEvent.busId}'s route</span>?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDispatchState('idle'); }}
                          className="flex-1 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold text-sm rounded-lg transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDispatchState('loading');
                            // Simulate API call, then show success
                            setTimeout(() => {
                              setDispatchState('success');
                              // Auto-close after success
                              setTimeout(() => {
                                setDispatchState('idle');
                                setSelectedEvent(null);
                              }, 2500);
                            }, 1800);
                          }}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          Confirm 🚨
                        </button>
                      </div>
                    </div>
                  )}

                  {/* State 3: LOADING */}
                  {dispatchState === 'loading' && (
                    <div className="w-full py-2.5 bg-amber-500 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 tracking-wide">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Contacting Crew...
                    </div>
                  )}

                  {/* State 4: SUCCESS */}
                  {dispatchState === 'success' && (
                    <div className="w-full py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 tracking-wide shadow-sm animate-pulse">
                      ✅ Crew Dispatched · ETA 12 min
                    </div>
                  )}

                </div>
              </div>
            </div>
            
            {/* Triangle pointer pointing to the marker */}
            {isTopAnchor ? (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 transform rotate-45 shadow-sm"></div>
            ) : (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 border-b border-r border-gray-200 transform rotate-45 shadow-sm"></div>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-12 animate-in fade-in duration-200 pointer-events-auto cursor-default"
          onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
            className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
          >
            <X size={28} />
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full Screen Anomaly" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
