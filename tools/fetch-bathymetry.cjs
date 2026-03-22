#!/usr/bin/env node
// ── Fetch GEBCO bathymetry data for a location ──────────────────────────
// One-time data collection script. Outputs a static JS module.
//
// Usage: node tools/fetch-bathymetry.js
//
// Source: Open Topo Data API (https://www.opentopodata.org/)
// Dataset: GEBCO 2020 (15 arc-second global bathymetry)
// Limits: 100 locations/request, 1 request/second, 1000 requests/day
//
// Process:
// 1. Define bounding box from centre lat/lon and size in nm
// 2. Calculate grid points at 1nm resolution (adjusted for latitude)
// 3. Batch-fetch depths from API (100 points per request)
// 4. Write static JS module to src/config/locations/

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Configuration ────────────────────────────────────────────────────────
const CENTRE_LAT = 63.5;
const CENTRE_LON = -12.5;
const SIZE_NM = 120;
const GRID_SIZE = 120; // 1nm per cell
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'config', 'locations', 'giuk-gap-bathymetry.json');
const API_BASE = 'https://api.opentopodata.org/v1/gebco2020';
const BATCH_SIZE = 100;
const DELAY_MS = 1100; // slightly over 1s to respect rate limit

// ── Calculate bounds ─────────────────────────────────────────────────────
const latSpan = SIZE_NM / 60; // degrees (60nm per degree latitude)
const lonPerDeg = 60 * Math.cos(CENTRE_LAT * Math.PI / 180);
const lonSpan = SIZE_NM / lonPerDeg;

const NORTH = CENTRE_LAT + latSpan / 2;
const SOUTH = CENTRE_LAT - latSpan / 2;
const WEST = CENTRE_LON - lonSpan / 2;
const EAST = CENTRE_LON + lonSpan / 2;

console.log(`Centre: ${CENTRE_LAT}°N, ${CENTRE_LON}°W`);
console.log(`Bounds: ${SOUTH.toFixed(4)}°N to ${NORTH.toFixed(4)}°N, ${WEST.toFixed(4)}°W to ${EAST.toFixed(4)}°W`);
console.log(`Grid: ${GRID_SIZE}×${GRID_SIZE} (${GRID_SIZE * GRID_SIZE} points)`);

// ── Generate grid points ─────────────────────────────────────────────────
const points = [];
for (let row = 0; row < GRID_SIZE; row++) {
  for (let col = 0; col < GRID_SIZE; col++) {
    // Row 0 = north, row 119 = south (matches game: y=0 is top/north)
    const lat = NORTH - (row / (GRID_SIZE - 1)) * (NORTH - SOUTH);
    const lon = WEST + (col / (GRID_SIZE - 1)) * (EAST - WEST);
    points.push({ row, col, lat, lon });
  }
}

// ── Batch fetch from API ─────────────────────────────────────────────────
function fetchBatch(locations) {
  const locStr = locations.map(p => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`).join('|');
  const url = `${API_BASE}?locations=${locStr}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status !== 'OK') reject(new Error(`API error: ${json.status}`));
          resolve(json.results.map(r => r.elevation));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const grid = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
  const batches = [];
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    batches.push(points.slice(i, i + BATCH_SIZE));
  }

  console.log(`Fetching ${batches.length} batches (${BATCH_SIZE} points each)...`);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    try {
      const elevations = await fetchBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        const { row, col } = batch[j];
        // Convert elevation to positive depth (GEBCO returns negative for ocean)
        grid[row][col] = Math.round(Math.abs(elevations[j]));
      }
      process.stdout.write(`  Batch ${bi + 1}/${batches.length} done\r`);
    } catch (e) {
      console.error(`\n  Batch ${bi + 1} FAILED: ${e.message}. Retrying...`);
      await sleep(3000);
      bi--; // retry
      continue;
    }
    if (bi < batches.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nFetch complete. Writing to ${OUTPUT_FILE}`);

  // ── Output ───────────────────────────────────────────────────────────
  const output = {
    meta: {
      source: 'GEBCO 2020 via Open Topo Data API',
      fetchDate: new Date().toISOString().split('T')[0],
      centre: { lat: CENTRE_LAT, lon: CENTRE_LON },
      bounds: { north: NORTH, south: SOUTH, east: EAST, west: WEST },
      gridSize: GRID_SIZE,
      resolutionNM: 1,
      notes: 'Depth in metres (positive = below sea level). Row 0 = north, col 0 = west.',
    },
    grid,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 0));
  console.log(`Written ${fs.statSync(OUTPUT_FILE).size} bytes.`);

  // Stats
  const flat = grid.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const avg = Math.round(flat.reduce((a, b) => a + b, 0) / flat.length);
  const land = flat.filter(d => d <= 0).length;
  console.log(`Depth range: ${min}m to ${max}m (avg ${avg}m). Land cells: ${land}`);
}

main().catch(e => { console.error(e); process.exit(1); });
