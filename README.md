# Crazy Hot Matrix

Yes, this is vibe-coded trash — but it runs locally.

Crazy Hot Matrix is a lightweight matrix playground for tossing points onto 2x2 templates, tweaking zones, and exporting what you make.

## Privacy

No data leaves the tab.

Everything happens in your browser session: imports, edits, dragging points around, and exports are all client-side.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Templates and CSV data

Built-in templates are defined in `src/lib/presets.ts`.

Templates can either embed `points` directly in the preset or load point data from a CSV in `public/data/` via `pointsCsvPath`. The new `Enterprise Browsers` template reuses the Crazy Hot Matrix layout and loads its seed data from `public/data/enterprise-browsers.csv`.

### Enterprise Browsers maintainer workflow

1. Update the preset metadata in `src/lib/presets.ts` if you need to rename the template, axes, or default zones.
2. Update `public/data/enterprise-browsers.csv` to change the built-in browser list.
3. Keep browser icon assets alongside the CSV in `public/data/browser-icons/`, then reference them from the CSV with `icon_url`.
4. Keep explicit `x` and `y` coordinates in the CSV for deterministic placement.
5. Keep `Google Ultron` inside the current unicorn zone (`x: 8–10`, `y: 0–2`) unless the template geometry changes intentionally.
6. Run `npm run test` after editing either the preset or the CSV so the seed sanity checks still pass.

The current browser rows are placeholder content intended to demonstrate categories and placement, not a final market ranking.

### Point CSV fields

Point-only CSV import/export still supports the existing schema:

- `name`
- `x`
- `y`
- `category`
- `notes`
- optional: `icon_url`

Point coordinates are exported explicitly, so exporting and re-importing preserves the last saved point placement.
Point icons can be seeded from CSV with `icon_url` when you want branded markers instead of plain dots.

### Matrix CSV fields

Full matrix CSV import/export uses a `record_type` column so both points and zones can round-trip in one file.

#### Point rows

- `record_type=point`
- `name`
- `x`
- `y`
- `category`
- `notes`

#### Zone rows

- `record_type=zone`
- `name`
- `color`
- `x1`
- `y1`
- `x2`
- `y2`
- optional: `image_url`
- optional: `image_opacity`
- optional: `image_scale`

If a CSV includes `record_type=zone`, the sidebar importer treats it as full matrix state and replaces the current points and zones together. Older point-only CSV files without `record_type` still import as append-only point lists.

### Sample downloads

The toolbar now exposes two CSV templates:

- `CSV Template (points)` for quick point-only imports.
- `CSV Template (matrix)` for full matrix state imports with zone rows.

## Deploying to Cloudflare Pages

Cloudflare auto-detected Bun because `bun.lockb` existed, then failed on an outdated Bun lockfile format.

This repo now uses npm lockfiles for deployment, so configure Pages with:

```bash
Build command: npm run build
Build output directory: dist
Install command: npm ci
```

If you previously set a Bun install command (for example `bun install --frozen-lockfile`), replace it with `npm ci`.

For Wrangler-based deploys (`npx wrangler versions upload`), this repo includes `wrangler.jsonc` configured to upload the built static assets from `dist/`.

## Tests

```bash
npm run test
```

## License / usage

Feel free to do what you will with it.
