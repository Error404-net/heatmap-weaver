import React, { useRef, useState, useCallback } from 'react';
import { DataPoint, Zone, MatrixConfig, BackgroundConfig } from '@/types/matrix';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MatrixCanvasProps {
  config: MatrixConfig;
  zones: Zone[];
  points: DataPoint[];
  background: BackgroundConfig;
  onPointMove: (id: string, x: number, y: number) => void;
  onPointClick: (id: string) => void;
  searchTerm: string;
  canvasRef: React.RefObject<HTMLDivElement>;
}

const PADDING = 60;
const CANVAS_SIZE = 600;

export function MatrixCanvas({
  config, zones, points, background, onPointMove, onPointClick, searchTerm, canvasRef,
}: MatrixCanvasProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { xMin, xMax, yMin, yMax } = config;
  const rangeX = xMax - xMin;
  const rangeY = yMax - yMin;

  const toCanvasX = (x: number) => PADDING + ((x - xMin) / rangeX) * CANVAS_SIZE;
  const toCanvasY = (y: number) => PADDING + ((yMax - y) / rangeY) * CANVAS_SIZE;
  const fromCanvasX = (cx: number) => xMin + ((cx - PADDING) / CANVAS_SIZE) * rangeX;
  const fromCanvasY = (cy: number) => yMax - ((cy - PADDING) / CANVAS_SIZE) * rangeY;

  const totalW = CANVAS_SIZE + PADDING * 2;
  const totalH = CANVAS_SIZE + PADDING * 2;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const x = Math.round(fromCanvasX(cx) * 100) / 100;
    const y = Math.round(fromCanvasY(cy) * 100) / 100;
    onPointMove(dragging, Math.max(xMin, Math.min(xMax, x)), Math.max(yMin, Math.min(yMax, y)));
  }, [dragging, fromCanvasX, fromCanvasY, onPointMove, xMin, xMax, yMin, yMax]);

  const gridLines = [];
  for (let i = 0; i <= rangeX; i++) {
    const v = xMin + i;
    const cx = toCanvasX(v);
    gridLines.push(
      <line key={`vg-${i}`} x1={cx} y1={PADDING} x2={cx} y2={PADDING + CANVAS_SIZE}
        stroke="hsl(0,0%,70%)" strokeWidth={0.5} strokeDasharray={i === 0 ? undefined : "2,4"} />
    );
    gridLines.push(
      <text key={`vl-${i}`} x={cx} y={PADDING + CANVAS_SIZE + 18} textAnchor="middle"
        fontSize={11} fill="hsl(0,0%,40%)">{v}</text>
    );
  }
  for (let i = 0; i <= rangeY; i++) {
    const v = yMin + i;
    const cy = toCanvasY(v);
    gridLines.push(
      <line key={`hg-${i}`} x1={PADDING} y1={cy} x2={PADDING + CANVAS_SIZE} y2={cy}
        stroke="hsl(0,0%,70%)" strokeWidth={0.5} strokeDasharray={i === 0 ? undefined : "2,4"} />
    );
    gridLines.push(
      <text key={`hl-${i}`} x={PADDING - 8} y={cy + 4} textAnchor="end"
        fontSize={11} fill="hsl(0,0%,40%)">{v}</text>
    );
  }

  const isHighlighted = (p: DataPoint) =>
    searchTerm && p.name.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <div ref={canvasRef} className="relative inline-block bg-card rounded-lg border border-border shadow-sm">
      <svg
        ref={svgRef}
        width={totalW}
        height={totalH}
        className="select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        {/* Background image */}
        {background.imageUrl && (
          <image
            href={background.imageUrl}
            x={PADDING} y={PADDING}
            width={CANVAS_SIZE} height={CANVAS_SIZE}
            opacity={background.imageOpacity}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Zones */}
        {zones.map(zone => (
          <rect
            key={zone.id}
            x={toCanvasX(zone.x1)}
            y={toCanvasY(zone.y2)}
            width={toCanvasX(zone.x2) - toCanvasX(zone.x1)}
            height={toCanvasY(zone.y1) - toCanvasY(zone.y2)}
            fill={zone.color}
            stroke="hsla(0,0%,0%,0.1)"
            strokeWidth={1}
          />
        ))}

        {/* Zone labels */}
        {zones.map(zone => {
          const cx = (toCanvasX(zone.x1) + toCanvasX(zone.x2)) / 2;
          const cy = (toCanvasY(zone.y1) + toCanvasY(zone.y2)) / 2;
          return (
            <text key={`zl-${zone.id}`} x={cx} y={cy} textAnchor="middle"
              dominantBaseline="middle" fontSize={13} fontWeight={600}
              fill="hsla(0,0%,0%,0.6)" className="pointer-events-none">
              {zone.name}
            </text>
          );
        })}

        {/* Grid */}
        {gridLines}

        {/* Diagonal line */}
        {config.showDiagonal && (
          <line
            x1={toCanvasX(config.diagonalPoints.x1)}
            y1={toCanvasY(config.diagonalPoints.y1)}
            x2={toCanvasX(config.diagonalPoints.x2)}
            y2={toCanvasY(config.diagonalPoints.y2)}
            stroke="hsl(0,0%,20%)" strokeWidth={2.5} strokeDasharray="6,3"
          />
        )}

        {/* Axis labels */}
        <text x={PADDING + CANVAS_SIZE / 2} y={totalH - 8} textAnchor="middle"
          fontSize={14} fontWeight={700} fill="hsl(var(--foreground))">{config.xAxisLabel}</text>
        <text x={14} y={PADDING + CANVAS_SIZE / 2} textAnchor="middle"
          fontSize={14} fontWeight={700} fill="hsl(var(--foreground))"
          transform={`rotate(-90, 14, ${PADDING + CANVAS_SIZE / 2})`}>{config.yAxisLabel}</text>

        {/* Title */}
        <text x={totalW / 2} y={24} textAnchor="middle" fontSize={18} fontWeight={800}
          fill="hsl(var(--foreground))">{config.title}</text>

        {/* Data points */}
        {points.map(p => {
          const cx = toCanvasX(p.x);
          const cy = toCanvasY(p.y);
          const highlighted = isHighlighted(p);
          const dimmed = searchTerm && !highlighted;
          return (
            <g key={p.id}
              onMouseDown={(e) => { e.preventDefault(); setDragging(p.id); }}
              onClick={() => onPointClick(p.id)}
              className="cursor-grab active:cursor-grabbing"
              opacity={dimmed ? 0.2 : 1}
            >
              <circle cx={cx} cy={cy} r={highlighted ? 7 : 5}
                fill={highlighted ? 'hsl(45,100%,50%)' : 'hsl(220,80%,50%)'}
                stroke="hsl(0,0%,100%)" strokeWidth={1.5} />
              <title>{`${p.name} (${p.x}, ${p.y})`}</title>
              <text x={cx + 8} y={cy + 4} fontSize={10} fill="hsl(var(--foreground))"
                className="pointer-events-none">{p.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
