# Monolith Compliance — marketing hub

Public site for **https://www.monolithcompliance.co.uk/**  
Beacon product app stays on **https://beacon.monolithcompliance.co.uk/**

Static HTML/CSS/JS. No build step.

## Local preview

Serve the repo root as the site root, e.g.:

```bash
npx --yes serve -l 5173 .
```

## Paperwork samples

`assets/paperwork-samples/` holds PDFs and page PNGs generated from Beacon’s real PDF builders.

**Regenerate whenever certificate / inspection-report layouts change** (in the sibling `monolith-beacon` repo):

```bash
cd ../monolith-beacon
npm run generate:marketing-samples
```

See `assets/paperwork-samples/README.md`.

## Deploy

See [DEPLOY.md](./DEPLOY.md).
