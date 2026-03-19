import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Undo2, Redo2, Download, Image, Moon, Sun } from 'lucide-react';
import { PRESETS, COLOR_SCHEMES } from '@/lib/presets';
import { BackgroundConfig } from '@/types/matrix';
import { exportPNG, exportSVG, exportPDF } from '@/lib/exportUtils';
import { matrixToCSV, downloadSampleCSV, downloadSampleMatrixCSV } from '@/lib/csvUtils';
import { DataPoint, Zone } from '@/types/matrix';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';

interface MatrixToolbarProps {
  onLoadPreset: (id: string) => void;
  background: BackgroundConfig;
  onUpdateBackground: (partial: Partial<BackgroundConfig>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canvasRef: React.RefObject<HTMLDivElement>;
  points: DataPoint[];
  zones: Zone[];
  onApplyColorScheme: (scheme: string) => void;
}

export function MatrixToolbar({
  onLoadPreset, background, onUpdateBackground,
  onUndo, onRedo, canUndo, canRedo, canvasRef, points, zones, onApplyColorScheme
}: MatrixToolbarProps) {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('matrix-dark-mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('matrix-dark-mode', String(darkMode));
  }, [darkMode]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpdateBackground({ imageUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleExportCSV = () => {
    const csv = matrixToCSV(points, zones);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;a.download = 'matrix_data.csv';a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border bg-card flex-wrap">
      {/* Presets */}
      <Select onValueChange={onLoadPreset}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="Load Template" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) =>
          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} (Template)</SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* Color schemes */}
      <Select onValueChange={onApplyColorScheme}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Color Scheme" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(COLOR_SCHEMES).map((k) =>
          <SelectItem key={k} value={k} className="text-xs capitalize">{k}</SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* Background image */}
      <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => bgInputRef.current?.click()}>
        <Image className="w-3 h-3 mr-1" /> BG Image
      </Button>

      {background.imageUrl &&
      <div className="flex items-center gap-2">
          <Label className="text-xs">Opacity</Label>
          <Slider
          value={[background.imageOpacity * 100]}
          onValueChange={([v]) => onUpdateBackground({ imageOpacity: v / 100 })}
          max={100} min={0} step={5}
          className="w-24" />

          <Button variant="ghost" size="sm" className="h-6 text-xs px-1"
        onClick={() => onUpdateBackground({ imageUrl: null })}>✕</Button>
        </div>
      }

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDarkMode(!darkMode)}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      {/* Undo/Redo */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo}>
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo}>
        <Redo2 className="w-4 h-4" />
      </Button>

      {/* Export */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="text-xs" onClick={() => canvasRef.current && exportPNG(canvasRef.current)}>PNG</DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => canvasRef.current && exportSVG(canvasRef.current)}>SVG</DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => canvasRef.current && exportPDF(canvasRef.current)}>PDF</DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={handleExportCSV}>CSV (data)</DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={downloadSampleCSV}>CSV Template (points)</DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={downloadSampleMatrixCSV}>CSV Template (matrix)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share */}
      


    </div>);

}
