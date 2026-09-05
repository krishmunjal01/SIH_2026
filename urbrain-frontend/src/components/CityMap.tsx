// React imports removed as unused
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { IconLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useUrbrainStore } from '../store/useUrbrainStore';

// Free dark basemap from CartoDB (no API key required)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

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

  const layers = [
    new IconLayer({
      id: 'buses-layer',
      data: buses,
      pickable: true,
      iconAtlas: NAV_ICON_URL,
      iconMapping: {
        bus: { x: 0, y: 0, width: 64, height: 64, anchorX: 32, anchorY: 32 }
      },
      getIcon: () => 'bus',
      sizeScale: 1,
      getPosition: (d) => [d.longitude, d.latitude],
      getSize: (d) => 40,
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
      getSize: (d) => 2,
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
      getWidth: d => 10
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
      getWidth: d => 3
    })
  ];

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
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        style={{ position: 'absolute' }}
        getTooltip={({ object }) => object && (object.route ? `Bus: ${object.id}\nSpeed: ${object.speed} km/h` : `Event: ${object.type}\nSeverity: ${object.severity}`)}
      >
        <Map 
          mapStyle={MAP_STYLE} 
          style={{ width: '100vw', height: '100vh' }}
        />
      </DeckGL>
    </div>
  );
}
