import React, { useRef, useState, useCallback } from 'react';
import { DataPoint, Zone, MatrixConfig, BackgroundConfig } from '@/types/matrix';

interface MatrixCanvasProps {
  config: MatrixConfig;
  zones: Zone[];
  points: DataPoint[];
  background: BackgroundConfig;
  onPointMove: (id: string, x: number, y: number) => void;
  onPointsMove: (moves: Array<{ id: string; x: number; y: number }>) => void;
  onPointClick: (id: string) => void;
  searchTerm: string;
  canvasRef: React.RefObject<HTMLDivElement>;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  placementMode?: boolean;
  onPlaceAt?: (x: number, y: number) => void;
}

const PADDING = 60;
const CANVAS_SIZE = 600;

export function MatrixCanvas({
  config, zones, points, background, onPointMove, onPointsMove, onPointClick, searchTerm, canvasRef,
  selectedIds = new Set(), onSelectedIdsChange, placementMode = false, onPlaceAt,
}: MatrixCanvasProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ cx: number; cy: number } | null>(null);
  const initialPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const svgRef = useRef<SVGSVGElement>(null);

  const { xMin, xMax, yMin, yMax } = config;
  const rangeX = xMax - xMin;
  const rangeY = yMax - yMin;

  const toCanvasX = useCallback((x: number) => PADDING + ((x - xMin) / rangeX) * CANVAS_SIZE, [rangeX, xMin]);
  const toCanvasY = useCallback((y: number) => PADDING + ((yMax - y) / rangeY) * CANVAS_SIZE, [rangeY, yMax]);
  const fromCanvasX = useCallback((cx: number) => xMin + ((cx - PADDING) / CANVAS_SIZE) * rangeX, [rangeX, xMin]);
  const fromCanvasY = useCallback((cy: number) => yMax - ((cy - PADDING) / CANVAS_SIZE) * rangeY, [rangeY, yMax]);

  const clampX = useCallback((x: number) => Math.max(xMin + 0.1, Math.min(xMax - 0.1, x)), [xMax, xMin]);
  const clampY = useCallback((y: number) => Math.max(yMin + 0.1, Math.min(yMax - 0.1, y)), [yMax, yMin]);

  const totalW = CANVAS_SIZE + PADDING * 2;
  const totalH = CANVAS_SIZE + PADDING * 2;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current || !dragStart) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (selectedIds.has(dragging) && selectedIds.size > 1) {
      const startDataX = fromCanvasX(dragStart.cx);
      const startDataY = fromCanvasY(dragStart.cy);
      const curDataX = fromCanvasX(cx);
      const curDataY = fromCanvasY(cy);
      const ddx = curDataX - startDataX;
      const ddy = curDataY - startDataY;

      const moves = Array.from(selectedIds).map(id => {
        const init = initialPositions.current.get(id);
        if (!init) return null;
        return {
          id,
          x: clampX(Math.round((init.x + ddx) * 100) / 100),
          y: clampY(Math.round((init.y + ddy) * 100) / 100),
        };
      }).filter(Boolean) as Array<{ id: string; x: number; y: number }>;
      onPointsMove(moves);
    } else {
      const x = clampX(Math.round(fromCanvasX(cx) * 100) / 100);
      const y = clampY(Math.round(fromCanvasY(cy) * 100) / 100);
      onPointMove(dragging, x, y);
    }
  }, [clampX, clampY, dragging, dragStart, selectedIds, fromCanvasX, fromCanvasY, onPointMove, onPointsMove]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    let newSelected = selectedIds;
    if (e.shiftKey) {
      newSelected = new Set(selectedIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      onSelectedIdsChange(newSelected);
    } else if (!selectedIds.has(id)) {
      newSelected = new Set([id]);
      onSelectedIdsChange(newSelected);
    }

    const posMap = new Map<string, { x: number; y: number }>();
    for (const sid of newSelected) {
      const p = points.find(pt => pt.id === sid);
      if (p) posMap.set(sid, { x: p.x, y: p.y });
    }
    initialPositions.current = posMap;

    setDragging(id);
    setDragStart({ cx: e.clientX - rect.left, cy: e.clientY - rect.top });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (placementMode && onPlaceAt && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const x = Math.round(fromCanvasX(cx) * 100) / 100;
      const y = Math.round(fromCanvasY(cy) * 100) / 100;
      onPlaceAt(clampX(x), clampY(y));
      return;
    }
    if ((e.target as Element) === svgRef.current || (e.target as Element).tagName === 'rect') {
      onSelectedIdsChange(new Set());
    }
  };

  const gridLines = [];
  for (let i = 0; i <= rangeX; i++) {
    const v = xMin + i;
    const cx = toCanvasX(v);
    gridLines.push(
      <line key={`vg-${i}`} x1={cx} y1={PADDING} x2={cx} y2={PADDING + CANVAS_SIZE}
        stroke="hsl(0,0%,70%)" strokeWidth={0.5} strokeDasharray={i === 0 ? undefined : '2,4'} />,
    );
    gridLines.push(
      <text key={`vl-${i}`} x={cx} y={PADDING + CANVAS_SIZE + 18} textAnchor="middle"
        fontSize={11} fill="hsl(var(--foreground))">{v}</text>,
    );
  }
  for (let i = 0; i <= rangeY; i++) {
    const v = yMin + i;
    const cy = toCanvasY(v);
    gridLines.push(
      <line key={`hg-${i}`} x1={PADDING} y1={cy} x2={PADDING + CANVAS_SIZE} y2={cy}
        stroke="hsl(0,0%,70%)" strokeWidth={0.5} strokeDasharray={i === 0 ? undefined : '2,4'} />,
    );
    gridLines.push(
      <text key={`hl-${i}`} x={PADDING - 8} y={cy + 4} textAnchor="end"
        fontSize={11} fill="hsl(var(--foreground))">{v}</text>,
    );
  }

  const isHighlighted = (p: DataPoint) => searchTerm && p.name.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <div ref={canvasRef} className="relative inline-block bg-card rounded-lg border border-border shadow-sm">
      <svg
        ref={svgRef}
        width={totalW}
        height={totalH}
        className={`select-none ${placementMode ? 'cursor-crosshair' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseUp={() => { setDragging(null); setDragStart(null); }}
        onMouseLeave={() => { setDragging(null); setDragStart(null); }}
        onClick={handleCanvasClick}
      >
        <defs>
          <pattern id="hatching" patternUnits="userSpaceOnUse" width={8} height={8}>
            <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="hsla(0,0%,50%,0.4)" strokeWidth={1.5} />
          </pattern>
          <linearGradient id="diagonal-zone-fade" gradientUnits="userSpaceOnUse" x1={PADDING} y1={PADDING + CANVAS_SIZE} x2={PADDING + CANVAS_SIZE} y2={PADDING}>
            <stop offset="0%" stopColor="hsla(0, 0%, 100%, 0)" />
            <stop offset="42%" stopColor="hsla(0, 0%, 100%, 0)" />
            <stop offset="50%" stopColor="hsla(0, 0%, 100%, 0.3)" />
            <stop offset="58%" stopColor="hsla(0, 0%, 100%, 0)" />
            <stop offset="100%" stopColor="hsla(0, 0%, 100%, 0)" />
          </linearGradient>
          <filter id="selected-point-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="hsl(45,100%,50%)" floodOpacity="0.75" />
          </filter>
          {zones.map(zone => (
            <clipPath key={`clip-${zone.id}`} id={`zone-clip-${zone.id}`}>
              <rect
                x={toCanvasX(zone.x1)}
                y={toCanvasY(zone.y2)}
                width={toCanvasX(zone.x2) - toCanvasX(zone.x1)}
                height={toCanvasY(zone.y1) - toCanvasY(zone.y2)}
              />
            </clipPath>
          ))}
        </defs>

        {background.imageUrl && (
          <image href={background.imageUrl} x={PADDING} y={PADDING} width={CANVAS_SIZE} height={CANVAS_SIZE} opacity={background.imageOpacity} preserveAspectRatio="xMinYMax slice" />
        )}

        {zones.map(zone => (
          <g key={zone.id}>
            <rect x={toCanvasX(zone.x1)} y={toCanvasY(zone.y2)} width={toCanvasX(zone.x2) - toCanvasX(zone.x1)} height={toCanvasY(zone.y1) - toCanvasY(zone.y2)} fill={zone.color} stroke="hsla(0,0%,0%,0.1)" strokeWidth={1} />
            {zone.imageUrl && (() => {
              const zw = toCanvasX(zone.x2) - toCanvasX(zone.x1);
              const zh = toCanvasY(zone.y1) - toCanvasY(zone.y2);
              const scale = zone.imageScale ?? 1.0;
              const sw = zw * scale;
              const sh = zh * scale;
              const cx = toCanvasX(zone.x1) + zw / 2;
              const cy = toCanvasY(zone.y2) + zh / 2;
              return <image href={zone.imageUrl} x={cx - sw / 2} y={cy - sh / 2} width={sw} height={sh} opacity={zone.imageOpacity ?? 0.3} preserveAspectRatio="xMidYMid slice" clipPath={`url(#zone-clip-${zone.id})`} />;
            })()}
            {zone.id === 'nogo' && <rect x={toCanvasX(zone.x1)} y={toCanvasY(zone.y2)} width={toCanvasX(zone.x2) - toCanvasX(zone.x1)} height={toCanvasY(zone.y1) - toCanvasY(zone.y2)} fill="url(#hatching)" />}
          </g>
        ))}

        {config.showDiagonal && zones.length > 0 && <rect x={PADDING} y={PADDING} width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#diagonal-zone-fade)" pointerEvents="none" />}

        {zones.map(zone => {
          const cx = (toCanvasX(zone.x1) + toCanvasX(zone.x2)) / 2;
          const cy = (toCanvasY(zone.y1) + toCanvasY(zone.y2)) / 2;
          return <text key={`zl-${zone.id}`} x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight={600} fill="hsla(0,0%,0%,0.6)" className="pointer-events-none">{zone.name}</text>;
        })}

        {gridLines}

        {config.showDiagonal && <line x1={toCanvasX(config.diagonalPoints.x1)} y1={toCanvasY(config.diagonalPoints.y1)} x2={toCanvasX(config.diagonalPoints.x2)} y2={toCanvasY(config.diagonalPoints.y2)} stroke="hsl(0,0%,20%)" strokeWidth={2.5} strokeDasharray="6,3" />}

        <text x={PADDING + CANVAS_SIZE / 2} y={totalH - 8} textAnchor="middle" fontSize={14} fontWeight={700} fill="hsl(var(--foreground))">{config.xAxisLabel}</text>
        <text x={14} y={PADDING + CANVAS_SIZE / 2} textAnchor="middle" fontSize={14} fontWeight={700} fill="hsl(var(--foreground))" transform={`rotate(-90, 14, ${PADDING + CANVAS_SIZE / 2})`}>{config.yAxisLabel}</text>
        <text x={totalW / 2} y={24} textAnchor="middle" fontSize={18} fontWeight={800} fill="hsl(var(--foreground))">{config.title}</text>

        {points.map(p => {
          const cx = Math.max(PADDING, Math.min(PADDING + CANVAS_SIZE, toCanvasX(p.x)));
          const cy = Math.max(PADDING, Math.min(PADDING + CANVAS_SIZE, toCanvasY(p.y)));
          const highlighted = isHighlighted(p);
          const dimmed = searchTerm && !highlighted;
          const selected = selectedIds.has(p.id);
          const iconSize = selected ? 20 : highlighted ? 18 : 14;
          const labelWidth = Math.max(36, p.name.length * 6.6);
          return (
            <g key={p.id} onMouseDown={(e) => handleMouseDown(e, p.id)} onClick={() => onPointClick(p.id)} className="cursor-grab active:cursor-grabbing" opacity={dimmed ? 0.2 : 1}>
              {selected && (
                <>
                  <circle cx={cx} cy={cy} r={iconSize / 2 + 8} fill="hsla(45,100%,50%,0.18)" filter="url(#selected-point-glow)" />
                  <circle cx={cx} cy={cy} r={iconSize / 2 + 5} fill="none" stroke="hsl(45,100%,50%)" strokeWidth={2.5} strokeDasharray="3,2" />
                </>
              )}
              {p.iconUrl ? (
                <image href={p.iconUrl} x={cx - iconSize / 2} y={cy - iconSize / 2} width={iconSize} height={iconSize} preserveAspectRatio="xMidYMid meet" />
              ) : (
                <circle cx={cx} cy={cy} r={highlighted ? 7 : 5} fill={highlighted ? 'hsl(45,100%,50%)' : 'hsl(220,80%,50%)'} stroke={selected ? 'hsl(45,100%,50%)' : 'hsl(0,0%,100%)'} strokeWidth={selected ? 2 : 1.5} />
              )}
              <rect x={cx + 8} y={cy - 11} width={labelWidth} height={18} rx={9} fill={selected ? 'hsla(45, 100%, 50%, 0.92)' : 'hsla(0,0%,100%,0.72)'} stroke={selected ? 'hsla(38, 92%, 35%, 0.9)' : 'hsla(0,0%,0%,0.08)'} strokeWidth={selected ? 1.2 : 1} />
              <text x={cx + 14} y={cy + 2} fontSize={selected ? 12.5 : 12} fontWeight={selected ? 700 : 500} fill="hsl(var(--foreground))">{p.name}</text>
            </g>
          );
        })}

        {placementMode && selectedIds.size > 0 && (
          <text x={totalW / 2} y={46} textAnchor="middle" fontSize={12} fontWeight={600} fill="hsl(var(--primary))">
            Click to place {selectedIds.size} point{selectedIds.size !== 1 ? 's' : ''}
          </text>
        )}
      </svg>
    </div>
  );
}
