import { DataPoint, MatrixConfig } from '@/types/matrix';

export function distributePoints(points: DataPoint[], config: MatrixConfig): DataPoint[] {
  if (points.length === 0) return points;

  const { xMin, xMax, yMin, yMax } = config;
  const margin = 0.3;
  const usableXMin = xMin + margin;
  const usableXMax = xMax - margin;
  const usableYMin = yMin + margin;
  const usableYMax = yMax - margin;

  const cols = Math.ceil(Math.sqrt(points.length));
  const rows = Math.ceil(points.length / cols);

  const cellW = (usableXMax - usableXMin) / Math.max(cols, 1);
  const cellH = (usableYMax - usableYMin) / Math.max(rows, 1);

  return points.map((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...p,
      x: Math.round((usableXMin + (col + 0.5) * cellW) * 100) / 100,
      y: Math.round((usableYMin + (row + 0.5) * cellH) * 100) / 100,
    };
  });
}
