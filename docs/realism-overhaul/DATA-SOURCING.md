# Realism Overhaul — Data Sourcing Guide

Repeatable process for obtaining geographic, oceanographic, and bathymetric data for new operational areas. Follow this guide exactly when adding a new location.

---

## 1. Bathymetry (Seabed Depth)

### Source: GEBCO 2020 via Open Topo Data API
- **API endpoint:** `https://api.opentopodata.org/v1/gebco2020`
- **Dataset:** GEBCO 2020 (15 arc-second global bathymetry, ~450m resolution)
- **Format:** JSON response with elevation values (negative = below sea level)
- **License:** Public domain
- **Limits:** 100 locations/request, 1 request/second, 1000 requests/day

### Automated Process (repeatable)

**Script:** `tools/fetch-bathymetry.js`

**How to run:**
```bash
node tools/fetch-bathymetry.js
```

**What it does:**
1. Calculates bounding box from centre lat/lon and size (120nm)
   - Latitude span: `sizeNM / 60` degrees (constant: 60nm per degree)
   - Longitude span: `sizeNM / (60 * cos(centreLat))` degrees (adjusted for latitude)
2. Generates a 120×120 grid of lat/lon points at 1nm resolution
3. Fetches depth from GEBCO API in batches of 100 (respects rate limits)
4. Converts GEBCO elevations (negative) to positive depth values
5. Writes `src/config/locations/giuk-gap-bathymetry.json` with grid + metadata

**To change location:** Edit these constants at the top of the script:
```javascript
const CENTRE_LAT = 63.5;
const CENTRE_LON = -12.5;
const SIZE_NM = 120;
```

**Output format:**
```json
{
  "meta": {
    "source": "GEBCO 2020 via Open Topo Data API",
    "fetchDate": "2026-03-22",
    "centre": { "lat": 63.5, "lon": -12.5 },
    "bounds": { "north": 64.5, "south": 62.5, "east": -10.2588, "west": -14.7412 },
    "gridSize": 120,
    "resolutionNM": 1
  },
  "grid": [[depth, depth, ...], ...]
}
```

**After fetching:** Copy the grid data into the location JS module (e.g., `giuk-gap.js`). The fetch script produces JSON; the game module uses this data statically.

### Validation
- Spot-check centre point: 63.5°N, 12.5°W should be ~400-500m (Iceland-Faroe Ridge)
- Spot-check south edge: 62.5°N should be ~1000m+ (deeper water south of ridge)
- Compare with published GEBCO viewer: https://www.gebco.net/data_and_products/gebco_web_services/

---

## 2. Coastline (Land Boundaries)

### Source: Natural Earth
- **URL:** https://www.naturalearthdata.com/downloads/10m-physical-vectors/
- **Dataset:** `ne_10m_land` (1:10 million scale — sufficient for game use)
- **Format:** Shapefile or GeoJSON
- **License:** Public domain

### Alternative Source: OpenStreetMap Coastline
- **URL:** https://osmdata.openstreetmap.de/data/coast.html
- **Format:** Shapefile
- **License:** ODbL

### Process
1. Download coastline data for the region
2. Clip to operational area bounding box
3. Simplify polygons if needed (Douglas-Peucker, tolerance ~500m)
4. Convert to game format: array of polygon vertex arrays [{lat, lon}, ...]
5. Rasterise onto the bathymetry grid: any cell overlapping land → land=true
6. Export as part of the location data module

### Validation
- Overlay coastline on bathymetry grid — land cells should match coast polygons
- Check islands are present (Greek islands in Med, Faroes in GIUK)
- Verify straits and channels are passable (not blocked by rasterisation)

---

## 3. Bottom Type (Sediment)

### Source: NOAA NGDC Seafloor Sediment
- **URL:** https://www.ngdc.noaa.gov/mgg/geology/geology.html
- **Dataset:** Global Seafloor Total Sediment Thickness / dbSEABED
- **Format:** Point data or gridded
- **License:** Public domain (US government)

### Simplified Approach
Where detailed sediment data is unavailable, use these general rules:
- Continental shelf (<200m): **sand** (default)
- Shelf edge / slope (200-2000m): **mixed**
- Deep ocean (>2000m): **mud** (abyssal clay/ooze)
- Near volcanic ridges: **rock**
- Known rocky areas (coastal Norway, Iceland): **rock**

### Process
1. Obtain sediment type data for the region (or use simplified rules)
2. Map to game categories: 'rock' | 'sand' | 'mud' | 'mixed'
3. Resample to game grid resolution
4. Export as 2D array matching bathymetry grid dimensions

---

## 4. Sound Velocity Profile (SVP)

### Source: World Ocean Atlas (WOA)
- **URL:** https://www.ncei.noaa.gov/products/world-ocean-atlas
- **Dataset:** Temperature and Salinity climatology (monthly or seasonal)
- **Format:** NetCDF
- **License:** Public domain (US government)

