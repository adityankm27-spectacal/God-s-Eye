export type SpillStatus = "active" | "monitoring" | "resolved";

export interface SpillIncident {
  id: string;
  name: string;
  lng: number;
  lat: number;
  detectedAt: string;
  satellite: string;
  areaKm2: number;
  perimeterKm: number;
  volumeBarrels: number;
  thicknessMm: number;
  confidence: number;
  status: SpillStatus;
  oilType: string;
  oilTypeConfidence: number;
  windSpeedKt: number;
  windDir: string;
  seaState: string;
}

export const activeSpill: SpillIncident = {
  id: "SP-2026-0114",
  name: "Mumbai High Offshore Slick",
  lng: 71.62,
  lat: 19.54,
  detectedAt: "2026-08-25T04:12:00Z",
  satellite: "Sentinel-1A (SAR, VV/VH)",
  areaKm2: 18.4,
  perimeterKm: 26.1,
  volumeBarrels: 3120,
  thicknessMm: 0.08,
  confidence: 94.2,
  status: "active",
  oilType: "Medium Crude (API 28–32)",
  oilTypeConfidence: 87.5,
  windSpeedKt: 12,
  windDir: "WSW",
  seaState: "Moderate (1.2m Hs)",
};

export const slickPolygon: [number, number][] = [
  [71.58, 19.58],
  [71.61, 19.6],
  [71.65, 19.585],
  [71.67, 19.56],
  [71.655, 19.535],
  [71.62, 19.52],
  [71.59, 19.53],
  [71.575, 19.555],
  [71.58, 19.58],
];

export const backwardDrift: [number, number][] = [
  [71.62, 19.54],
  [71.58, 19.57],
  [71.54, 19.6],
  [71.5, 19.63],
  [71.46, 19.66],
  [71.42, 19.7],
  [71.38, 19.74],
];

export const forwardDrift: [number, number][] = [
  [71.62, 19.54],
  [71.78, 19.46],
  [71.95, 19.36],
  [72.14, 19.24],
  [72.34, 19.12],
  [72.55, 19.02],
  [72.76, 18.94],
  [72.9, 18.9],
];

export interface Vessel {
  id: string;
  name: string;
  mmsi: string;
  type: string;
  flag: string;
  lng: number;
  lat: number;
  distanceKm: number;
  speedKt: number;
  course: number;
  lastAisPing: string;
  aisGapMin: number;
  suspicionScore: number;
  rank: number;
  track: [number, number][];
  factors: { label: string; weight: number }[];
}

export const vessels: Vessel[] = [
  {
    id: "V-1",
    name: "MT Kaveri Star",
    mmsi: "419087213",
    type: "Crude Oil Tanker",
    flag: "India",
    lng: 71.505,
    lat: 19.648,
    distanceKm: 14.2,
    speedKt: 11.4,
    course: 128,
    lastAisPing: "2026-08-25T03:40:00Z",
    aisGapMin: 32,
    suspicionScore: 91,
    rank: 1,
    track: [
      [71.46, 19.7],
      [71.49, 19.68],
      [71.505, 19.648],
      [71.53, 19.6],
    ],
    factors: [
      { label: "AIS gap overlaps spill origin window", weight: 0.34 },
      { label: "Backward drift path intersects course", weight: 0.29 },
      { label: "Vessel class: crude carrier", weight: 0.18 },
      { label: "Speed drop before gap (14→6 kt)", weight: 0.1 },
      { label: "Prior compliance flags (1 in 5y)", weight: 0.09 },
    ],
  },
  {
    id: "V-2",
    name: "MV Konkan Pride",
    mmsi: "419055671",
    type: "Product Tanker",
    flag: "India",
    lng: 71.71,
    lat: 19.47,
    distanceKm: 11.6,
    speedKt: 13.1,
    course: 302,
    lastAisPing: "2026-08-25T04:05:00Z",
    aisGapMin: 0,
    suspicionScore: 47,
    rank: 2,
    track: [
      [71.8, 19.4],
      [71.76, 19.43],
      [71.71, 19.47],
      [71.66, 19.5],
    ],
    factors: [
      { label: "Continuous AIS, no gap", weight: 0.05 },
      { label: "Route passes near forward drift", weight: 0.22 },
      { label: "Vessel class: product tanker", weight: 0.12 },
      { label: "Within 12km at detection time", weight: 0.31 },
      { label: "No prior flags", weight: 0.02 },
    ],
  },
  {
    id: "V-3",
    name: "Al Waha II",
    mmsi: "477291840",
    type: "Bulk Carrier",
    flag: "Panama",
    lng: 71.44,
    lat: 19.59,
    distanceKm: 19.8,
    speedKt: 9.2,
    course: 95,
    lastAisPing: "2026-08-25T04:10:00Z",
    aisGapMin: 4,
    suspicionScore: 22,
    rank: 3,
    track: [
      [71.35, 19.63],
      [71.4, 19.61],
      [71.44, 19.59],
      [71.49, 19.57],
    ],
    factors: [
      { label: "Outside primary drift cone", weight: 0.08 },
      { label: "Vessel class: non-tanker", weight: 0.04 },
      { label: "Minor AIS gap (4 min)", weight: 0.05 },
      { label: "Distance from origin > 15km", weight: 0.03 },
    ],
  },
  {
    id: "V-4",
    name: "FV Sagar Kanya",
    mmsi: "419012334",
    type: "Fishing Vessel",
    flag: "India",
    lng: 71.58,
    lat: 19.42,
    distanceKm: 13.4,
    speedKt: 4.1,
    course: 210,
    lastAisPing: "2026-08-25T04:11:00Z",
    aisGapMin: 0,
    suspicionScore: 9,
    rank: 4,
    track: [
      [71.6, 19.46],
      [71.59, 19.44],
      [71.58, 19.42],
    ],
    factors: [
      { label: "Vessel class: fishing (non-tanker)", weight: 0.02 },
      { label: "No AIS gap", weight: 0.02 },
      { label: "Low speed, erratic pattern typical", weight: 0.05 },
    ],
  },
];

