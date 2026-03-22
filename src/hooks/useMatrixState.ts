import { useState, useCallback, useRef } from 'react';
import { MatrixState, DataPoint, Zone, MatrixConfig, BackgroundConfig } from '@/types/matrix';
import { PRESETS } from '@/lib/presets';
import { parseMatrixCSV } from '@/lib/csvUtils';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useMatrixState() {
  const defaultPreset = PRESETS[0];
  const blankPreset = PRESETS.find((preset) => preset.id === 'blank') ?? defaultPreset;
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

  const replaceMatrixData = useCallback(({ points, zones }: { points: DataPoint[]; zones: Zone[] }) => {
    pushHistory();
    setState(s => ({ ...s, points, zones }));
  }, [pushHistory]);

  const setZones = useCallback((zones: Zone[]) => {
    pushHistory();
    setState(s => ({ ...s, zones }));
  }, [pushHistory]);

  // Load preset
  const loadPreset = useCallback(async (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    pushHistory();

    let points = preset.points.map(p => ({ ...p }));
    let zones = preset.zones.map(z => ({ ...z }));

    if (preset.pointsCsvPath) {
      try {
        const response = await fetch(preset.pointsCsvPath);
        if (!response.ok) throw new Error(`Failed to load ${preset.pointsCsvPath}`);
        const text = await response.text();
        const parsed = parseMatrixCSV(text);
        points = parsed.points;
        if (parsed.zones.length > 0) {
          zones = parsed.zones;
        }
      } catch (error) {
        console.error(error);
      }
    }

    setState(s => ({
      ...s,
      config: { ...preset.config },
      zones,
      points: s.points.length > 0 ? s.points : points,
    }));
  }, [pushHistory]);

  const startNewSession = useCallback(() => {
    pushHistory();
    setState({
      config: { ...blankPreset.config },
      zones: blankPreset.zones.map((zone) => ({ ...zone })),
      points: [],
      background: { imageUrl: null, imageOpacity: 0.3, colorScheme: 'classic' },
    });
  }, [blankPreset, pushHistory]);

  const batchUpdatePoints = useCallback((updates: Array<{ id: string; partial: Partial<DataPoint> }>) => {
    pushHistory();
    setState(s => ({
      ...s,
      points: s.points.map(p => {
        const u = updates.find(u => u.id === p.id);
        return u ? { ...p, ...u.partial } : p;
      }),
    }));
  }, [pushHistory]);

  const deletePoints = useCallback((ids: string[]) => {
    pushHistory();
    const idSet = new Set(ids);
    setState(s => ({ ...s, points: s.points.filter(p => !idSet.has(p.id)) }));
  }, [pushHistory]);

  return {
    state,
    updateConfig,
    addPoint, updatePoint, deletePoint, setPoints, batchUpdatePoints, deletePoints, replaceMatrixData,
    addZone, updateZone, deleteZone, setZones,
    updateBackground,
    loadPreset,
    startNewSession,
    undo, redo, canUndo, canRedo,
  };
}
