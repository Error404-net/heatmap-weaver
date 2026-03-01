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
