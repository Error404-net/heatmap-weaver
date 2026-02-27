import { DataPoint } from '@/types/matrix';

export function parseCSV(text: string): { points: DataPoint[]; errors: string[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { points: [], errors: ['CSV must have a header row and at least one data row'] };

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const xIdx = header.indexOf('x');
  const yIdx = header.indexOf('y');
  const catIdx = header.indexOf('category');
  const notesIdx = header.indexOf('notes');

  if (nameIdx === -1 || xIdx === -1 || yIdx === -1) {
    return { points: [], errors: ['CSV must have columns: name, x, y'] };
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