### Process
1. Download temperature and salinity profiles for the location (seasonal)
2. Extract T(z) and S(z) profiles at the scenario centre point
3. Compute sound velocity at each depth using Mackenzie equation:
   `c = 1448.96 + 4.591T - 0.05304T² + 0.0002374T³ + 1.340(S-35) + 0.01630D + 1.675e-7×D²`
4. Identify key features:
   - Mixed layer depth (where gradient begins)
   - Main thermocline (maximum gradient region)
   - SOFAR axis (minimum sound velocity depth)
   - Any secondary thermoclines or haloclines
5. Record as game parameters (see DATA-MODEL.md)

### Seasonal Profiles
Generate 4 profiles per location (winter, spring, summer, autumn). The scenario selects the appropriate season.

### Validation
- Compare computed SVP against published SVP charts for the region
- Verify mixed layer depth matches known seasonal values
- Check SOFAR axis depth against published ocean atlases

---

## 5. Weather & Sea State

### Source: ERA5 Climate Reanalysis
- **URL:** https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-single-levels
- **Dataset:** ERA5 hourly surface data (wind speed, wave height, precipitation)
- **License:** Copernicus licence (free for research/non-commercial)

### Simplified Approach
Use published climatological averages per region/season:

| Location | Winter | Spring | Summer | Autumn |
|----------|--------|--------|--------|--------|
| GIUK Gap | SS 5-7, wind 25-40kt | SS 4-5, wind 15-25kt | SS 3-4, wind 10-20kt | SS 4-6, wind 20-35kt |
| Barents Sea | SS 5-8, wind 25-50kt | SS 4-5, wind 15-25kt | SS 2-4, wind 8-18kt | SS 5-7, wind 20-40kt |
| E. Mediterranean | SS 3-4, wind 10-20kt | SS 2-3, wind 8-15kt | SS 1-2, wind 5-12kt | SS 3-4, wind 10-20kt |

### Process
1. Determine typical weather range for location/season
2. Define min/max/typical values for: wind speed, sea state, precipitation, cloud cover
3. Scenario picks random weather within the range at mission start
4. Weather can be fixed for the mission or vary (design decision — see open questions)

---

## 6. Shipping Density

### Source: Global Fishing Watch / AIS Data
- **URL:** https://globalfishingwatch.org/map-and-data/
- **Alternative:** MarineTraffic density maps (visual reference only)

### Simplified Approach
Classify regions by shipping traffic:
- **High:** Major sea lanes (English Channel, Strait of Gibraltar, Suez approach)
- **Medium:** Moderate traffic (Norwegian Sea, central Med)
- **Low:** Open ocean, military exclusion zones (Barents, deep Atlantic)
- **None:** Very remote areas

### Process
1. Classify the operational area into shipping density zones
2. Assign ambient noise modifier (0-1 scale) per zone
3. Record in location data module

---

## 7. Output Format

Each location produces one JS module file:

```
// src/config/locations/giuk-gap.js
export const LOCATION = {
  name: 'GIUK Gap',
  lat: 63.5, lon: -12.0,
  bounds: { north: 66, south: 61, east: -5, west: -20 },

  bathymetry: {
    grid: [[2400, 2380, ...], ...],  // depth in metres, 2D array
    resolution: 926,                  // metres per cell
    rows: 240, cols: 320,
  },

  land: {
    mask: [[false, false, true, ...], ...],  // matches bathymetry grid
    coastlinePolygons: [...]                   // for rendering
  },

  bottom: {
    grid: [['mud', 'mud', 'mixed', ...], ...],  // matches bathymetry grid
  },

  svp: {
    winter: { surfaceTemp: 6, mixedLayerDepth: 180, ... },
    spring: { surfaceTemp: 8, mixedLayerDepth: 120, ... },
    summer: { surfaceTemp: 12, mixedLayerDepth: 50, ... },
    autumn: { surfaceTemp: 9, mixedLayerDepth: 100, ... },
  },

  weather: {
    winter: { windMin: 25, windMax: 40, ssMin: 5, ssMax: 7, ... },
    spring: { ... },
    summer: { ... },
    autumn: { ... },
  },

  shipping: {
    zones: [
      { bounds: {...}, density: 'high' },
      { bounds: {...}, density: 'low' },
    ],
  },
};
```

---

## 8. Adding a New Location — Checklist

- [ ] Define bounding box (lat/lon corners + 10nm margin)
- [ ] Download GEBCO bathymetry grid, resample, export
- [ ] Download coastline, clip, rasterise, export
- [ ] Classify bottom type (data or simplified rules)
- [ ] Extract WOA temperature/salinity, compute SVP for 4 seasons
- [ ] Determine weather ranges per season
- [ ] Classify shipping density zones
- [ ] Assemble JS module in `src/config/locations/`
- [ ] Validate against nautical charts / published data
- [ ] Add to location index (`src/config/locations/index.js`)
- [ ] Create at least one scenario using the location
- [ ] Playtest — verify depth, coastline, detection ranges make sense
