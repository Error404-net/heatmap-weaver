import React, { useRef, useState } from 'react';
import { useMatrixState } from '@/hooks/useMatrixState';
import { MatrixCanvas } from '@/components/MatrixCanvas';
import { MatrixSidebar } from '@/components/MatrixSidebar';
import { MatrixToolbar } from '@/components/MatrixToolbar';
import { COLOR_SCHEMES } from '@/lib/presets';
import { Input } from '@/components/ui/input';
import { Search, Flag } from 'lucide-react';

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

  const handleMassMove = (dx: number, dy: number) => {
    const updates = Array.from(selectedIds).map(id => {
      const p = state.points.find(pt => pt.id === id);
      if (!p) return null;
      return {
        id,
        partial: {
          x: Math.max(state.config.xMin + 0.1, Math.min(state.config.xMax - 0.1, p.x + dx)),
          y: Math.max(state.config.yMin + 0.1, Math.min(state.config.yMax - 0.1, p.y + dy)),
        },
      };
    }).filter(Boolean) as Array<{ id: string; partial: { x: number; y: number } }>;
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
          onMassMove={handleMassMove}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
