export interface DataPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  category?: string;
  notes?: string;
  iconUrl?: string;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  imageUrl?: string;
  imageOpacity?: number;
}

export interface MatrixConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showDiagonal: boolean;
  diagonalPoints: { x1: number; y1: number; x2: number; y2: number };
}

export interface BackgroundConfig {
  imageUrl: string | null;
  imageOpacity: number;
  colorScheme: string;
}

export interface MatrixPreset {
  id: string;
  name: string;
  config: MatrixConfig;
  zones: Zone[];
  points: DataPoint[];
}

export interface MatrixState {
  config: MatrixConfig;
  zones: Zone[];
  points: DataPoint[];
  background: BackgroundConfig;
}

export type ColorScheme = 'classic' | 'dark' | 'pastel' | 'neon' | 'monochrome' | 'ocean' | 'sunset' | 'forest' | 'cyberpunk';
