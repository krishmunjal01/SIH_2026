// React imports removed as unused
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { IconLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useUrbrainStore } from '../store/useUrbrainStore';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Fix for Vite production build Web Worker issues
if ('setWorkerUrl' in maplibregl) {
  (maplibregl as any).setWorkerUrl(workerUrl);
} else if ('workerUrl' in maplibregl) {
  (maplibregl as any).workerUrl = workerUrl;
}


// Free dark basemap from CartoDB (no API key required)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

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

  const layers: any[] = [
    is3DMode 
      ? new ScenegraphLayer({
          id: 'buses-3d-layer',
          data: buses,
          pickable: true,
          scenegraph: '/scene.glb',
          getPosition: d => [d.longitude, d.latitude, 0],
          getOrientation: d => [0, -d.heading + 180, 90], // Flipped 180 degrees so they face forward (the model was natively pointing South)
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
        getTooltip={({ object }) => object && (object.route ? `Bus: ${object.id}\nSpeed: ${object.speed} km/h` : `Event: ${object.type}\nSeverity: ${object.severity}`)}
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
                  'fill-extrusion-color': '#1e2a4a',
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': 0,
                  'fill-extrusion-opacity': 0.85,
                }
              });
            }
          }}
        />
      </DeckGL>
    </div>
  );
}
