import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Upload, Edit2, X, Check, FileDown, Grid3X3, ImagePlus, MousePointerClick, Shuffle, CheckSquare, MapPin, PanelLeftClose } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataPoint, Zone, MatrixConfig } from '@/types/matrix';
import { parseMatrixCSV, downloadSampleCSV } from '@/lib/csvUtils';
import { distributePoints } from '@/lib/distributePoints';
import { toast } from 'sonner';

interface MatrixSidebarProps {
  config: MatrixConfig;
  points: DataPoint[];
  zones: Zone[];
  onUpdateConfig: (partial: Partial<MatrixConfig>) => void;
  onAddPoint: (point: Omit<DataPoint, 'id'>) => void;
  onUpdatePoint: (id: string, partial: Partial<DataPoint>) => void;
  onDeletePoint: (id: string) => void;
  onSetPoints: (points: DataPoint[]) => void;
  onAddZone: (zone: Omit<Zone, 'id'>) => void;
  onReplaceMatrixData: (data: { points: DataPoint[]; zones: Zone[] }) => void;
  onUpdateZone: (id: string, partial: Partial<Zone>) => void;
  onDeleteZone: (id: string) => void;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  onDeleteSelected: () => void;
  onEnterPlaceMode: () => void;
  onDistributeSelected: () => void;
  onPlaceInZone: (zoneId: string) => void;
  onHideMenu?: () => void;
  onSetDiagonalFromZero?: () => void;
  onSetDiagonalFromChartOrigin?: () => void;
}


