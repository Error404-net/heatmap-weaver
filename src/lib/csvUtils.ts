import { DataPoint } from '@/types/matrix';

const NAME_HINTS = ['name', 'label', 'title', 'browser', 'item', 'entity'];
const X_HINTS = ['x', 'hot', 'capability', 'score_x', 'hot_x'];
const Y_HINTS = ['y', 'crazy', 'risk', 'score_y', 'crazy_y'];
const CAT_HINTS = ['category', 'type', 'group', 'engine', 'class'];
const NOTES_HINTS = ['notes', 'description', 'placement', 'comment', 'suggested'];

function matchColumn(headers: string[], hints: string[]): number {
  // Exact match first
  for (const hint of hints) {
    const idx = headers.findIndex(h => h === hint);
    if (idx !== -1) return idx;
  }
  // Partial match
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
  
  // Smart column detection
  let nameIdx = matchColumn(header, NAME_HINTS);
  let xIdx = matchColumn(header, X_HINTS);
  let yIdx = matchColumn(header, Y_HINTS);
  const catIdx = matchColumn(header, CAT_HINTS);
  const notesIdx = matchColumn(header, NOTES_HINTS);

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

  if (nameIdx === -1 || xIdx === -1 || yIdx === -1) {
    return { points: [], errors: ['Could not detect name, x, and y columns. Use columns like: name, x, y'] };
  }

  const points: DataPoint[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const name = cols[nameIdx];
    const x = parseFloat(cols[xIdx]);
    const y = parseFloat(cols[yIdx]);

    if (!name) { errors.push(`Row ${i + 1}: missing name`); continue; }
    if (isNaN(x) || isNaN(y)) { errors.push(`Row ${i + 1}: invalid x/y`); continue; }

    points.push({
      id: Math.random().toString(36).slice(2, 10),
      name,
      x, y,
      category: catIdx !== -1 ? cols[catIdx] : undefined,
      notes: notesIdx !== -1 ? cols[notesIdx] : undefined,
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
