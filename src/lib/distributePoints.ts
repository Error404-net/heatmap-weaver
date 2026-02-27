import { DataPoint, MatrixConfig } from '@/types/matrix';

// Gaussian-ish random using Box-Muller (clamped)
function gaussRandom(mean: number, stddev: number, min: number, max: number): number {
  const u1 = Math.random() || 0.001;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const val = mean + z * stddev;
  return Math.round(Math.max(min, Math.min(max, val)) * 100) / 100;
}

const QUADRANT_KEYWORDS: Record<string, { xRange: [number, number]; yRange: [number, number] }> = {
  'marry':   { xRange: [7, 10], yRange: [2, 5] },
  'wife':    { xRange: [7, 10], yRange: [2, 5] },
  'unicorn': { xRange: [7, 10], yRange: [7, 10] },
  'date':    { xRange: [7, 10], yRange: [5, 8] },
  'fun':     { xRange: [5, 8], yRange: [4, 7] },
  'danger':  { xRange: [5, 8], yRange: [7, 10] },
  'hot':     { xRange: [5, 8], yRange: [3, 7] },
  'crazy':   { xRange: [3, 6], yRange: [6, 9] },
  'nogo':    { xRange: [0, 5], yRange: [4, 10] },
  'no-go':   { xRange: [0, 5], yRange: [4, 10] },
  'no go':   { xRange: [0, 5], yRange: [4, 10] },
};

function detectQuadrant(p: DataPoint, midX: number, midY: number): { xRange: [number, number]; yRange: [number, number] } | null {
  // Check notes/category for keywords
  const text = ((p.notes || '') + ' ' + (p.category || '')).toLowerCase();
  for (const [keyword, range] of Object.entries(QUADRANT_KEYWORDS)) {
    if (text.includes(keyword)) return range;
  }
  // Fall back to current position quadrant
  return null;
}

export function distributePoints(points: DataPoint[], config: MatrixConfig): DataPoint[] {
  if (points.length === 0) return points;

  const { xMin, xMax, yMin, yMax } = config;
  const midX = (xMin + xMax) / 2;
  const midY = (yMin + yMax) / 2;
  const margin = 0.3;

  return points.map(p => {
    const quadrant = detectQuadrant(p, midX, midY);

    let rangeXMin: number, rangeXMax: number, rangeYMin: number, rangeYMax: number;

    if (quadrant) {
      rangeXMin = quadrant.xRange[0];
      rangeXMax = quadrant.xRange[1];
      rangeYMin = quadrant.yRange[0];
      rangeYMax = quadrant.yRange[1];
    } else {
      // Use current position's quadrant region
      if (p.x >= midX) {
        rangeXMin = midX + margin;
        rangeXMax = xMax - margin;
      } else {
        rangeXMin = xMin + margin;
        rangeXMax = midX - margin;
      }
      if (p.y >= midY) {
        rangeYMin = midY + margin;
        rangeYMax = yMax - margin;
      } else {
        rangeYMin = yMin + margin;
        rangeYMax = midY - margin;
      }
    }

    const cx = (rangeXMin + rangeXMax) / 2;
    const cy = (rangeYMin + rangeYMax) / 2;
    const spreadX = (rangeXMax - rangeXMin) / 2.5;
    const spreadY = (rangeYMax - rangeYMin) / 2.5;

    return {
      ...p,
      x: gaussRandom(cx, spreadX, rangeXMin, rangeXMax),
      y: gaussRandom(cy, spreadY, rangeYMin, rangeYMax),
    };
  });
}
