# Paperwork samples (marketing)

These PDFs and page PNGs are generated from the **real** Beacon builders in `monolith-beacon`, not hand-mocked HTML.

## Regenerate

Whenever certificate or inspection-report PDF layout/content changes in Beacon:

```bash
cd ../monolith-beacon
npm run generate:marketing-samples
```

That rewrites this folder (PDFs, PNGs, `manifest.json`).

## Notes

- Content uses fixed sample dates (`2026-07-14T10:30:00.000Z`) so regenerations stay stable.
- Marked as SAMPLE on the marketing page — not issued documents.
- Source helpers: `app/js/dev/marketing-sample-export.js` + `scripts/generate-marketing-samples.mjs`.
