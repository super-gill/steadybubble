'use strict';

// ── Los Angeles Class (688 / 688i) DC Panel Outline ─────────────────────
// Draws the pressure hull with 3 WTS compartments, watertight bulkheads,
// and external equipment (bow array, propshaft, VLS if 688i).
//
// This replaces the generic pill shape for the LA class vessels.
// The pressure hull is a rounded rectangle (pill). External equipment
// is drawn outside the hull boundary.

/**
 * Draw the 688 hull outline and return geometry for compartment rendering.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Function} U - scaling function
 * @param {object} bounds - { schX, schW, schY, schH } - bounding box for the schematic area
 * @param {object} dmg - player.damage state
 * @param {object} opts - { compKeys, compFracs, compLabels, vesselKey }
 * @returns {object} { hullPath, phTop, phBot, phMid, phR, phX0, phX1, compXs, compWs, extGeo }
 */
export function draw688Outline(ctx, U, bounds, dmg, opts) {
  const { schX, schW, schY } = bounds;
  const { vesselKey } = opts;

  // ── Pressure hull geometry ────────────────────────────────────────────
  // Hull occupies the central portion. External equipment on either side.
  const extBowW  = U(36);   // space reserved for bow array (+ VLS if 688i)
  const extSternW = U(28);  // space reserved for propshaft

  const phX0  = schX + extSternW;         // hull left (stern end)
  const phX1  = schX + schW - extBowW;    // hull right (bow end)
  const phTop = schY + U(44);
  const phBot = schY + U(114);
  const phMid = (phTop + phBot) * 0.5;
  const phR   = (phBot - phTop) * 0.5;
  const phSpan = phX1 - phX0;

  // ── Hull path (pressure hull — pill shape) ────────────────────────────
  function hullPath() {
    ctx.beginPath();
    ctx.arc(phX0, phMid, phR, Math.PI * 0.5, -Math.PI * 0.5, false);
    ctx.lineTo(phX1, phTop);
    ctx.arc(phX1, phMid, phR, -Math.PI * 0.5, Math.PI * 0.5, false);
    ctx.lineTo(phX0, phBot);
    ctx.closePath();
  }

  // ── Compartment positions ─────────────────────────────────────────────
  const compFracs = opts.compFracs;
  const compXs = [], compWs = [];
  { let xx = phX0;
    for (let i = 0; i < compFracs.length; i++) {
      compWs[i] = phSpan * compFracs[i];
      compXs[i] = xx;
      xx += compWs[i];
    }
  }

  // ── Draw external equipment ───────────────────────────────────────────

  // Propshaft (stern — left side)
  const propX0 = schX + U(4);
  const propX1 = phX0 - phR * 0.3;
  const propY  = phMid;
  ctx.strokeStyle = 'rgba(120,150,200,0.45)';
  ctx.lineWidth = U(2);
  ctx.beginPath();
  ctx.moveTo(propX0, propY);
  ctx.lineTo(propX1, propY);
  ctx.stroke();
  // Propeller disc
  ctx.strokeStyle = 'rgba(140,170,220,0.55)';
  ctx.lineWidth = U(1.5);
  const propR = (phBot - phTop) * 0.35;
  ctx.beginPath();
  ctx.arc(propX0, propY, propR, 0, Math.PI * 2);
  ctx.stroke();
  // Propeller blades (simple cross)
  for (let b = 0; b < 7; b++) {
    const ang = b * Math.PI * 2 / 7;
    ctx.beginPath();
    ctx.moveTo(propX0 + Math.cos(ang) * U(3), propY + Math.sin(ang) * U(3));
    ctx.lineTo(propX0 + Math.cos(ang) * propR * 0.9, propY + Math.sin(ang) * propR * 0.9);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(propX0, propY, U(2.5), 0, Math.PI * 2); ctx.stroke();

  // Label: PROPSHAFT
  ctx.fillStyle = 'rgba(100,130,170,0.45)';
  ctx.font = `${U(7)}px ui-monospace,monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('SHAFT', propX0, phBot + U(10));

  // Bow array (bow — right side)
  const bowX0 = phX1 + phR * 0.3;
  const bowX1 = schX + schW - U(4);
  const bowMidX = (bowX0 + bowX1) * 0.5;
  const bowH = (phBot - phTop) * 0.55;
  ctx.strokeStyle = 'rgba(120,160,220,0.50)';
  ctx.lineWidth = U(1.5);
  ctx.beginPath();
  ctx.roundRect(bowX0, phMid - bowH * 0.5, bowX1 - bowX0, bowH, U(3));
  ctx.stroke();
  // Sonar array pattern (horizontal lines)
  ctx.strokeStyle = 'rgba(80,130,200,0.30)';
  ctx.lineWidth = U(0.5);
  for (let s = 0; s < 4; s++) {
    const sy = phMid - bowH * 0.35 + (bowH * 0.7) * s / 3;
    ctx.beginPath();
    ctx.moveTo(bowX0 + U(2), sy);
    ctx.lineTo(bowX1 - U(2), sy);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(100,130,170,0.45)';
  ctx.font = `${U(7)}px ui-monospace,monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('BOW ARRAY', bowMidX, phBot + U(10));

  // VLS (688i only — between bow array and hull)
  if (vesselKey === '688i') {
    const vlsX = bowX0 - U(14);
    const vlsW = U(10);
    const vlsH = (phBot - phTop) * 0.4;
    ctx.strokeStyle = 'rgba(180,140,60,0.55)';
    ctx.lineWidth = U(1);
    ctx.beginPath();
    ctx.roundRect(vlsX, phMid - vlsH * 0.5, vlsW, vlsH, U(2));
    ctx.stroke();
    // VLS cell grid
    ctx.strokeStyle = 'rgba(180,140,60,0.30)';
    for (let v = 0; v < 3; v++) {
      const vy = phMid - vlsH * 0.35 + (vlsH * 0.7) * v / 2;
      ctx.beginPath();
      ctx.moveTo(vlsX + U(1), vy);
      ctx.lineTo(vlsX + vlsW - U(1), vy);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(180,150,70,0.50)';
    ctx.font = `${U(6)}px ui-monospace,monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('VLS', vlsX + vlsW * 0.5, phMid + vlsH * 0.5 + U(8));
  }

  // ── Draw pressure hull outline ────────────────────────────────────────
  hullPath();
  ctx.strokeStyle = 'rgba(80,120,180,0.50)';
  ctx.lineWidth = U(1.5);
  ctx.stroke();

  // Label: PRESSURE HULL (subtle, below hull)
  ctx.fillStyle = 'rgba(80,110,150,0.30)';
  ctx.font = `${U(7)}px ui-monospace,monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('PRESSURE HULL', (phX0 + phX1) * 0.5, phBot + U(10));

  // ── Draw watertight bulkhead dividers ─────────────────────────────────
  // Bulkheads are between compartments — drawn as solid lines (not dashed)
  ctx.save();
  hullPath();
  ctx.clip();
  for (let ci = 1; ci < compXs.length; ci++) {
    const x = compXs[ci];
    ctx.strokeStyle = 'rgba(140,170,220,0.65)';
    ctx.lineWidth = U(2);
    ctx.beginPath();
    ctx.moveTo(x, phTop + U(2));
    ctx.lineTo(x, phBot - U(2));
    ctx.stroke();
  }
  ctx.restore();

  // ── Return geometry for compartment rendering ─────────────────────────
  return {
    hullPath,
    phTop, phBot, phMid, phR,
    phX0, phX1, phSpan,
    compXs, compWs,
  };
}
