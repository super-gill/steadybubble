# Realism Overhaul — Data Model

All new variables, constants, data structures, and configuration introduced by this project. Essential reference for sessions after context loss — if you need to know what a variable is, check here first.

---

## Ocean Environment

### Sound Velocity Profile (SVP)

```
world.ocean = {
  location: {
    name: 'North Atlantic — GIUK Gap',
    lat: 63.5,
    lon: -12.0,
    season: 'winter',         // 'winter'|'spring'|'summer'|'autumn'
    timeOfDay: 'dawn',        // 'dawn'|'day'|'dusk'|'night' — diurnal variation
    seaState: 3,              // 0-9 (Beaufort-derived)
  },
  svp: {
    surfaceTemp: 8.0,           // °C — surface water temperature
    mixedLayerDepth: 80,        // metres — uniform temperature above this
    thermoclineGradient: -0.12, // °C per metre through main thermocline
    thermoclineBottom: 400,     // metres — base of main thermocline
    secondaryThermoclines: [    // optional additional layers
      { depth: 600, gradient: -0.03, thickness: 50 },
    ],
    haloclineDepth: 200,        // metres — salinity change layer
    haloclineStrength: 0.5,     // 0-1 — impact on sound velocity
    deepIsothermalTemp: 2.5,    // °C — temperature below thermocline
    sofarAxisDepth: 1000,       // metres — minimum sound velocity (SOFAR channel)
  },
  bottom: {
    depth: 2400,                // metres — water depth
    type: 'mud',                // 'mud'|'sand'|'rock'|'mixed' — affects bottom bounce
    reflectivity: 0.3,          // 0-1 — acoustic reflection coefficient
  },
  ambient: {
    seaStateNoise: 0.15,        // 0-1 — wind-driven surface noise
    shippingDensity: 0.3,       // 0-1 — distant merchant traffic noise
    biologics: 0.1,             // 0-1 — marine life noise (seasonal)
    diurnalMixingRate: 0.02,    // mixed layer depth change per hour (day/night)
  },
  weather: {
    windSpeed: 15,              // knots
    windDirection: 270,         // degrees true
    precipitation: 'none',     // 'none'|'rain'|'heavy_rain'|'snow'
    cloudCover: 0.6,           // 0-1 — affects diurnal heating
    visibility: 8,             // nautical miles — affects periscope
  },
}
```

### Computed Propagation Properties (derived from SVP each tick)

```
world.propagation = {
  directPathRange: 12,          // nm — max direct path detection
  czRanges: [28, 57, 86],      // nm — convergence zone annuli
  czWidth: 3,                   // nm — width of each CZ detection band
  surfaceDuctDepth: 80,         // metres — duct below mixed layer
  surfaceDuctRange: 15,         // nm — detection range within duct
  shadowZoneStart: 12,          // nm — beginning of shadow zone
  shadowZoneEnd: 28,            // nm — end of shadow zone (CZ1 begins)
  bottomBounceRange: 20,        // nm — if bottom is reflective
  absorptionPerNm: {            // dB per nm by frequency band
    vlf: 0.001,                 // <1kHz — almost no absorption
    lf: 0.01,                   // 1-10kHz — low absorption
    mf: 0.05,                   // 10-50kHz — moderate
    hf: 0.20,                   // >50kHz — high (active sonar, torpedoes)
  },
  vlfPenetrationDepth: 20,      // metres — VLF comms reception limit
}
```

### Per-Scenario Location Presets

```
LOCATIONS = {
  giuk_gap:       { name:'GIUK Gap', lat:63.5, lon:-12, depth:2400, bottom:'mixed', ... },
  north_atlantic: { name:'Mid-Atlantic', lat:45, lon:-30, depth:4200, bottom:'mud', ... },
  barents_sea:    { name:'Barents Sea', lat:72, lon:35, depth:350, bottom:'sand', ... },
  norwegian_sea:  { name:'Norwegian Sea', lat:67, lon:5, depth:3000, bottom:'mud', ... },
  mediterranean:  { name:'Eastern Med', lat:34, lon:28, depth:2500, bottom:'mud', ... },
  persian_gulf:   { name:'Persian Gulf', lat:27, lon:52, depth:60, bottom:'sand', ... },
  // ... more as needed
}
```

---

## Terrain / Bathymetry