export interface CoastalAsset {
  id: string;
  name: string;
  type: "Port" | "Marine Protected Area" | "Fishing Ground";
  lng: number;
  lat: number;
  etaHours: number;
  sensitivity: "High" | "Medium" | "Low";
}

export const coastalAssets: CoastalAsset[] = [
  { id: "A-1", name: "Malvan Marine Sanctuary", type: "Marine Protected Area", lng: 73.47, lat: 16.05, etaHours: 68, sensitivity: "High" },
  { id: "A-2", name: "Ratnagiri Fishing Grounds", type: "Fishing Ground", lng: 73.3, lat: 16.99, etaHours: 41, sensitivity: "Medium" },
  { id: "A-3", name: "JNPT Port Approach", type: "Port", lng: 72.95, lat: 18.95, etaHours: 26, sensitivity: "High" },
];

export interface PipelineStage {
  id: string;
  label: string;
  question: string;
  status: "done" | "active" | "pending";
  timestamp?: string;
}

export const pipeline: PipelineStage[] = [
  { id: "satellite", label: "Satellite Images", question: "Acquire SAR / EO pass", status: "done", timestamp: "04:08 UTC" },
  { id: "spill", label: "Spill Detection", question: "Is there an oil spill?", status: "done", timestamp: "04:12 UTC" },
  { id: "size", label: "Characterization", question: "How big is it?", status: "done", timestamp: "04:13 UTC" },
  { id: "oiltype", label: "Oil Type", question: "What kind of oil?", status: "done", timestamp: "04:14 UTC" },
  { id: "origin", label: "Backward Drift", question: "Where did it come from?", status: "done", timestamp: "04:16 UTC" },
  { id: "forecast", label: "Forward Drift", question: "Where will it go?", status: "active", timestamp: "04:17 UTC" },
  { id: "vessels", label: "Vessel Correlation", question: "Which ships were nearby?", status: "active" },
  { id: "attribution", label: "Attribution", question: "Which ship is most suspicious?", status: "pending" },
  { id: "alert", label: "Alert Authorities", question: "Report to nearest authorities", status: "pending" },
  { id: "dashboard", label: "Dashboard", question: "Monitor & respond", status: "pending" },
];

export const kpis = {
  activeSpills: 3,
  vesselsTracked: 214,
  areaMonitoredKm2: 48200,
  alertsSent24h: 5,
};

export const historicalSpills = [
  { month: "Mar", count: 2, areaKm2: 9.1 },
  { month: "Apr", count: 4, areaKm2: 22.4 },
  { month: "May", count: 3, areaKm2: 14.7 },
  { month: "Jun", count: 5, areaKm2: 31.2 },
  { month: "Jul", count: 2, areaKm2: 11.6 },
  { month: "Aug", count: 6, areaKm2: 38.9 },
];

export const spectralSignature = {
  wavelengths: [400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900],
  observed: [0.12, 0.15, 0.19, 0.24, 0.31, 0.36, 0.4, 0.44, 0.47, 0.49, 0.5],
  reference: [0.1, 0.14, 0.18, 0.23, 0.3, 0.35, 0.39, 0.43, 0.46, 0.48, 0.49],
};

export const cleanupRecommendation = {
  method: "Mechanical Containment + Skimming",
  reasoning:
    "Moderate sea state (1.2m Hs) and medium-viscosity crude favor boom containment followed by skimmer recovery over dispersants, which are less effective above 25 kt wind and risk affecting the Malvan MPA downstream.",
  alternatives: ["In-situ burning (if slick thickness > 2mm)", "Chemical dispersant (fallback, offshore only)"],
  resourcesRecommended: ["2x Offshore containment booms (500m)", "1x Skimmer vessel", "Coast Guard patrol dispatch"],
};
