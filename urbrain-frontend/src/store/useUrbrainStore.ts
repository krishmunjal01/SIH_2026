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

export type ToastType = 'detect' | 'verify' | 'verified' | 'action';

export interface DemoToast {
  message: string;
  type: ToastType;
  id: number; // unique ID so re-firing the same type still triggers AnimatePresence
}

interface UrbrainState {
  buses: Bus[];
  events: Event[];
  segments: RoadSegment[];
  activeIncident: Incident | null;
  selectedBus: Bus | null;
  isConnected: boolean;
  is3DMode: boolean;
  viewState: ViewState;
  demoToast: DemoToast | null;
  setBuses: (buses: Bus[]) => void;
  setEvents: (events: Event[]) => void;
  setSegments: (segments: RoadSegment[]) => void;
  setActiveIncident: (incident: Incident | null) => void;
  setSelectedBus: (bus: Bus | null) => void;
  setConnected: (status: boolean) => void;
  set3DMode: (status: boolean) => void;
  setViewState: (viewState: ViewState) => void;
  setDemoToast: (toast: DemoToast | null) => void;
}

export const useUrbrainStore = create<UrbrainState>((set) => ({
  buses: [],
  events: [],
  segments: [],
  activeIncident: null,
  selectedBus: null,
  isConnected: false,
  is3DMode: false,
  demoToast: null,
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
  setSelectedBus: (bus) => set({ selectedBus: bus }),
  setConnected: (status) => set({ isConnected: status }),
  set3DMode: (status) => set({ is3DMode: status }),
  setViewState: (viewState) => set({ viewState }),
  setDemoToast: (toast) => set({ demoToast: toast }),
}));
