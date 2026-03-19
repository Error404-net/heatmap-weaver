import { DataPoint, Zone } from '@/types/matrix';

const NAME_HINTS = ['name', 'label', 'title', 'browser', 'item', 'entity'];
const X_HINTS = ['x', 'hot', 'capability', 'score_x', 'hot_x'];
const Y_HINTS = ['y', 'crazy', 'risk', 'score_y', 'crazy_y'];
const CAT_HINTS = ['category', 'type', 'group', 'engine', 'class'];
const NOTES_HINTS = ['notes', 'description', 'comment'];
const ICON_URL_HINTS = ['icon_url', 'iconurl', 'icon', 'logo_url', 'logo'];
const PLACEMENT_HINTS = ['placement', 'suggested', 'quadrant', 'zone', 'position'];
const RECORD_TYPE_HINTS = ['record_type', 'recordtype', 'type'];
const COLOR_HINTS = ['color', 'fill'];
const X1_HINTS = ['x1', 'left'];
const Y1_HINTS = ['y1', 'bottom'];
const X2_HINTS = ['x2', 'right'];
const Y2_HINTS = ['y2', 'top'];
const IMAGE_URL_HINTS = ['image_url', 'imageurl', 'image'];
const IMAGE_OPACITY_HINTS = ['image_opacity', 'imageopacity'];
const IMAGE_SCALE_HINTS = ['image_scale', 'imagescale'];

const MATRIX_CSV_HEADER = [
  'record_type',
  'name',
  'x',
  'y',
  'category',
  'notes',
  'icon_url',
  'color',
  'x1',
  'y1',
  'x2',
  'y2',
  'image_url',
  'image_opacity',
  'image_scale',
] as const;

const SAMPLE_MATRIX_CSV = `record_type,name,x,y,category,notes,icon_url,color,x1,y1,x2,y2,image_url,image_opacity,image_scale
zone,Unicorn Zone,,,,,,hsla(300, 80%, 75%, 0.5),8,0,10,2,,,
zone,Wife Zone,,,,,,hsla(120, 70%, 55%, 0.5),8,2,10,5,,,
point,Example Browser,8.4,3.1,Enterprise Browser,Example plotted point,/data/browser-icons/chrome.svg,,,,,,,,
point,Example Privacy Browser,6.2,5.4,Specialized Browser,Example point-only import row,/data/browser-icons/tor.svg,,,,,,,,`;

// Keyword → approximate coordinate ranges for hot-crazy style matrix (0-10)
const PLACEMENT_MAP: Record<string, { xRange: [number, number]; yRange: [number, number] }> = {
  marry: { xRange: [7, 10], yRange: [2, 5] },
  wife: { xRange: [7, 10], yRange: [2, 5] },
  unicorn: { xRange: [8, 10], yRange: [0, 2] },
  date: { xRange: [8, 10], yRange: [5, 8] },
  'date zone': { xRange: [8, 10], yRange: [5, 8] },
  hot: { xRange: [5, 8], yRange: [3, 7] },
  fun: { xRange: [5, 8], yRange: [0, 5] },
  'fun zone': { xRange: [5, 8], yRange: [0, 5] },
  danger: { xRange: [5, 8], yRange: [5, 10] },
  'danger zone': { xRange: [5, 8], yRange: [5, 10] },
  crazy: { xRange: [3, 6], yRange: [6, 9] },
  nogo: { xRange: [0, 5], yRange: [0, 10] },
  'no-go': { xRange: [0, 5], yRange: [0, 10] },
  'no go': { xRange: [0, 5], yRange: [0, 10] },
  'no-go zone': { xRange: [0, 5], yRange: [0, 10] },
  'unicorn zone': { xRange: [8, 10], yRange: [0, 2] },
};

