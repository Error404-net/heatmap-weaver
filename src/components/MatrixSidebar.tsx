import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Upload, Edit2, X, Check, FileDown } from 'lucide-react';
import { DataPoint, Zone, MatrixConfig } from '@/types/matrix';
import { parseCSV, downloadSampleCSV } from '@/lib/csvUtils';
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
  onUpdateZone: (id: string, partial: Partial<Zone>) => void;
  onDeleteZone: (id: string) => void;
}

export function MatrixSidebar({
  config, points, zones,
  onUpdateConfig, onAddPoint, onUpdatePoint, onDeletePoint, onSetPoints,
  onAddZone, onUpdateZone, onDeleteZone,
}: MatrixSidebarProps) {
  const [newName, setNewName] = useState('');
  const [newX, setNewX] = useState('');
  const [newY, setNewY] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
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
      const { points: parsed, errors } = parseCSV(text);
      if (errors.length > 0) toast.error(errors.join(', '));
      if (parsed.length > 0) {
        onSetPoints([...points, ...parsed]);
        toast.success(`Imported ${parsed.length} points`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startEdit = (p: DataPoint) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = (id: string) => {
    onUpdatePoint(id, { name: editName });
    setEditingId(null);
  };

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col h-full">
      {/* Section tabs */}
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

            {/* CSV upload */}
            <div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3 h-3 mr-1" /> Import CSV
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={downloadSampleCSV} title="Download sample CSV template">
                  <FileDown className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Points list */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Points ({points.length})</Label>
              {points.map(p => (
                <div key={p.id} className="flex items-center gap-1 py-1 px-1 rounded hover:bg-muted text-xs group">
                  {editingId === p.id ? (
                    <>
                      <Input value={editName} onChange={e => setEditName(e.target.value)}
                        className="h-6 text-xs flex-1" />
                      <button onClick={() => saveEdit(p.id)} className="text-primary"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="w-3 h-3" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="text-muted-foreground text-[10px]">({p.x},{p.y})</span>
                      <button onClick={() => startEdit(p)} className="opacity-0 group-hover:opacity-100"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => onDeletePoint(p.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </>
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
