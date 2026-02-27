import { useState, useCallback, useRef } from 'react';
import { MatrixState, DataPoint, Zone, MatrixConfig, BackgroundConfig } from '@/types/matrix';
import { PRESETS } from '@/lib/presets';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useMatrixState() {
  const defaultPreset = PRESETS[0];
  const [state, setState] = useState<MatrixState>({
    config: { ...defaultPreset.config },
    zones: defaultPreset.zones.map(z => ({ ...z })),
    points: defaultPreset.points.map(p => ({ ...p })),
    background: { imageUrl: null, imageOpacity: 0.3, colorScheme: 'classic' },
  });

  // Undo/redo
  const history = useRef<MatrixState[]>([]);
  const future = useRef<MatrixState[]>([]);

  const pushHistory = useCallback(() => {
    history.current.push(JSON.parse(JSON.stringify(state)));
    future.current = [];
  }, [state]);

  const undo = useCallback(() => {
    if (history.current.length === 0) return;
    future.current.push(JSON.parse(JSON.stringify(state)));
    const prev = history.current.pop()!;
    setState(prev);
  }, [state]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    history.current.push(JSON.parse(JSON.stringify(state)));
    const next = future.current.pop()!;
    setState(next);
  }, [state]);

  const canUndo = history.current.length > 0;
  const canRedo = future.current.length > 0;

  // Config
  const updateConfig = useCallback((partial: Partial<MatrixConfig>) => {
    pushHistory();
    setState(s => ({ ...s, config: { ...s.config, ...partial } }));
  }, [pushHistory]);

  // Points
  const addPoint = useCallback((point: Omit<DataPoint, 'id'>) => {
    pushHistory();
    setState(s => ({ ...s, points: [...s.points, { ...point, id: generateId() }] }));
  }, [pushHistory]);

  const updatePoint = useCallback((id: string, partial: Partial<DataPoint>) => {
    pushHistory();
    setState(s => ({
      ...s,
      points: s.points.map(p => p.id === id ? { ...p, ...partial } : p),
    }));
  }, [pushHistory]);

  const deletePoint = useCallback((id: string) => {
    pushHistory();
    setState(s => ({ ...s, points: s.points.filter(p => p.id !== id) }));
  }, [pushHistory]);

  const setPoints = useCallback((points: DataPoint[]) => {
    pushHistory();
    setState(s => ({ ...s, points }));
  }, [pushHistory]);

  // Zones
  const addZone = useCallback((zone: Omit<Zone, 'id'>) => {
    pushHistory();
    setState(s => ({ ...s, zones: [...s.zones, { ...zone, id: generateId() }] }));
  }, [pushHistory]);

  const updateZone = useCallback((id: string, partial: Partial<Zone>) => {
    pushHistory();
    setState(s => ({
      ...s,
      zones: s.zones.map(z => z.id === id ? { ...z, ...partial } : z),
    }));
  }, [pushHistory]);

  const deleteZone = useCallback((id: string) => {
    pushHistory();
    setState(s => ({ ...s, zones: s.zones.filter(z => z.id !== id) }));
  }, [pushHistory]);

  // Background
  const updateBackground = useCallback((partial: Partial<BackgroundConfig>) => {
    setState(s => ({ ...s, background: { ...s.background, ...partial } }));
  }, []);

  // Load preset
  const loadPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    pushHistory();
    setState(s => ({
      ...s,
      config: { ...preset.config },
      zones: preset.zones.map(z => ({ ...z })),
      points: preset.points.map(p => ({ ...p })),
    }));
  }, [pushHistory]);

  return {
    state,
    updateConfig,
    addPoint, updatePoint, deletePoint, setPoints,
    addZone, updateZone, deleteZone,
    updateBackground,
    loadPreset,
    undo, redo, canUndo, canRedo,
  };
}
