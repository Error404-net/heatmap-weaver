

## Fix: Forgiving CSV Import

### Problem
The parser finds x/y columns (by header matching) but when individual row values are empty or non-numeric, it throws "invalid x/y" errors instead of gracefully handling them.

### Changes (`src/lib/csvUtils.ts`)

1. **Per-row fallback chain**: When x/y values are invalid for a row, try these fallbacks in order:
   - If a placement column exists, use placement-based coordinate parsing
   - Otherwise, assign random jittered coordinates in the center of the matrix (3-7 range)
   - Never skip a row just because coordinates are missing

2. **Remove hard failure on missing x/y columns**: If no x/y columns and no placement column are found, still import using random center placement instead of returning an error

3. **Downgrade errors to warnings**: Invalid x/y becomes a non-blocking warning; points still get imported with fallback coordinates

