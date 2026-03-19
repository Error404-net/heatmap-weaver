import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { matrixToCSV, parseMatrixCSV } from '@/lib/csvUtils';
import { PRESETS } from '@/lib/presets';
import type { DataPoint, Zone } from '@/types/matrix';

describe('csvUtils matrix CSV support', () => {
  it('preserves point coordinates during matrix CSV round-trip', () => {
    const points: DataPoint[] = [
      { id: 'alpha', name: 'Alpha', x: 9.41, y: 1.07, category: 'Unicorn', notes: 'seed' },
      { id: 'beta', name: 'Beta', x: 6.23, y: 4.88, category: 'Mainstream', notes: 'round-trip' },
    ];

    const parsed = parseMatrixCSV(matrixToCSV(points, []));

    expect(parsed.errors).toEqual([]);
    expect(parsed.points).toHaveLength(2);
    expect(parsed.points.map(({ name, x, y }) => ({ name, x, y }))).toEqual([
      { name: 'Alpha', x: 9.41, y: 1.07 },
      { name: 'Beta', x: 6.23, y: 4.88 },
    ]);
  });

  it('round-trips zones including coordinates and styling metadata', () => {
    const zones: Zone[] = [
      {
        id: 'unicorn',
        name: 'Unicorn Zone',
        color: 'hsla(300, 80%, 75%, 0.5)',
        x1: 8,
        y1: 0,
        x2: 10,
        y2: 2,
        imageUrl: 'https://example.com/unicorn.png',
        imageOpacity: 0.45,
        imageScale: 1.2,
      },
    ];

    const parsed = parseMatrixCSV(matrixToCSV([], zones));

    expect(parsed.errors).toEqual([]);
    expect(parsed.zones).toHaveLength(1);
    expect(parsed.zones[0]).toMatchObject({
      name: 'Unicorn Zone',
      color: 'hsla(300, 80%, 75%, 0.5)',
      x1: 8,
      y1: 0,
      x2: 10,
      y2: 2,
      imageUrl: 'https://example.com/unicorn.png',
      imageOpacity: 0.45,
      imageScale: 1.2,
    });
  });

  it('remains backward compatible with point-only CSV files', () => {
    const csv = 'name,x,y,category,notes\nFirefox,7,4.8,Mainstream Browser,legacy import';
    const parsed = parseMatrixCSV(csv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.hasMatrixRecords).toBe(false);
    expect(parsed.zones).toEqual([]);
    expect(parsed.points).toHaveLength(1);
    expect(parsed.points[0]).toMatchObject({ name: 'Firefox', x: 7, y: 4.8 });
  });

  it('loads the Enterprise Browsers seed with Google Ultron in the unicorn zone', () => {
    const csvPath = path.resolve(__dirname, '../../public/data/enterprise-browsers.csv');
    const parsed = parseMatrixCSV(fs.readFileSync(csvPath, 'utf8'));
    const unicornZone = PRESETS.find((preset) => preset.id === 'enterprise-browsers')?.zones.find((zone) => zone.id === 'unicorn');
    const googleUltron = parsed.points.find((point) => point.name === 'Google Ultron');

    expect(parsed.errors).toEqual([]);
    expect(parsed.points.some((point) => point.name === 'Safari')).toBe(true);
    expect(parsed.points.some((point) => point.name === 'Firefox')).toBe(true);
    expect(googleUltron).toBeDefined();
    expect(unicornZone).toBeDefined();
    expect(googleUltron!.x).toBeGreaterThanOrEqual(unicornZone!.x1);
    expect(googleUltron!.x).toBeLessThanOrEqual(unicornZone!.x2);
    expect(googleUltron!.y).toBeGreaterThanOrEqual(unicornZone!.y1);
    expect(googleUltron!.y).toBeLessThanOrEqual(unicornZone!.y2);
  });
});
