import React, { useEffect, useRef, useState } from 'react';
import { useMatrixState } from '@/hooks/useMatrixState';
import { MatrixCanvas } from '@/components/MatrixCanvas';
import { MatrixSidebar } from '@/components/MatrixSidebar';
import { MatrixToolbar } from '@/components/MatrixToolbar';
import { COLOR_SCHEMES } from '@/lib/presets';
import { Maximize, Minimize, Github } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { distributePoints } from '@/lib/distributePoints';

const Index = () => {
  const repositoryUrl = 'https://github.com/Error404-net/Crazy-Hot-Matrix-404';

  const {
    state, updateConfig,
    addPoint, updatePoint, deletePoint, setPoints, batchUpdatePoints, deletePoints, replaceMatrixData,
    addZone, updateZone, deleteZone,
    updateBackground, loadPreset, startNewSession,
    undo, redo, canUndo, canRedo,
  } = useMatrixState();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [placementMode, setPlacementMode] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarSize, setSidebarSize] = useState(24);

  useEffect(() => {
    if (!sidebarVisible) return;
    setSidebarSize((size) => Math.min(32, Math.max(20, size)));
  }, [sidebarVisible]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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


  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleFullscreenToggle = async () => {
    const root = canvasRef.current?.parentElement;
    if (!root) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await root.requestFullscreen();
  };

  const handleSetDiagonalFromZero = () => {
    const end = Math.min(state.config.xMax, state.config.yMax);
    updateConfig({
      showDiagonal: true,
      diagonalPoints: { x1: 0, y1: 0, x2: end, y2: end },
    });
  };

  const handleSetDiagonalFromChartOrigin = () => {
    const span = Math.min(state.config.xMax - state.config.xMin, state.config.yMax - state.config.yMin);
    updateConfig({
      showDiagonal: true,
      diagonalPoints: {
        x1: state.config.xMin,
        y1: state.config.yMin,
        x2: state.config.xMin + span,
        y2: state.config.yMin + span,
      },
    });
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
        <img src="/crazy-hot-matrix-logo.svg" alt="Crazy Hot Matrix logo" className="w-7 h-7 rounded" />
        <h1 className="text-lg font-bold text-foreground tracking-tight">Crazy Hot Matrix</h1>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild title="View source on GitHub">
            <a href={repositoryUrl} target="_blank" rel="noopener noreferrer" aria-label="Open GitHub repository">
              <Github className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFullscreenToggle} title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen chart'}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <MatrixToolbar
        onLoadPreset={loadPreset}
        background={state.background}
        onUpdateBackground={updateBackground}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onStartNew={() => {
          startNewSession();
          setSelectedIds(new Set());
          setSearchTerm('');
          setPlacementMode(false);
        }}
        onShowMenu={() => setSidebarVisible(true)}
        sidebarVisible={sidebarVisible}
        canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
        points={state.points}
        zones={state.zones}
        onApplyColorScheme={applyColorScheme}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {sidebarVisible && (
            <>
              <ResizablePanel
                defaultSize={sidebarSize}
                minSize={16}
                maxSize={70}
                onResize={(size) => setSidebarSize(size)}
              >
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
                  onReplaceMatrixData={replaceMatrixData}
                  onUpdateZone={updateZone}
                  onDeleteZone={deleteZone}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelectedIds}
                  onDeleteSelected={handleDeleteSelected}
                  onEnterPlaceMode={() => setPlacementMode(true)}
                  onDistributeSelected={handleDistributeSelected}
                  onPlaceInZone={handlePlaceInZone}
                  onHideMenu={() => setSidebarVisible(false)}
                  onSetDiagonalFromZero={handleSetDiagonalFromZero}
                  onSetDiagonalFromChartOrigin={handleSetDiagonalFromChartOrigin}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          <ResizablePanel defaultSize={78}>
            <div className="flex flex-col h-full overflow-auto">
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
