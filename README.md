# Sheet-to-Anki

Browser-only Sheet-to-Anki builder for converting approved Google Sheet, CSV,
or XLSX review tables into Anki APKG decks.

Current release:

- Version: `v2.3.2`
- Checkpoint: `CP17`
- Hosted build: https://sheet-to-anki-online-builder.pages.dev

Main app source:

- `online_builder/`

Useful commands:

```powershell
cd online_builder
npm install
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

Notes:

- Public Google Sheet links work without OAuth when shared with viewer access.
- Google Sheet tabs must include a `Status` column before they are accepted as
  buildable sources.
- Private OAuth and research telemetry/collection are not part of the current
  release.
