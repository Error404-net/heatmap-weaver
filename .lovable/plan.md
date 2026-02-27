

## Plan: Click-to-Place Selected Points & Distribute Selected

### 1. Add "Place Mode" to sidebar and canvas (`MatrixSidebar.tsx`, `MatrixCanvas.tsx`, `Index.tsx`)

Replace the offset-based mass move with a **"Place Here"** button:
- When clicked with selected points, enter a **placement mode** (state lifted to `Index.tsx`: `placementMode: boolean`)
- Canvas cursor changes to crosshair
- On canvas click, all selected points are placed centered around that click location, spread out with small random offsets so they don't overlap (using Gaussian jitter within ~1 unit radius)
- Placement mode auto-exits after placing

### 2. Add "Distribute Selected" button (`MatrixSidebar.tsx`, `Index.tsx`)

- When points are selected, show a **"Distribute Selected"** button alongside Delete
- This calls `distributePoints` but only on the selected subset, then batch-updates just those points
- Reuses existing `distributePoints` logic from `src/lib/distributePoints.ts`

### 3. Implementation details

**`Index.tsx`**:
- Add `placementMode` state
- Add `handlePlaceAt(x: number, y: number)` — takes selected points, spreads them around (x,y) with small random offsets, calls `batchUpdatePoints`
- Add `handleDistributeSelected()` — filters selected points, runs `distributePoints`, batch updates
- Pass `placementMode`, `onPlaceAt`, `onEnterPlaceMode`, `onDistributeSelected` to children

**`MatrixCanvas.tsx`**:
- Accept `placementMode` and `onPlaceAt` props
- When `placementMode` is true: show crosshair cursor, on click convert pixel to data coords and call `onPlaceAt(x, y)`, ignore normal drag behavior
- Visual indicator (e.g., subtle overlay text "Click to place N points")

**`MatrixSidebar.tsx`**:
- Replace offset inputs + Move button with a **"Place on Chart"** button that triggers `onEnterPlaceMode`
- Add **"Distribute Selected"** button
- Keep Delete Selected button

### Files touched
- `src/pages/Index.tsx` — placement mode state, place handler, distribute handler
- `src/components/MatrixCanvas.tsx` — placement mode click handling, cursor
- `src/components/MatrixSidebar.tsx` — replace mass move UI with Place + Distribute buttons

