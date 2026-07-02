# Standalone Web App Idea

This note records the future direction for a Sheet-to-Anki web app that can run
without Python. It is intentionally not part of the current CP5 implementation.
Do not start coding this path until the local Python-backed workflow has passed
the required Anki acceptance checkpoints.

## Goal

Build a standalone Sheet-to-Anki app that can be opened in a browser and produce
an `.apkg` file without running `python webapp/dev_server.py`.

Primary target:

```text
Google Sheet / CSV / XLSX
-> browser-side validation
-> browser-side APKG build
-> user downloads .apkg
```

## Preferred Long-Term Direction

Use a fully client-side static web app, similar in deployment style to
`exceltoanki.github.io`.

Possible libraries:

- `xlsx` for CSV/XLSX reading.
- Google Sheets API in browser for Sheet reads.
- `sql.js` plus `JSZip`, or a maintained `genanki-js` equivalent, for APKG
  creation.
- Browser download APIs or `FileSaver.js` for saving `.apkg`.

Why this is the preferred direction:

- No Python install or local backend.
- Can be hosted on GitHub Pages or opened as a static app.
- User data can stay inside the browser when using local CSV/XLSX.
- Easier day-to-day use once the APKG contract is stable.

Main risks:

- APKG generation in JavaScript is more complex than the current Python path.
- Google OAuth in a browser requires a separate Web client setup.
- Large XLSX/Sheet inputs may be slower or memory-heavy in the browser.
- SQLite/APKG correctness must be tested as strictly as the Python builder.

## Alternative Directions

### Google Apps Script First

Use Apps Script inside Google Sheets to validate rows, mark issues and export
clean data.

Good for:

- Sheet-native validation.
- Approved/Pending review workflows.
- Coloring cells, adding comments and helping manual correction.

Weak for:

- Direct APKG creation.
- Large binary/SQLite packaging.
- Long-running builds.

Recommended role: helper for validation/export, not the main APKG builder.

### Public Backend Without Python

Use Cloudflare Workers, Vercel/Node, Deno Deploy or another JavaScript backend.

Good for:

- Stronger processing than browser-only builds.
- Centralized versioning and logs.
- Easier Google API integration in some setups.

Risks:

- Medical/question content leaves the user's machine.
- Requires authentication, retention policy and security review.
- More infrastructure to maintain.

Recommended role: only after the local and static-browser designs are stable.

## Migration Plan From Current Project

1. Keep the current Python-backed local app as the reference implementation.
2. Finish CP5/CP6 and CP7 Anki manual acceptance first.
3. Freeze the schema, template and APKG output contract.
4. Build a JavaScript-only prototype that reads CP1 CSV/XLSX fixtures.
5. Compare JS APKG output against the Python builder for:
   - note count
   - card count
   - deck names
   - model names
   - field order
   - CardUID/GUID stability
   - image rendering
   - HTML chemistry rendering
6. Add Google Sheets browser OAuth only after CSV/XLSX parity is proven.
7. Host on GitHub Pages only after CP7-style Anki import tests pass.

## Acceptance Rules Before Replacing Python

The standalone app cannot replace the Python local app until it passes:

- CP0 schema contract.
- CP1 fixture corpus.
- CP2 import/normalize/validate behavior.
- CP4 APKG integrity checks.
- CP7 real Anki functional checks.
- CP9 exam-builder compatibility checks, if exam export depends on the same
  generated Anki data.

## Current Decision

For now:

- Continue the CP5/CP6/CP7 path with the Python-backed local app.
- Treat the standalone client-side app as a future portability project.
- Use this document as the starting brief when that migration begins.
