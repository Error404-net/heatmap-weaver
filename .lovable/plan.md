

## Plan: Organic Distribution, Quadrant-Aware CSV, Zone Image Scale

### 1. Organic quadrant-aware distribution (`src/lib/distributePoints.ts`)
- Replace rigid grid layout with organic placement: group points by their quadrant (based on notes/placement text or current position relative to matrix center), then scatter them within that quadrant region with random offsets and slight overlaps allowed
- Add Gaussian-style jitter so points cluster naturally rather than snapping to grid cells
- Points without quadrant info get distributed across available space with randomized positions

### 2. Quadrant-aware CSV import (`src/lib/csvUtils.ts`)
- The `PLACEMENT_MAP` already handles keywords like "Marry", "Hot", "Crazy" -- but the ranges need tuning based on the actual CSV data (e.g., the CSV uses "Marry quadrant", "Hot quadrant", "Crazy quadrant", "Fun Zone", "Danger Zone", "No-Go Zone", "Date Zone", "Unicorn Zone")
- Add more keywords: `'fun zone'`, `'danger zone'`, `'date zone'`, `'unicorn zone'`, `'no-go zone'` 
- Widen jitter ranges within each quadrant so points spread more organically on import (not clustered in tiny area)

### 3. Zone image scale (`src/types/matrix.ts`, `src/components/MatrixSidebar.tsx`, `src/components/MatrixCanvas.tsx`)
- Add `imageScale?: number` to `Zone` type (default 1.0, range 0.1 to 3.0)
- In sidebar zone editor, add a "Size" slider below the opacity slider
- On canvas, apply scale to zone image dimensions: compute scaled width/height from center point of the zone, keep clipped to zone bounds

### Files touched
- `src/types/matrix.ts` -- add `imageScale` to Zone
- `src/lib/distributePoints.ts` -- organic quadrant-aware distribution with jitter
- `src/lib/csvUtils.ts` -- wider placement ranges, more quadrant keywords
- `src/components/MatrixSidebar.tsx` -- add image scale slider per zone
- `src/components/MatrixCanvas.tsx` -- render zone image with scale transform

