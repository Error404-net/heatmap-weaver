import React, { useRef, useState } from 'react';
import { useMatrixState } from '@/hooks/useMatrixState';
import { MatrixCanvas } from '@/components/MatrixCanvas';
import { MatrixSidebar } from '@/components/MatrixSidebar';
import { MatrixToolbar } from '@/components/MatrixToolbar';
import { COLOR_SCHEMES } from '@/lib/presets';
import { Input } from '@/components/ui/input';
import { Search, Flag } from 'lucide-react';
import { distributePoints } from '@/lib/distributePoints';

const Index = () => {
  const {
    state, updateConfig,
    addPoint, updatePoint, deletePoint, setPoints, batchUpdatePoints, deletePoints,
    addZone, updateZone, deleteZone,
    updateBackground, loadPreset,
    undo, redo, canUndo, canRedo,
  } = useMatrixState();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [placementMode, setPlacementMode] = useState(false);

  const handlePointMove = (id: string, x: number, y: number) => {
    updatePoint(id, { x, y });
  };

  const handlePointsMove = (moves: Array<{ id: string; x: number; y: number }>) => {
    batchUpdatePoints(moves.map(({ id, x, y }) => ({ id, partial: { x, y } })));
  };

  const handlePointClick = (id: string) => {
    // Could open edit dialog - for now handled in sidebar
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    deletePoints(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handlePlaceAt = (x: number, y: number) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const count = ids.length;
    const updates = ids.map((id, i) => {
      // Spread points around click location with Gaussian jitter
      const angle = (2 * Math.PI * i) / count + (Math.random() - 0.5) * 0.5;
      const radius = count === 1 ? 0 : 0.3 + Math.random() * 0.7;
      const nx = Math.max(state.config.xMin + 0.1, Math.min(state.config.xMax - 0.1,
        Math.round((x + Math.cos(angle) * radius) * 100) / 100));
      const ny = Math.max(state.config.yMin + 0.1, Math.min(state.config.yMax - 0.1,
        Math.round((y + Math.sin(angle) * radius) * 100) / 100));
      return { id, partial: { x: nx, y: ny } };
    });
    batchUpdatePoints(updates);
    setPlacementMode(false);
  };

  const handleDistributeSelected = () => {
    if (selectedIds.size === 0) return;
    const selectedPoints = state.points.filter(p => selectedIds.has(p.id));
    const distributed = distributePoints(selectedPoints, state.config);
    const updates = distributed.map(p => ({ id: p.id, partial: { x: p.x, y: p.y } }));
    batchUpdatePoints(updates);
  };

  const handlePlaceInZone = (zoneId: string) => {
    if (selectedIds.size === 0) return;
    const zone = state.zones.find(z => z.id === zoneId);
    if (!zone) return;
    const ids = Array.from(selectedIds);
    const updates = ids.map(id => {
      const x = Math.round((zone.x1 + Math.random() * (zone.x2 - zone.x1)) * 100) / 100;
      const y = Math.round((zone.y1 + Math.random() * (zone.y2 - zone.y1)) * 100) / 100;
      return { id, partial: { x, y } };
    });
    batchUpdatePoints(updates);
  };

  const applyColorScheme = (scheme: string) => {
    const colors = COLOR_SCHEMES[scheme];
    if (!colors) return;
    const keys = Object.keys(colors);
    const updatedZones = state.zones.map((z, i) => ({
      ...z,
      color: colors[keys[i % keys.length]],
    }));
    updatedZones.forEach(z => updateZone(z.id, { color: z.color }));
    updateBackground({ colorScheme: scheme });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
        <Flag className="w-5 h-5 text-destructive" />
        <h1 className="text-lg font-bold text-foreground tracking-tight">RedFlag Grapher</h1>
      </div>
      <MatrixToolbar
        onLoadPreset={loadPreset}
        background={state.background}
        onUpdateBackground={updateBackground}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
        points={state.points}
        onApplyColorScheme={applyColorScheme}
      />
      <div className="flex flex-1 overflow-hidden">
        <MatrixSidebar
          config={state.config}
          points={state.points}
          zones={state.zones}
          onUpdateConfig={updateConfig}
          onAddPoint={addPoint}
          onUpdatePoint={updatePoint}
          onDeletePoint={deletePoint}
          onSetPoints={setPoints}
          onAddZone={addZone}
          onUpdateZone={updateZone}
          onDeleteZone={deleteZone}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onDeleteSelected={handleDeleteSelected}
          onEnterPlaceMode={() => setPlacementMode(true)}
           onDistributeSelected={handleDistributeSelected}
          onPlaceInZone={handlePlaceInZone}
        />
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="p-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search points..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 text-xs max-w-xs"
            />
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <MatrixCanvas
              config={state.config}
              zones={state.zones}
              points={state.points}
              background={state.background}
              onPointMove={handlePointMove}
              onPointsMove={handlePointsMove}
              onPointClick={handlePointClick}
              searchTerm={searchTerm}
              canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              placementMode={placementMode}
              onPlaceAt={handlePlaceAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
