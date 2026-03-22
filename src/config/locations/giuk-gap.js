'use strict';

// ── GIUK Gap — North Atlantic ────────────────────────────────────────────
// Iceland–Faroe–UK gap. Classic Cold War chokepoint.
// Deep Atlantic basin to the west, Norwegian Sea to the east.
// Iceland-Faroe Ridge creates a shallow barrier (~400-800m) across the gap.
//
// Bounding box: 61°N to 66°N, 20°W to 5°W
// ~120nm × 120nm operational area centered on ~63.5°N, 12.5°W
//
// DATA SOURCE: Simplified approximation of GEBCO bathymetry.
// To be replaced with real GEBCO grid data per DATA-SOURCING.md process.

// ── Constants ────────────────────────────────────────────────────────────
const NM_TO_M = 1852;
const WU_PER_NM = 185.2;  // world units per nautical mile (1 wu ≈ 10m)
const GRID_RES_NM = 1.0;  // 1nm per grid cell
const GRID_SIZE = 120;     // 120 × 120 cells = 120nm × 120nm

// ── Real GEBCO Bathymetry ────────────────────────────────────────────────
// Source: GEBCO 2020 via Open Topo Data API (fetched 2026-03-22)
// Tool: tools/fetch-bathymetry.cjs
// Grid: 120×120 at 1nm resolution
// Bounds: 62.5°N–64.5°N, 14.74°W–10.26°W
// Depth range: 0m to 1897m (avg 622m) — Iceland-Faroe Ridge area
import _bathyData from './giuk-gap-bathymetry.json' with { type: 'json' };

function _getBathymetryGrid() {
  return _bathyData.grid;
}

// ── Land Mask ────────────────────────────────────────────────────────────
function _generateLandMask(grid) {
  return grid.map(row => row.map(d => d <= 0));
}

// ── Bottom Type ──────────────────────────────────────────────────────────
function _generateBottomType(grid) {
  return grid.map(row => row.map(d => {
    if (d <= 0) return 'rock';      // land/coast
    if (d < 200) return 'rock';     // shallow shelf — rocky
    if (d < 600) return 'sand';     // mid shelf
    if (d < 1500) return 'mixed';   // slope
    return 'mud';                    // deep basin — abyssal clay
  }));
}

// ── Generate grids ───────────────────────────────────────────────────────
const _bathyGrid = _getBathymetryGrid();
const _landMask = _generateLandMask(_bathyGrid);
const _bottomGrid = _generateBottomType(_bathyGrid);

// ── Export ────────────────────────────────────────────────────────────────
export const LOCATION = {
  key: 'giuk_gap',
  name: 'GIUK Gap — North Atlantic',
  description: 'Iceland–Faroe–UK gap. Deep Atlantic, ridge crossing, Cold War chokepoint.',
  lat: 63.5,
  lon: -12.5,
  bounds: { north: 64.5, south: 62.5, east: -10.2588, west: -14.7412 },

  // World dimensions in game world units
  worldSize: GRID_SIZE * WU_PER_NM, // 120nm in world units

  bathymetry: {
    grid: _bathyGrid,
    resolution: WU_PER_NM,     // world units per grid cell (1nm)
    cellMetres: NM_TO_M,       // metres per grid cell
    rows: GRID_SIZE,
    cols: GRID_SIZE,
  },

  land: {
    mask: _landMask,
  },

  bottom: {
    grid: _bottomGrid,
  },

  // Sound velocity profiles by season
  // Source: North Atlantic climatology, aligned with LAYER-GENERATION-GUIDANCE.md
  // Seasonal thermocline parameters drive the tile-based layer system.
  svp: {
    winter: {
      surfaceTemp: 6.5,
      mixedLayerDepth: 260,         // mid-range of 200–320m seasonal band
      thermoclineGradient: -0.03,   // weak — 0.5–2°C across 20–60m thickness
      thermoclineBottom: 310,       // thin layer: ~50m thickness
      secondaryThermoclines: [],
      haloclineDepth: 300,
      haloclineStrength: 0.4,
      deepIsothermalTemp: 3.0,
      sofarAxisDepth: 50,           // near surface in winter at this latitude
    },
    spring: {
      surfaceTemp: 7.5,
      mixedLayerDepth: 95,          // mid-range of 60–130m
      thermoclineGradient: -0.05,   // moderate — 2–5°C across 40–90m
      thermoclineBottom: 160,       // ~65m thickness
      secondaryThermoclines: [],
      haloclineDepth: 280,
      haloclineStrength: 0.35,
      deepIsothermalTemp: 3.0,
      sofarAxisDepth: 200,
    },
    summer: {
      surfaceTemp: 11.0,
      mixedLayerDepth: 50,          // mid-range of 30–70m
      thermoclineGradient: -0.05,   // 4–8°C across 80–160m — moderate per-metre but large total
      thermoclineBottom: 170,       // ~120m thickness
      secondaryThermoclines: [
        { depth: 600, gradient: -0.02, thickness: 80 }, // permanent deep thermocline
      ],
      haloclineDepth: 250,
      haloclineStrength: 0.25,
      deepIsothermalTemp: 3.0,
      sofarAxisDepth: 500,
    },
    autumn: {
      surfaceTemp: 9.0,
      mixedLayerDepth: 125,         // mid-range of 70–180m
      thermoclineGradient: -0.05,   // 2–6°C across 50–120m
      thermoclineBottom: 210,       // ~85m thickness
      secondaryThermoclines: [],
      haloclineDepth: 260,
      haloclineStrength: 0.3,
      deepIsothermalTemp: 3.0,
      sofarAxisDepth: 300,
    },
  },

  // Thermocline spawn parameters — used by tile generation system
  // Ranges are sampled per-tile with normal distribution
  thermocline: {
    winter: {
      topDepthRange: [200, 320],      // metres
      thicknessRange: [20, 60],       // metres
      tempDropRange: [0.5, 2.0],      // °C total across thermocline
      absentChance: 0.40,             // 40% of tiles have no layer
    },
    spring: {
      topDepthRange: [60, 130],
      thicknessRange: [40, 90],
      tempDropRange: [2.0, 5.0],
      absentChance: 0.20,
    },
    summer: {
      topDepthRange: [30, 70],
      thicknessRange: [80, 160],
      tempDropRange: [4.0, 8.0],
      absentChance: 0.05,
    },
    autumn: {
      topDepthRange: [70, 180],
      thicknessRange: [50, 120],
      tempDropRange: [2.0, 6.0],
      absentChance: 0.25,
    },
  },

  // Weather ranges by season
  weather: {
    winter:  { windMin: 25, windMax: 45, ssMin: 5, ssMax: 7, precip: 'rain',       cloudMin: 0.7, cloudMax: 1.0 },
    spring:  { windMin: 12, windMax: 28, ssMin: 3, ssMax: 5, precip: 'none',       cloudMin: 0.4, cloudMax: 0.8 },
    summer:  { windMin: 8,  windMax: 20, ssMin: 2, ssMax: 4, precip: 'none',       cloudMin: 0.3, cloudMax: 0.7 },
    autumn:  { windMin: 18, windMax: 38, ssMin: 4, ssMax: 6, precip: 'rain',       cloudMin: 0.5, cloudMax: 0.9 },
  },

  // Ambient noise
  ambient: {
    shippingDensity: 0.4,  // moderate — North Atlantic shipping lanes nearby
    biologics: {
      winter: 0.05,
      spring: 0.15,
      summer: 0.20,
      autumn: 0.10,
    },
  },
};