export interface ParsedMatrixCSV {
  points: DataPoint[];
  zones: Zone[];
  errors: string[];
  hasMatrixRecords: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function jitter(min: number, max: number): number {
  const raw = min + Math.random() * (max - min);
  const clamped = Math.max(0.3, Math.min(9.7, raw));
  return Math.round(clamped * 100) / 100;
}

function parsePlacement(text: string): { x: number; y: number } | null {
  const lower = text.toLowerCase();
  for (const [keyword, range] of Object.entries(PLACEMENT_MAP)) {
    if (lower.includes(keyword)) {
      return { x: jitter(range.xRange[0], range.xRange[1]), y: jitter(range.yRange[0], range.yRange[1]) };
    }
  }
  return { x: jitter(3, 7), y: jitter(3, 7) };
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function csvEscape(value: string | number | undefined): string {
  if (value === undefined) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function matchColumn(headers: string[], hints: string[]): number {
  for (const hint of hints) {
    const idx = headers.findIndex((h) => h === hint);
    if (idx !== -1) return idx;
  }
  for (const hint of hints) {
    const idx = headers.findIndex((h) => h.includes(hint));
    if (idx !== -1) return idx;
  }
  return -1;
}

function isNumericColumn(rows: string[][], colIdx: number): boolean {
  let numericCount = 0;
  const sample = rows.slice(0, 5);
  for (const row of sample) {
    const val = row[colIdx]?.trim();
    if (val && !Number.isNaN(Number.parseFloat(val))) numericCount += 1;
  }
  return sample.length > 0 && numericCount > sample.length * 0.5;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function parseMatrixCSV(text: string): ParsedMatrixCSV {
  const trimmed = text.trim();
  if (!trimmed) {
    return { points: [], zones: [], errors: ['CSV must have a header row and at least one data row'], hasMatrixRecords: false };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { points: [], zones: [], errors: ['CSV must have a header row and at least one data row'], hasMatrixRecords: false };
  }

  const header = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows = lines.slice(1).map(parseCsvLine);

  let nameIdx = matchColumn(header, NAME_HINTS);
  let xIdx = matchColumn(header, X_HINTS);
  let yIdx = matchColumn(header, Y_HINTS);
  const catIdx = matchColumn(header, CAT_HINTS);
  const notesIdx = matchColumn(header, NOTES_HINTS);
  const iconUrlIdx = matchColumn(header, ICON_URL_HINTS);
  const placementIdx = matchColumn(header, PLACEMENT_HINTS);
  const recordTypeIdx = matchColumn(header, RECORD_TYPE_HINTS);
  const colorIdx = matchColumn(header, COLOR_HINTS);
  const x1Idx = matchColumn(header, X1_HINTS);
  const y1Idx = matchColumn(header, Y1_HINTS);
  const x2Idx = matchColumn(header, X2_HINTS);
  const y2Idx = matchColumn(header, Y2_HINTS);
  const imageUrlIdx = matchColumn(header, IMAGE_URL_HINTS);
  const imageOpacityIdx = matchColumn(header, IMAGE_OPACITY_HINTS);
  const imageScaleIdx = matchColumn(header, IMAGE_SCALE_HINTS);

  if (nameIdx === -1 || xIdx === -1 || yIdx === -1) {
    const numericCols: number[] = [];
    const textCols: number[] = [];

    for (let i = 0; i < header.length; i += 1) {
      if (isNumericColumn(rows, i)) numericCols.push(i);
      else textCols.push(i);
    }

    if (nameIdx === -1 && textCols.length > 0) nameIdx = textCols[0];
    if (xIdx === -1 && numericCols.length >= 1) xIdx = numericCols[0];
    if (yIdx === -1 && numericCols.length >= 2) yIdx = numericCols[1];
  }

  if (nameIdx === -1) {
    return {
      points: [],
      zones: [],
      errors: ['Could not detect a name column. Use a column like: name, browser, label'],
      hasMatrixRecords: false,
    };
  }

  const points: DataPoint[] = [];
  const zones: Zone[] = [];
  const errors: string[] = [];
  let hasMatrixRecords = false;

  rows.forEach((cols, index) => {
    const rowNumber = index + 2;
    const recordType = recordTypeIdx !== -1 ? (cols[recordTypeIdx] || '').trim().toLowerCase() : '';
    const isZoneRecord = recordType === 'zone';
    const isPointRecord = recordType === 'point' || recordType === '';

    if (recordType) hasMatrixRecords = true;
    if (recordType && !isZoneRecord && !isPointRecord) {
      errors.push(`Row ${rowNumber}: unsupported record_type "${recordType}"`);
      return;
    }

    const name = cols[nameIdx]?.trim();
    if (!name) {
      errors.push(`Row ${rowNumber}: missing name`);
      return;
    }

    if (isZoneRecord) {
      const x1 = parseOptionalNumber(x1Idx !== -1 ? cols[x1Idx] : undefined);
      const y1 = parseOptionalNumber(y1Idx !== -1 ? cols[y1Idx] : undefined);
      const x2 = parseOptionalNumber(x2Idx !== -1 ? cols[x2Idx] : undefined);
      const y2 = parseOptionalNumber(y2Idx !== -1 ? cols[y2Idx] : undefined);
      const color = colorIdx !== -1 ? cols[colorIdx] : '';

      if ([x1, y1, x2, y2].some((value) => value === undefined)) {
        errors.push(`Row ${rowNumber}: zone rows require x1, y1, x2, and y2`);
        return;
      }

      zones.push({
        id: generateId(),
        name,
        color: color || 'hsla(0, 0%, 75%, 0.4)',
        x1: x1!,
        y1: y1!,
        x2: x2!,
        y2: y2!,
        imageUrl: imageUrlIdx !== -1 ? cols[imageUrlIdx] || undefined : undefined,
        imageOpacity: parseOptionalNumber(imageOpacityIdx !== -1 ? cols[imageOpacityIdx] : undefined),
        imageScale: parseOptionalNumber(imageScaleIdx !== -1 ? cols[imageScaleIdx] : undefined),
      });
      return;
    }

    if (isPointRecord) {
      let x: number | undefined;
      let y: number | undefined;

      if (xIdx !== -1 && yIdx !== -1) {
        const px = parseOptionalNumber(cols[xIdx]);
        const py = parseOptionalNumber(cols[yIdx]);
        if (px !== undefined && py !== undefined) {
          x = px;
          y = py;
        }
      }

      if ((x === undefined || y === undefined) && placementIdx !== -1) {
        const coords = parsePlacement(cols[placementIdx] || '');
        if (coords) {
          x = coords.x;
          y = coords.y;
        }
      }

      if (x === undefined || y === undefined) {
        x = jitter(3, 7);
        y = jitter(3, 7);
      }

      points.push({
        id: generateId(),
        name,
        x,
        y,
        category: catIdx !== -1 ? cols[catIdx] || undefined : undefined,
        notes: notesIdx !== -1 ? cols[notesIdx] || undefined : placementIdx !== -1 ? cols[placementIdx] || undefined : undefined,
        iconUrl: iconUrlIdx !== -1 ? cols[iconUrlIdx] || undefined : undefined,
      });
    }
  });

  return { points, zones, errors, hasMatrixRecords };
}

export function parseCSV(text: string): { points: DataPoint[]; errors: string[] } {
  const { points, errors } = parseMatrixCSV(text);
  return { points, errors };
}

export function matrixToCSV(points: DataPoint[], zones: Zone[]): string {
  const rows = [MATRIX_CSV_HEADER.join(',')];

  zones.forEach((zone) => {
    rows.push([
      'zone',
      csvEscape(zone.name),
      '',
      '',
      '',
      '',
      '',
      csvEscape(zone.color),
      csvEscape(zone.x1),
      csvEscape(zone.y1),
      csvEscape(zone.x2),
      csvEscape(zone.y2),
      csvEscape(zone.imageUrl),
      csvEscape(zone.imageOpacity),
      csvEscape(zone.imageScale),
    ].join(','));
  });

  points.forEach((point) => {
    rows.push([
      'point',
      csvEscape(point.name),
      csvEscape(point.x),
      csvEscape(point.y),
      csvEscape(point.category),
      csvEscape(point.notes),
      csvEscape(point.iconUrl),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ].join(','));
  });

  return rows.join('\n');
}

export function pointsToCSV(points: DataPoint[]): string {
  const header = 'name,x,y,category,notes,icon_url';
  const rows = points.map((point) => [
    csvEscape(point.name),
    csvEscape(point.x),
    csvEscape(point.y),
    csvEscape(point.category),
    csvEscape(point.notes),
    csvEscape(point.iconUrl),
  ].join(','));
  return [header, ...rows].join('\n');
}

export const SAMPLE_CSV = `name,x,y,category,notes,icon_url
Example Item A,7.5,3.2,Good,Top performer,
Example Item B,4.0,6.8,Risky,Needs review,
Example Item C,8.5,2.0,Great,Best in class,
Example Item D,2.5,8.5,Avoid,Too unstable,`;

function downloadBlob(contents: string, filename: string) {
  const blob = new Blob([contents], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSampleCSV() {
  downloadBlob(SAMPLE_CSV, 'matrix_template.csv');
}

export function downloadSampleMatrixCSV() {
  downloadBlob(SAMPLE_MATRIX_CSV, 'matrix_state_template.csv');
}
