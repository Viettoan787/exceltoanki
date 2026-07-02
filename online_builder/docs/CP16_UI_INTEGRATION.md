# CP16 UI Integration

Checkpoint: `CP16`
Status: accepted as `v2.3.0`

CP16 reuses the stable Python web UI and replaces its `/api/*` calls with the
accepted browser pipeline.

Included:

- same source, validation, deck, issue, guide and About surfaces;
- public Google Sheet XLSX ingestion;
- local CSV/XLSX file ingestion without upload;
- source selection and ignored-source audit;
- browser APKG build and download;
- relative Vite production build for static hosting.
- HTML safety warning refinement: ordinary medical comparison signs such as
  `pH < 7.35` and `INR > 1.5` no longer create bulk warnings; supported Anki
  HTML tags such as `<sub>`, `<sup>`, `<br>`, `<b>`, `<i>`, `<span>`, `<a>`
  and `<img>` remain allowed.

Not included:

- private Google Sheets/OAuth;
- deployment;
- any change to the stable Python workflow.

Automated checks and production build are run by Codex. User acceptance is
limited to UI interaction and importing the resulting APKG into Anki.

Acceptance:

- User confirmed the UI flow is stable enough to continue.
- The noisy `HTML_MEDICAL_SIGN_SAFETY` warnings from loose `<` / `>` medical
  comparison signs were fixed.
- `npm test` passed.
- `npm run build` passed.
