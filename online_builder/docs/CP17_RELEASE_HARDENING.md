# CP17 Release Hardening

Checkpoint: `CP17`
Status: accepted locally; deployed to Cloudflare Pages

CP17 prepares the accepted browser UI for static hosting. It
does not change the stable Python workflow.

Completed checks:

- `npm test` passed.
- `npm run build` passed.
- `dist/index.html` uses relative asset paths such as `./assets/...`.
- Static preview smoke test passed with HTTP 200 on `http://127.0.0.1:4174`.
- Fixed Build APKG selection gating: blockers are now evaluated against the
  selected source set, and the browser packaging pipeline validates only the
  selected sources before creating APKG bytes.
- Fixed Google Sheet `Status` gate behavior: tabs without `Status` are ignored
  and are not reported as visible blockers.
- Built JS contains the current release metadata.
- Deploy-ready local artifact exists in `online_builder/dist/`.
- User manual acceptance passed: UI version check, Google Sheet validation,
  APKG build/download and Anki import were all confirmed OK.
- Cloudflare Pages deployment completed and the production URL returned HTTP
  200.

Known release notes:

- Vite reports a large JS chunk, about 1.24 MB minified / 356 KB gzip, because
  the browser build includes ExcelJS and sql.js. This is acceptable for the
  current local/static release candidate, but later CPs can split XLSX/APKG
  code with dynamic imports.
- `npm audit --omit=dev` reports 2 moderate advisories from `exceljs -> uuid`.
  The suggested fix downgrades ExcelJS to `3.4.0` and is not applied
  automatically.
- Private Google Sheet OAuth and research telemetry/collection are still out of
  scope.

Released metadata:

- `v2.3.2 / CP17`
- status: `release-hardening-status-gate-fix`

Production URL:

- `https://sheet-to-anki-online-builder.pages.dev`

Deployment evidence:

- Cloudflare Pages project: `sheet-to-anki-online-builder`
- Deployment URL:
  `https://c20f37d7.sheet-to-anki-online-builder.pages.dev`
- Production alias smoke check: HTTP 200.

Local commands:

```powershell
cd "D:\Documents\Sách đọc thêm\PDF_Anki\online_builder"
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

Deploy rule:

- Build and preview locally first.
- Ask the user for explicit approval before GitHub/Cloudflare deployment.
- Do not add hidden telemetry or raw workbook collection.
