

## Plan: Add Presets, Fix Multi-Select Drag, Add Sidebar Selection Controls

### 1. Add more presets (`src/lib/presets.ts`)
Add themed matrix presets alongside the existing Hot-Crazy and Blank:
- **Effort vs Impact** (project prioritization: Quick Wins, Major Projects, Fill-Ins, Thankless Tasks)
- **Risk vs Reward** (investment-style: Safe Bets, High Risk/High Reward, Money Pits, Moonshots)
- **Skill vs Will** (employee assessment: Stars, High Potentials, Workhorses, Problem Children)

Each gets appropriate axis labels, zones with distinct colors, and sensible coordinate ranges (all 0-10).

### 2. Fix multi-select drag bug (`src/components/MatrixCanvas.tsx`, `src/pages/Index.tsx`)
The current `handlePointsMove` calls `updatePoint` in a loop, each pushing to undo history and triggering a re-render mid-drag. This causes stale state issues. Fix:
- In `useMatrixState.ts`: Add a `batchUpdatePoints` method that updates all points in a single `setState` call with one history push
- In `Index.tsx`: Replace the `forEach` loop in `handlePointsMove` with the new batch method
- In `MatrixCanvas.tsx`: The drag handler recalculates from `points` state which may be stale during rapid moves. Store initial positions at drag start and compute deltas from those rather than from current positions each frame

### 3. Add sidebar checkboxes and mass-move controls (`src/components/MatrixSidebar.tsx`, `src/pages/Index.tsx`)
- Add `selectedIds` and `onSelectedIdsChange` props to sidebar
- Add checkboxes next to each point in the points list
- Add a "Select All / Deselect All" toggle button
- Add a "Mass Move Selected" section that appears when points are selected: X offset and Y offset inputs + "Apply" button that shifts all selected points by the offset
- Add a "Delete Selected" button
- Lift `selectedIds` state from `MatrixCanvas` up to `Index.tsx` so sidebar and canvas share selection state

### 4. Lift selection state (`src/pages/Index.tsx`, `src/components/MatrixCanvas.tsx`)
- Move `selectedIds` / `setSelectedIds` from MatrixCanvas to Index
- Pass as props to both MatrixCanvas and MatrixSidebar
- Canvas selection behavior (shift-click, click-to-select, click-empty-to-deselect) remains the same but uses lifted state

### 5. Add batch update to hook (`src/hooks/useMatrixState.ts`)
- Add `batchUpdatePoints(updates: Array<{id: string, partial: Partial<DataPoint>}>)` that does one `pushHistory()` and one `setState`

### Files touched
- `src/lib/presets.ts` -- 3 new presets
- `src/hooks/useMatrixState.ts` -- add `batchUpdatePoints`
- `src/pages/Index.tsx` -- lift selectedIds, wire batch move, pass to sidebar
- `src/components/MatrixCanvas.tsx` -- receive selectedIds as prop, fix drag with initial positions
- `src/components/MatrixSidebar.tsx` -- checkboxes, select all, mass move controls, delete selected

