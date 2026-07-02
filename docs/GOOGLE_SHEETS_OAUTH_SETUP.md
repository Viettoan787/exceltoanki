# Google Sheets OAuth Setup

This project reads private Google Spreadsheets from a local Python app.
Version 1 uses read-only installed-app OAuth.

## What stays private

- OAuth token is stored outside the repository.
- Default token path on Windows:

```text
%APPDATA%\PDF_Anki\google_sheets_token.json
```

- The app requests only:

```text
https://www.googleapis.com/auth/spreadsheets.readonly
```

- The app snapshots selected tabs before validation/build and does not edit
  cells.

## One-time Google Cloud setup

1. Create or open a Google Cloud project.
2. Enable Google Sheets API.
3. Create an OAuth Client ID.
4. Application type: Desktop app.
5. Download the client JSON.
6. Save it locally as:

```text
secrets/google_oauth_client.json
```

The `secrets/` folder must not be committed.

## Smoke commands

Preflight:

```powershell
python scripts\google_sheets_preflight.py
```

List tabs:

```powershell
python scripts\google_sheets_snapshot.py --spreadsheet "<Spreadsheet URL>" --list-tabs
```

Snapshot and validate all non-ignored tabs:

```powershell
python scripts\google_sheets_snapshot.py --spreadsheet "<Spreadsheet URL>" --snapshot-out output\sheets_snapshot.json --report-out output\sheets_validation_report.json
```

Snapshot selected tabs:

```powershell
python scripts\google_sheets_snapshot.py --spreadsheet "<Spreadsheet URL>" --tab "0 Nhi > Case" --tab "0 Nhi > Hô hấp" --report-out output\sheets_validation_report.json
```
