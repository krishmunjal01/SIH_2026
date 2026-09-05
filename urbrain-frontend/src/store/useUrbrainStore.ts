import { create } from 'zustand';

export interface Bus {
  id: string;
  route: string;
  latitude: number;
  longitude: number;
  speed: number;
  status: string;
  edgeStatus: string;
  cameras: number;
  heading: number;
}

export interface Event {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  confidence: number;
  severity: string;
  busId: string;
  timestamp: string;
  status: 'PENDING' | 'VERIFIED';
  verifyingBuses: string[];
}

export interface RoadSegment {
  id: string;
  name: string;
  path: [number, number][];
  healthScore: number;
}

export interface Incident {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  radius: number;
  suspectPlate: string;
  active: boolean;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  transitionInterpolator?: any;
}

interface UrbrainState {
  buses: Bus[];
  events: Event[];
  segments: RoadSegment[];
  activeIncident: Incident | null;
  isConnected: boolean;
  is3DMode: boolean;
  viewState: ViewState;
  setBuses: (buses: Bus[]) => void;
  setEvents: (events: Event[]) => void;
  setSegments: (segments: RoadSegment[]) => void;
  setActiveIncident: (incident: Incident | null) => void;
  setConnected: (status: boolean) => void;
  set3DMode: (status: boolean) => void;
  setViewState: (viewState: ViewState) => void;
}

export const useUrbrainStore = create<UrbrainState>((set) => ({
  buses: [],
  events: [],
  segments: [],
  activeIncident: null,
  isConnected: false,
  is3DMode: false,
  viewState: {
    longitude: 76.7794,
    latitude: 30.7333,
    zoom: 13,
    pitch: 45,
    bearing: 0
  },
  setBuses: (buses) => set({ buses }),
  setEvents: (events) => set({ events }),
  setSegments: (segments) => set({ segments }),
  setActiveIncident: (incident) => set({ activeIncident: incident }),
  setConnected: (status) => set({ isConnected: status }),
  set3DMode: (status) => set({ is3DMode: status }),
  setViewState: (viewState) => set({ viewState }),
}));