```
// Loaded from location data module
world.bathymetry = {
  grid: [[depth, ...], ...],      // metres, 2D array (positive = water depth)
  resolution: 926,                 // metres per cell (~0.5nm)
  rows: 240, cols: 320,
  origin: { lat: 61.0, lon: -20.0 },
}

world.land = {
  mask: [[bool, ...], ...],       // true = land (impassable)
  coastlinePolygons: [...],        // for rendering
}

world.bottomType = {
  grid: [['mud', ...], ...],      // 'rock'|'sand'|'mud'|'mixed' per cell
}

// Computed per-frame from player position
player.depthUnderKeel = 0;         // metres — distance from hull bottom to seabed
player.seabedDepth = 0;            // metres — water depth at current position
player.groundingState = null;      // null | { severity, speed, angle, t }
```

### Terrain Collision Constants

```
CONFIG.terrain = {
  warningDUK: 50,                  // metres — first depth-under-keel warning
  urgentDUK: 20,                   // metres — urgent warning
  criticalDUK: 10,                 // metres — collision alarm
  draftSSN: 12,                    // metres — submarine draft (SSN)
  draftSSK: 8,                     // metres — submarine draft (conventional)
  groundingSeverity: {
    gentle: { maxSpeed: 3, damageRooms: 0, floodChance: 0.05 },
    hard:   { maxSpeed: 10, damageRooms: 2, floodChance: 0.40 },
    severe: { maxSpeed: Infinity, damageRooms: 5, floodChance: 0.90 },
  },
}
```

---

## Sonar Model Variables

```
// Per-contact detection state
contact.detection = {
  snr: 0,                      // signal-to-noise ratio (dB)
  path: 'direct',              // 'direct'|'cz1'|'cz2'|'bottom_bounce'|'duct'
  bearing: 145.3,              // true bearing (degrees)
  bearingRate: 0.02,           // degrees per second
  confidence: 0.65,            // 0-1 — classification confidence
  freqBands: {                 // detection strength by frequency
    broadband: -12,            // dB relative to threshold
    narrowband: [              // specific tonals
      { freq: 60, strength: -8, label: 'turbine' },
      { freq: 150, strength: -15, label: 'pump' },
    ],
  },
}
```

---

## Torpedo Physics Variables

```
// Per-torpedo in-flight state
torpedo.physics = {
  fuel: 1.0,                   // 0-1 — remaining fuel
  fuelBurnRate: 0.0003,        // per second at cruise speed
  searchPattern: 'snake',      // 'wire'|'snake'|'spiral'|'reattack'
  seekerState: 'passive',      // 'passive'|'active'|'acquisition'
  seekerRange: 2000,           // metres — active seeker detection range
  wireIntact: true,
  wireLength: 0,               // metres of wire deployed
  wireMaxLength: 28000,        // metres (~15nm)
}
```

---

## AI State Variables

```
// Per-AI-entity tactical state
enemy.tactical = {
  awareness: 'unaware',        // 'unaware'|'alert'|'investigating'|'tracking'|'prosecuting'|'evading'
  targetBearing: null,         // bearing to player (if tracking)
  targetConfidence: 0,         // 0-1 — how sure AI is of player position
  tmaState: 'none',            // 'none'|'building'|'solid'|'degraded'
  lastContactT: 0,             // seconds since last detection
  legChangeT: 0,               // seconds until next course change (for TMA)
  weaponState: 'safe',         // 'safe'|'ready'|'firing'|'reloading'
  evasionState: null,          // null|'knuckle'|'deep'|'countermeasures'
}
```

---

## New Constants (config)

```
CONFIG.ocean = { ... }          // Active ocean environment
CONFIG.sonar = {
  // Detection thresholds by sonar type
  passiveThreshold: -6,        // dB SNR for initial detection
  classifyThreshold: 2,        // dB SNR for classification
  trackingThreshold: -2,       // dB SNR to maintain track
  activeSourceLevel: 220,      // dB re 1μPa — active ping power
  // Frequency band definitions
  ...
}
```

---

## File Locations (planned)

| File | Purpose |
|------|---------|
| `src/config/ocean-locations.js` | Location presets with SVP, bottom, weather |
| `src/systems/ocean.js` | SVP computation, propagation model, CZ calculation |
| `src/systems/sonar-model.js` | Detection equations, SNR computation |
| `src/systems/torpedo-physics.js` | Torpedo flight model, seeker, wire |
| `src/ai/tactical-ai.js` | AI decision-making at realistic ranges |
| `src/ai/ai-sonar.js` | AI sonar — same model as player |

---

*This document is updated as new variables are introduced during implementation. Always check here when resuming a session.*
