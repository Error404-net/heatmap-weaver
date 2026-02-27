

## Plan: Flexible CSV Import + Sample CSV Download

### Problem
The CSV parser currently requires exact columns `name, x, y` — but real-world CSVs (like the uploaded browser matrix) use arbitrary column names like `Browser, Hot_X, Crazy_Y`. Users need a way to map any CSV columns to X/Y/name fields.

### Changes

**1. Smart CSV parser with column auto-detection** (`src/lib/csvUtils.ts`)
- Instead of requiring exact `name,x,y` headers, auto-detect numeric columns and name-like columns
- Add heuristic matching: look for columns containing "x", "hot", "score" for X axis; "y", "crazy" for Y axis; first non-numeric text column as name
- If auto-detection fails or is ambiguous, still import but use first text col as name, first two numeric cols as x,y
- Map `category` from any column named "category", "type", "group", "engine", etc.
- Map `notes` from columns like "notes", "description", "placement", etc.

**2. Add "Download Sample CSV" button** (`src/components/MatrixSidebar.tsx`)
- Add a button next to "Import CSV" that downloads a small sample CSV showing the expected format
- Sample contains 3-4 example rows with `name,x,y,category,notes` columns

**3. Add sample CSV export with template** (`src/components/MatrixToolbar.tsx`)
- Add a "Download Template" option in the export dropdown menu

**4. Copy uploaded CSV to project** as a bundled sample dataset for the Enterprise Browser preset (`src/lib/presets.ts`)
- Update the Enterprise Browser preset to include actual browser data points from the CSV

