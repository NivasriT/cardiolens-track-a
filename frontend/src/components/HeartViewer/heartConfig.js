// ============================================================================
//  heartConfig.js  —  everything you tweak lives here
// ============================================================================
//  Coordinate frame (after the heart is auto-centred and auto-scaled):
//    +Y = towards the head      +Z = towards the viewer (front / anterior)
//    +X = patient's LEFT        (so the apex points to +X, bottom right)
//  Heart is roughly 2.2 units tall, centred on (0,0,0).
// ============================================================================

export const MODEL = {
  url: "/models/heart.glb",

  // If your GLB loads sideways / upside-down / back-to-front, fix it here
  // (radians). Example: [Math.PI / 2, 0, 0] rotates 90deg around X.
  rotation: [0, 0, 0],

  size: 2.2, // longest side after auto-fit

  // true  = use the GLB's own materials/textures untouched
  // false = replace with the glossy "wet tissue" material below
  keepOriginalMaterial: false,

  tissue: {
    color: "#a3282d",
    emissive: "#2b0606",
    emissiveIntensity: 0.55,
    roughness: 0.42,
    clearcoat: 0.75,
    clearcoatRoughness: 0.28,
    sheen: 0.7,
    sheenColor: "#ff9a8f",
  },
};

// Show red dots at the raw control points (and blue for anatomy labels).
// Turn this ON while you tune the coordinates below.
export const DEBUG_POINTS = false;

// ---------------------------------------------------------------------------
//  Risk colouring
// ---------------------------------------------------------------------------
export function riskLevel(p) {
  if (p >= 0.7) return { key: "high", label: "High", color: "#dc2626" };
  if (p >= 0.4) return { key: "moderate", label: "Moderate", color: "#f59e0b" };
  return { key: "lower", label: "Lower", color: "#14b8a6" };
}

// ---------------------------------------------------------------------------
//  Coronary arteries
//  - main / branches are APPROXIMATE control points. They are projected onto
//    the heart surface automatically, so they only need to be "roughly right".
//  - lesionAt: where along the vessel (0 = origin, 1 = distal tip) the
//    narrowing/plaque is drawn.
//  - radius: [start, end] vessel radius (tapers distally).
// ---------------------------------------------------------------------------
export const VESSELS = {
  LAD: {
    fullName: "Left Anterior Descending",
    territory:
      "Front wall of the left ventricle, the apex and the front of the septum.",
    lesionAt: 0.42,
    radius: [0.05, 0.022],
    main: [
      [0.12, 0.62, 0.45],
      [0.2, 0.35, 0.6],
      [0.28, 0.0, 0.65],
      [0.33, -0.45, 0.55],
      [0.36, -0.85, 0.35],
    ],
    branches: [
      [
        [0.2, 0.3, 0.6],
        [0.42, 0.15, 0.55],
        [0.58, -0.1, 0.45],
      ], // diagonal
    ],
  },
  LCX: {
    fullName: "Left Circumflex",
    territory: "Side and back wall of the left ventricle and the left atrium.",
    lesionAt: 0.5,
    radius: [0.042, 0.02],
    main: [
      [0.15, 0.55, 0.4],
      [0.4, 0.5, 0.25],
      [0.65, 0.3, 0.05],
      [0.75, -0.05, -0.15],
      [0.65, -0.4, -0.35],
    ],
    branches: [
      [
        [0.75, 0.0, -0.1],
        [0.8, -0.35, 0.0],
        [0.7, -0.65, 0.1],
      ], // obtuse marginal
    ],
  },
  RCA: {
    fullName: "Right Coronary Artery",
    territory:
      "Right atrium and ventricle, plus the bottom (inferior) wall of the heart.",
    lesionAt: 0.4,
    radius: [0.046, 0.02],
    main: [
      [-0.05, 0.6, 0.4],
      [-0.4, 0.45, 0.45],
      [-0.65, 0.1, 0.4],
      [-0.62, -0.4, 0.3],
      [-0.35, -0.75, 0.0],
    ],
    branches: [
      [
        [-0.62, -0.1, 0.4],
        [-0.5, -0.55, 0.5],
        [-0.25, -0.85, 0.35],
      ], // acute marginal
      [
        [-0.35, -0.75, 0.0],
        [0.0, -0.8, -0.2],
        [0.2, -0.7, -0.2],
      ], // posterior descending
    ],
  },
};

// ---------------------------------------------------------------------------
//  Anatomy regions (hover text + labels). Also projected onto the surface.
//  artery: which vessel usually supplies this area (null = not a coronary
//  territory). Territories vary between people - text says "typically".
// ---------------------------------------------------------------------------
export const REGIONS = [
  {
    id: "aorta",
    name: "Ascending aorta",
    pos: [0.05, 0.9, 0.05],
    artery: null,
    text: "Carries oxygen-rich blood from the left ventricle to the body. Both coronary arteries branch off at its root.",
  },
  {
    id: "pulmonary",
    name: "Pulmonary trunk",
    pos: [0.3, 0.75, 0.45],
    artery: null,
    text: "Carries oxygen-poor blood from the right ventricle to the lungs.",
  },
  {
    id: "ra",
    name: "Right atrium",
    pos: [-0.65, 0.4, 0.2],
    artery: "RCA",
    text: "Receives oxygen-poor blood returning from the body. The RCA runs in the groove beside it.",
  },
  {
    id: "rv",
    name: "Right ventricle",
    pos: [-0.3, -0.25, 0.55],
    artery: "RCA",
    text: "Pumps blood to the lungs. Typically supplied by the RCA.",
  },
  {
    id: "lv-ant",
    name: "Left ventricle, front wall",
    pos: [0.4, -0.3, 0.5],
    artery: "LAD",
    text: "Main pumping chamber. The front wall is typically supplied by the LAD.",
  },
  {
    id: "lv-lat",
    name: "Left ventricle, side wall",
    pos: [0.75, -0.1, 0.05],
    artery: "LCX",
    text: "Side wall of the main pumping chamber, typically supplied by the LCX.",
  },
  {
    id: "apex",
    name: "Apex",
    pos: [0.3, -0.95, 0.3],
    artery: "LAD",
    text: "The pointed tip of the heart. Usually supplied by the end of the LAD.",
  },
  {
    id: "la",
    name: "Left atrium",
    pos: [0.45, 0.65, -0.35],
    artery: "LCX",
    text: "Receives oxygen-rich blood from the lungs. Often supplied by branches of the LCX.",
  },
];

// ---------------------------------------------------------------------------
//  Camera presets
// ---------------------------------------------------------------------------
export const VIEWS = {
  Front: { position: [0, 0.1, 5], target: [0, 0, 0] },
  Back: { position: [0, 0.1, -5], target: [0, 0, 0] },
  "Left side": { position: [5, 0.1, 0], target: [0, 0, 0] },
  "Right side": { position: [-5, 0.1, 0], target: [0, 0, 0] },
  Top: { position: [0, 5, 0.6], target: [0, 0, 0] },
};
