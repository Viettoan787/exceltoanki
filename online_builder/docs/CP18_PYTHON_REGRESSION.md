# CP18 Python Regression Guard

Checkpoint: `CP18`
Status: local automated guard added

CP18 compares the browser/static APKG path against invariants from the stable
Python builder. It does not change the stable Python workflow and does not add
OAuth, telemetry or layout changes.

Automated coverage:

- JS APKG note/card count matches the Python fixture baseline.
- Deck tree and deterministic deck IDs match Python `stable_int`.
- Model IDs, model names and field order match the Python template contract.
- JS `guidFor(CardUID)` matches Python `genanki.guid_for(CardUID)` for fixture
  CardUIDs.
- Editing question text while keeping the same CardUID keeps the Anki note GUID
  unchanged.
- Generated APKG contains `collection.anki2` and `media`; SQLite integrity is
  `ok`.

Commands:

```powershell
cd "D:\Documents\Sách đọc thêm\PDF_Anki\online_builder"
npm run check:cp18
npm test
npm run build
```

Manual tester gate:

- Import a CP18-built APKG into a clean Anki test profile only if this build is
  promoted beyond local QA.
- Check one MCQ card and one Case card.
- Re-import after editing content with the same CardUID if update behavior needs
  a release claim.

Released metadata:

- `v2.3.3 / CP18`
- status: `python-regression-guard`
