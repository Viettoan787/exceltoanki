# Sheet-to-Anki Online Builder Sandbox

Version: `v2.3.2`
Checkpoint: `CP17`

This folder is the isolated online/static builder line. The stable Python local
workflow remains the production workflow and must not be modified to make this
prototype work.

## CP12 Scope

CP12 freezes the data/template contract before any browser APKG work starts.

Included now:

- MCQ and MCQ Case schema constants.
- Online-builder version metadata.
- Current Anki template copies from `online_builder_reference_snapshot/`.
- Mini fixtures with no real user data.
- Source-filtering decision table for CP13 validation work.

Not included in CP12:

- Browser APKG generation.
- Google OAuth/browser Sheet flow.
- UI redesign.
- Changes to `scripts/`, `webapp/`, or the stable Python builder.

## CP13 Scope

CP13 adds the first browser/Node-compatible validation core.

Included now:

- Schema detection for MCQ and MCQ Case headers.
- Google Sheet source-filtering rules.
- `Status` filtering for `Approved` rows.
- Deck path mapping from ` > ` to `::`.
- CardUID extraction from `Source`.
- Duplicate CardUID blocker detection.
- HTML safety warnings for unsupported or malformed tags.
- Public report split between `sources[]` and `ignoredSources[]`.

## CP14 Scope

CP14 delivered the minimal APKG builder and was accepted by the user in Anki.

Included now:

- Build-plan adapter that converts CP13 validation reports into deterministic
  deck/model/note specs.
- Stable model IDs and model names mirrored from the Python builder.
- Deck ID derivation namespace mirrored from the Python builder.
- Template file references for MCQ and MCQ Case.

Accepted output:

- Real test-only `.apkg` output through `sql.js + JSZip`.
- One MCQ and one Case note imported and rendered correctly in Anki.

## CP15 Scope

CP15 connects Google Sheet/XLSX/CSV input adapters, validation, build planning
and APKG packaging into a browser-ready pipeline. The user tester gate passed;
UI integration and deployment remain out of scope.

## CP16 Scope

CP16 integrates the accepted browser pipeline into the stable Python web UI
snapshot without redesigning the interface.

Included now:

- Browser-only public Google Sheet, XLSX and CSV validation.
- Browser APKG download from selected sources.
- Python UI snapshot surfaces for source table, detail, issues, guide and
  About/version.
- Vite static build with relative assets for future static hosting.
- Refined HTML warning behavior: medical comparison signs such as `pH < 7.35`
  and `INR > 1.5` are not warnings, while unsupported or malformed HTML still
  reports `HTML_CONTENT_SAFETY`.

Not included in CP16:

- Private Google Sheet OAuth.
- Research telemetry or collection.
- Deployment to GitHub/Cloudflare.

## Contract Summary

- `Status` is review metadata only and never becomes an Anki field.
- Google Sheet tabs require a full MCQ or Case schema, a `Status` column, and
  at least one real data row before they can become buildable sources.
- CSV/XLSX files may be validated with different warning/blocker policy, but
  schema detection still uses the same field contract.
- Card identity remains embedded in `Source` through a CardUID such as
  `anki_10000001`.
- Deck path mapping converts only spaced separators: `0 Nhi > Ho hap` becomes
  `0 Nhi::Ho hap`.
- The future online UI must start from the stable Python web UI snapshot in
  `online_builder_reference_snapshot/webapp_static/`; source-filtering fixes
  belong in this validation core, not in a layout redesign.

## Next Checkpoint

CP17 is the current local release-hardening build as `v2.3.2`. It fixes selected
source Build APKG behavior and treats Google Sheet tabs without `Status` as
ignored sources instead of visible blockers. Deployment still requires explicit
user confirmation.
