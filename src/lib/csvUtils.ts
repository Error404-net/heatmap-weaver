import { DataPoint } from '@/types/matrix';

const NAME_HINTS = ['name', 'label', 'title', 'browser', 'item', 'entity'];
const X_HINTS = ['x', 'hot', 'capability', 'score_x', 'hot_x'];
const Y_HINTS = ['y', 'crazy', 'risk', 'score_y', 'crazy_y'];
const CAT_HINTS = ['category', 'type', 'group', 'engine', 'class'];
const NOTES_HINTS = ['notes', 'description', 'comment'];
const PLACEMENT_HINTS = ['placement', 'suggested', 'quadrant', 'zone', 'position'];

// Keyword → approximate coordinate ranges for hot-crazy style matrix (0-10)
const PLACEMENT_MAP: Record<string, { xRange: [number, number]; yRange: [number, number] }> = {
  'marry':   { xRange: [8, 10], yRange: [3, 5] },
  'wife':    { xRange: [8, 10], yRange: [3, 5] },
  'unicorn': { xRange: [8, 10], yRange: [8, 10] },
  'date':    { xRange: [8, 10], yRange: [5, 8] },
  'hot':     { xRange: [5, 8], yRange: [4, 7] },
  'fun':     { xRange: [5, 8], yRange: [4, 7] },
  'danger':  { xRange: [5, 8], yRange: [7, 10] },
  'crazy':   { xRange: [3, 6], yRange: [6, 9] },
  'nogo':    { xRange: [0, 5], yRange: [4, 10] },
  'no-go':   { xRange: [0, 5], yRange: [4, 10] },
  'no go':   { xRange: [0, 5], yRange: [4, 10] },
};

function jitter(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function parsePlacement(text: string): { x: number; y: number } | null {
  const lower = text.toLowerCase();
  for (const [keyword, range] of Object.entries(PLACEMENT_MAP)) {
    if (lower.includes(keyword)) {
      return { x: jitter(range.xRange[0], range.xRange[1]), y: jitter(range.yRange[0], range.yRange[1]) };
    }
  }
  // Default center
  return { x: jitter(3, 7), y: jitter(3, 7) };
}

function matchColumn(headers: string[], hints: string[]): number {
  for (const hint of hints) {
    const idx = headers.findIndex(h => h === hint);
    if (idx !== -1) return idx;
  }
  for (const hint of hints) {
    const idx = headers.findIndex(h => h.includes(hint));
    if (idx !== -1) return idx;
  }
  return -1;
}

function isNumericColumn(lines: string[], colIdx: number): boolean {
  let numericCount = 0;
  const sample = lines.slice(1, Math.min(6, lines.length));
  for (const line of sample) {
    const val = line.split(',')[colIdx]?.trim();
    if (val && !isNaN(parseFloat(val))) numericCount++;
  }
  return numericCount > sample.length * 0.5;
}

export function parseCSV(text: string): { points: DataPoint[]; errors: string[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { points: [], errors: ['CSV must have a header row and at least one data row'] };

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  
  let nameIdx = matchColumn(header, NAME_HINTS);
  let xIdx = matchColumn(header, X_HINTS);
  let yIdx = matchColumn(header, Y_HINTS);
  const catIdx = matchColumn(header, CAT_HINTS);
  const notesIdx = matchColumn(header, NOTES_HINTS);
  const placementIdx = matchColumn(header, PLACEMENT_HINTS);

  // Fallback: first text column as name, first two numeric columns as x/y
  if (nameIdx === -1 || xIdx === -1 || yIdx === -1) {
    const numericCols: number[] = [];
    const textCols: number[] = [];
    
    for (let i = 0; i < header.length; i++) {
      if (isNumericColumn(lines, i)) numericCols.push(i);
      else textCols.push(i);
    }

    if (nameIdx === -1 && textCols.length > 0) nameIdx = textCols[0];
    if (xIdx === -1 && numericCols.length >= 1) xIdx = numericCols[0];
    if (yIdx === -1 && numericCols.length >= 2) yIdx = numericCols[1];
  }

  // x/y and placement columns are optional; per-row fallback handles missing values

  if (nameIdx === -1) {
    return { points: [], errors: ['Could not detect a name column. Use a column like: name, browser, label'] };
  }

  const points: DataPoint[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const name = cols[nameIdx];
    if (!name) { errors.push(`Row ${i + 1}: missing name`); continue; }

    let x: number | undefined;
    let y: number | undefined;

    // Try numeric x/y first
    if (xIdx !== -1 && yIdx !== -1) {
      const px = parseFloat(cols[xIdx]);
      const py = parseFloat(cols[yIdx]);
      if (!isNaN(px) && !isNaN(py)) { x = px; y = py; }
    }

    // Fallback: placement column
    if (x === undefined || y === undefined) {
      if (placementIdx !== -1) {
        const coords = parsePlacement(cols[placementIdx] || '');
        if (coords) { x = coords.x; y = coords.y; }
      }
    }

    // Final fallback: random center
    if (x === undefined || y === undefined) {
      x = jitter(3, 7);
      y = jitter(3, 7);
    }

    points.push({
      id: Math.random().toString(36).slice(2, 10),
      name,
      x, y,
      category: catIdx !== -1 ? cols[catIdx] : undefined,
      notes: notesIdx !== -1 ? cols[notesIdx] : (placementIdx !== -1 ? cols[placementIdx] : undefined),
    });
  }

  return { points, errors };
}

export function pointsToCSV(points: DataPoint[]): string {
  const header = 'name,x,y,category,notes';
  const rows = points.map(p =>
    `${p.name},${p.x},${p.y},${p.category || ''},${p.notes || ''}`
  );
  return [header, ...rows].join('\n');
}

export const SAMPLE_CSV = `name,x,y,category,notes
Example Item A,7.5,3.2,Good,Top performer
Example Item B,4.0,6.8,Risky,Needs review
Example Item C,8.5,2.0,Great,Best in class
Example Item D,2.5,8.5,Avoid,Too unstable`;

export function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'matrix_template.csv'; a.click();
  URL.revokeObjectURL(url);
}