export function MatrixSidebar({
  config, points, zones,
  onUpdateConfig, onAddPoint, onUpdatePoint, onDeletePoint, onSetPoints,
  onAddZone, onReplaceMatrixData, onUpdateZone, onDeleteZone,
  selectedIds, onSelectedIdsChange, onDeleteSelected, onEnterPlaceMode, onDistributeSelected, onPlaceInZone, onHideMenu,
  onSetDiagonalFromZero, onSetDiagonalFromChartOrigin,
}: MatrixSidebarProps) {
  const [newName, setNewName] = useState('');
  const [newX, setNewX] = useState('');
  const [newY, setNewY] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editX, setEditX] = useState('');
  const [editY, setEditY] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const zoneImageRef = useRef<HTMLInputElement>(null);
  const [iconUploadId, setIconUploadId] = useState<string | null>(null);
  const [zoneImageUploadId, setZoneImageUploadId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'config' | 'points' | 'zones'>('points');

  const handleAddPoint = () => {
    const x = parseFloat(newX);
    const y = parseFloat(newY);
    if (!newName || isNaN(x) || isNaN(y)) {
      toast.error('Please fill name, x, and y');
      return;
    }
    onAddPoint({ name: newName, x, y });
    setNewName(''); setNewX(''); setNewY('');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { points: parsedPoints, zones: parsedZones, errors, hasMatrixRecords } = parseMatrixCSV(text);
      if (errors.length > 0) toast.error(errors.slice(0, 3).join(', '));
      if (hasMatrixRecords) {
        onReplaceMatrixData({ points: parsedPoints, zones: parsedZones });
        toast.success(`Imported ${parsedPoints.length} points and ${parsedZones.length} zones`);
        return;
      }

      if (parsedPoints.length > 0) {
        onSetPoints([...points, ...parsedPoints]);
        toast.success(`Imported ${parsedPoints.length} points`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDistribute = () => {
    if (points.length === 0) { toast.error('No points to distribute'); return; }
    const distributed = distributePoints(points, config);
    onSetPoints(distributed);
    toast.success(`Distributed ${distributed.length} points`);
  };

  const startEdit = (p: DataPoint) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditX(String(p.x));
    setEditY(String(p.y));
    setEditCategory(p.category || '');
  };

  const saveEdit = (id: string) => {
    const x = parseFloat(editX);
    const y = parseFloat(editY);
    onUpdatePoint(id, {
      name: editName,
      x: isNaN(x) ? 0 : x,
      y: isNaN(y) ? 0 : y,
      category: editCategory || undefined,
    });
    setEditingId(null);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !iconUploadId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdatePoint(iconUploadId, { iconUrl: ev.target?.result as string });
      toast.success('Icon uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setIconUploadId(null);
  };

  const handleZoneImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !zoneImageUploadId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdateZone(zoneImageUploadId, { imageUrl: ev.target?.result as string, imageOpacity: 0.3 });
      toast.success('Zone image uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setZoneImageUploadId(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === points.length) {
      onSelectedIdsChange(new Set());
    } else {
      onSelectedIdsChange(new Set(points.map(p => p.id)));
    }
  };

  const togglePoint = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(next);
  };


  return (
    <div className="w-full min-w-0 border-r border-border bg-card flex flex-col h-full">
      <input ref={iconRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
      <input ref={zoneImageRef} type="file" accept="image/*" className="hidden" onChange={handleZoneImageUpload} />

      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Editor Menu</div>
        {onHideMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onHideMenu}
            title="Hide menu"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex border-b border-border">
        {(['config', 'points', 'zones'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`flex-1 px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors
              ${activeSection === s ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            {s}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 p-3">
        {activeSection === 'config' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={config.title} onChange={e => onUpdateConfig({ title: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X Label</Label>
                <Input value={config.xAxisLabel} onChange={e => onUpdateConfig({ xAxisLabel: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Y Label</Label>
                <Input value={config.yAxisLabel} onChange={e => onUpdateConfig({ yAxisLabel: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={config.showDiagonal}
                onChange={e => onUpdateConfig({ showDiagonal: e.target.checked })}
                className="accent-primary" />
              <Label className="text-xs">Show diagonal line</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Diagonal X1</Label>
                <Input
                  type="number"
                  value={config.diagonalPoints.x1}
                  onChange={e => onUpdateConfig({ diagonalPoints: { ...config.diagonalPoints, x1: parseFloat(e.target.value) || 0 } })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Diagonal Y1</Label>
                <Input
                  type="number"
                  value={config.diagonalPoints.y1}
                  onChange={e => onUpdateConfig({ diagonalPoints: { ...config.diagonalPoints, y1: parseFloat(e.target.value) || 0 } })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Diagonal X2</Label>
                <Input
                  type="number"
                  value={config.diagonalPoints.x2}
                  onChange={e => onUpdateConfig({ diagonalPoints: { ...config.diagonalPoints, x2: parseFloat(e.target.value) || 0 } })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Diagonal Y2</Label>
                <Input
                  type="number"
                  value={config.diagonalPoints.y2}
                  onChange={e => onUpdateConfig({ diagonalPoints: { ...config.diagonalPoints, y2: parseFloat(e.target.value) || 0 } })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={onSetDiagonalFromZero}>
                45° from (0,0)
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={onSetDiagonalFromChartOrigin}>
                45° from min axis
              </Button>
            </div>
          </div>
        )}

        {activeSection === 'points' && (
          <div className="space-y-3">
            {/* Add point */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Add Point</Label>
              <Input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="X" type="number" value={newX} onChange={e => setNewX(e.target.value)} className="h-8 text-xs" />
                <Input placeholder="Y" type="number" value={newY} onChange={e => setNewY(e.target.value)} className="h-8 text-xs" />
              </div>
              <Button size="sm" className="w-full h-8 text-xs" onClick={handleAddPoint}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>

            <Separator />

            {/* CSV upload + Distribute */}
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3 h-3 mr-1" /> Import CSV
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={downloadSampleCSV} title="Download sample CSV template">
                  <FileDown className="w-3 h-3" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={handleDistribute}>
                <Grid3X3 className="w-3 h-3 mr-1" /> Distribute Points
              </Button>
            </div>

            <Separator />

            {/* Selection controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Points ({points.length})</Label>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={toggleSelectAll}>
                  <CheckSquare className="w-3 h-3 mr-1" />
                  {selectedIds.size === points.length && points.length > 0 ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Mass move controls - visible when selection exists */}
              {selectedIds.size > 0 && (
                <div className="p-2 rounded border border-border bg-muted/50 space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground">{selectedIds.size} selected</Label>
                   <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-[10px]" onClick={onEnterPlaceMode}>
                      <MousePointerClick className="w-3 h-3 mr-1" /> Place on Chart
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-[10px]" onClick={onDistributeSelected}>
                      <Shuffle className="w-3 h-3 mr-1" /> Distribute
                    </Button>
                  </div>
                  {zones.length > 0 && (
                    <Select onValueChange={(zoneId) => onPlaceInZone(zoneId)}>
                      <SelectTrigger className="h-6 text-[10px]">
                        <MapPin className="w-3 h-3 mr-1" />
                        <SelectValue placeholder="Place in Zone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(z => (
                          <SelectItem key={z.id} value={z.id} className="text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-sm" style={{ background: z.color }} />
                              {z.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button size="sm" variant="destructive" className="w-full h-6 text-[10px]" onClick={onDeleteSelected}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
                  </Button>
                </div>
              )}
            </div>

            {/* Points list */}
            <div className="space-y-1">
              {points.map(p => (
                <div key={p.id} className="py-1 px-1 rounded hover:bg-muted text-xs group">
                  {editingId === p.id ? (
                    <div className="space-y-1">
                      <Input value={editName} onChange={e => setEditName(e.target.value)}
                        placeholder="Name" className="h-6 text-xs" />
                      <div className="grid grid-cols-2 gap-1">
                        <Input value={editX} onChange={e => setEditX(e.target.value)}
                          placeholder="X" type="number" className="h-6 text-xs" />
                        <Input value={editY} onChange={e => setEditY(e.target.value)}
                          placeholder="Y" type="number" className="h-6 text-xs" />
                      </div>
                      <Input value={editCategory} onChange={e => setEditCategory(e.target.value)}
                        placeholder="Category" className="h-6 text-xs" />
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(p.id)} className="text-primary"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={() => togglePoint(p.id)}
                        className="h-3 w-3"
                      />
                      {p.iconUrl && <img src={p.iconUrl} className="w-4 h-4 rounded-sm object-cover" alt="" />}
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="text-muted-foreground text-[10px]">({p.x},{p.y})</span>
                      <button onClick={() => { setIconUploadId(p.id); iconRef.current?.click(); }}
                        className="opacity-0 group-hover:opacity-100" title="Upload icon">
                        <ImagePlus className="w-3 h-3" />
                      </button>
                      <button onClick={() => startEdit(p)} className="opacity-0 group-hover:opacity-100"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => onDeletePoint(p.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'zones' && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Zones ({zones.length})</Label>
            {zones.map(z => (
              <div key={z.id} className="p-2 rounded border border-border space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: z.color }} />
                  <Input value={z.name} onChange={e => onUpdateZone(z.id, { name: e.target.value })}
                    className="h-6 text-xs flex-1" />
                  <button onClick={() => onDeleteZone(z.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['x1', 'y1', 'x2', 'y2'] as const).map(k => (
                    <Input key={k} type="number" placeholder={k} value={z[k]}
                      onChange={e => onUpdateZone(z.id, { [k]: parseFloat(e.target.value) || 0 })}
                      className="h-6 text-[10px]" />
                  ))}
                </div>
                <Input type="color" value={z.color.startsWith('hsla') ? '#888888' : z.color}
                  onChange={e => onUpdateZone(z.id, { color: e.target.value + '80' })}
                  className="h-6 w-full" />
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1"
                    onClick={() => { setZoneImageUploadId(z.id); zoneImageRef.current?.click(); }}>
                    <ImagePlus className="w-3 h-3 mr-1" /> Image
                  </Button>
                  {z.imageUrl && (
                    <>
                      <div className="flex-1">
                        <Label className="text-[10px] text-muted-foreground">Opacity</Label>
                        <Slider
                          value={[(z.imageOpacity ?? 0.3) * 100]}
                          onValueChange={([v]) => onUpdateZone(z.id, { imageOpacity: v / 100 })}
                          max={100} min={0} step={5} className="w-full"
                        />
                      </div>
                      <button onClick={() => onUpdateZone(z.id, { imageUrl: undefined, imageOpacity: undefined, imageScale: undefined })}
                        className="text-muted-foreground"><X className="w-3 h-3" /></button>
                    </>
                  )}
                </div>
                {z.imageUrl && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Size</Label>
                    <Slider
                      value={[(z.imageScale ?? 1.0) * 100]}
                      onValueChange={([v]) => onUpdateZone(z.id, { imageScale: v / 100 })}
                      max={300} min={10} step={5} className="w-full"
                    />
                  </div>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full h-8 text-xs"
              onClick={() => onAddZone({ name: 'New Zone', color: 'hsla(200,50%,50%,0.5)', x1: 0, y1: 0, x2: 3, y2: 3 })}>
              <Plus className="w-3 h-3 mr-1" /> Add Zone
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
