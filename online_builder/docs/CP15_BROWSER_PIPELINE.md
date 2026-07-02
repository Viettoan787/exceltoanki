# CP15 Browser Pipeline

Checkpoint: `CP15`
Status: accepted by user

## Scope

CP15 connects the accepted validation and APKG components into a browser-ready
pipeline without changing the stable Python workflow or building the UI.

Included:

- published/editable Google Sheet URL conversion to XLSX export;
- Google Sheet XLSX download through an injectable browser `fetch`;
- local XLSX workbook parsing with one source per worksheet;
- RFC-style CSV parsing through Papa Parse;
- CP13 validation and ignored-source audit;
- selected-source build-plan support;
- CP14 `sql.js + JSZip` APKG packaging;
- browser template loading and APKG download helper.

Not included: Google OAuth, private Sheets, UI integration, deployment or
replacement of the Python builder.

## Tester Gate

Run from `online_builder/`:

```text
npm run check:cp15
```

Expected final line:

```text
CP15 browser pipeline check passed: URL, CSV/XLSX adapters, source filtering and in-memory APKG packaging.
```

The user ran this check successfully. CP15 is complete as `v2.2.0`.

## Dependency Note

ExcelJS currently causes npm to report two moderate dependency advisories.
Do not run an automatic breaking `npm audit fix --force`. Review or replace the
XLSX parser before public deployment if the advisories remain relevant to the
browser bundle.
