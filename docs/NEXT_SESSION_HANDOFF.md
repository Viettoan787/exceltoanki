# NEXT SESSION HANDOFF - Sheet-to-Anki

Use this file to start the next Codex/AI session without re-reading the whole
project.

## Prompt de dan vao phien sau

```text
Hay tiep tuc du an Sheet-to-Anki trong workspace hien tai.
Neu can duong dan day du, lay tu cwd cua phien dang chay.

Doc theo thu tu:
1. docs/NEXT_SESSION_HANDOFF.md
2. docs/ONLINE_CLIENT_SIDE_BUILD_PLAN.md
3. online_builder_reference_snapshot/ONLINE_BUILDER_IMPLEMENTATION_BLUEPRINT.md
4. online_builder_reference_snapshot/TEMPLATE_REFERENCE_INDEX.md
5. 80 dong cuoi docs/project_status.md
6. 80 dong cuoi docs/task.md

Khong doc toan bo input/output/runs neu chua can.
Khong sua workflow Python local dang on dinh neu toi chua dong y.
Khong doi layout de sua loi loc nguon. Loi nhu Sheet2 xuat hien trong bang build
la loi schema/status source-filtering, khong phai loi UI.

Checkpoint hien tai:
- CP19 local contribution/contact UI da them.
- Current version: `v2.4.0`.

Viec can lam truoc khi code:
- Neu tiep tuc code: hoan thien/test/deploy CP19 hoac bat dau checkpoint tiep
  theo sau CP19.
- Chua thay the workflow Python local.
- CP17 da deploy sau khi user xac nhan; CP18/CP19 chua deploy.
- Khong them research telemetry/collection neu chua co scope rieng va consent
  minh bach.

Quy tac deploy:
- Local la noi sua va test.
- GitHub/Cloudflare la ban cuoi da on.
- Chi deploy khi local da duoc test va toi xac nhan.
- Workflow tham khao:
  cd /d "<project-folder-local>"
  npx serve . -l 8080
  Sau khi on:
  cd "<project-folder-local>"
  npx --yes wrangler deploy

Hay bao cao ngan gon:
1. Ban da doc gi.
2. CP hien tai la gi.
3. Buoc tiep theo du kien.
4. Chua sua code neu toi chua dong y.
```

## Trang thai hien tai

- Stable local workflow: Python-backed local web app.
- Local app da doc Google Sheet/CSV/XLSX, validate schema/Status/CardUID va build
  APKG.
- Apps Script da co:
  - validate sheet hien tai;
  - tao CardUID sheet hien tai;
  - sidebar validate co reload;
  - sua loi `0`/`0%` bi xem la o trong.
- Web app da co:
  - Google Sheet/CSV/XLSX validation;
  - About/version;
  - ignored source filtering;
  - in-app huong dan.

## Checkpoint hien tai

- CP11: done.
- CP12: done, `v2.0.0` contract freeze and online-builder sandbox start.
- CP13: done, `v2.0.1` validation/source-filtering core.
- CP14: done, `v2.1.0` minimal browser APKG builder accepted in Anki.
- CP15: done, `v2.2.0` browser end-to-end core accepted.
- CP16: done, `v2.3.0` UI integration accepted.
- CP17: done and accepted locally, `v2.3.2` release-hardening selection/build
  and Status gate fix.
- CP18: local automated regression guard added, `v2.3.3` Python compatibility
  comparison for JS APKG invariants.
- CP19: local UI polish added, `v2.4.0`, contribution/contact page with Google
  Form and Facebook links.
- Current checkpoint: CP19 local UI added; not deployed.
- Production URL: `https://sheet-to-anki-online-builder.pages.dev`.

## CP19 scope - local UI added

- Updated displayed brand to `SheetToAnki`.
- Added sidebar item and section `Đóng góp`.
- Contribution section contains:
  - Google Form feedback link:
    `https://docs.google.com/forms/d/e/1FAIpQLScB0jYl3RleT-mzcaOmddFXKglE6_A-uS4eYUJxZ2O0J1ntbQ/viewform?usp=publish-editor`
  - Facebook contact link:
    `https://www.facebook.com/nvtylnbt`
  - optional coffee-support QR at `online_builder/public/support-qr.png`.
- No hidden telemetry, no workbook collection, no backend added.
- Released local metadata: `v2.4.0 / CP19`;
  status `contribution-contact-page`.
- Verification passed locally:
  - `npm test`;
  - `npm run build`.
- User has reported CP19 checkpoint acceptance.
- Manual test needed before deploy:
  - version shows `2.4.0 / CP19`;
  - sidebar `Đóng góp` scrolls to the new section;
  - Google Form/Facebook buttons open correctly;
  - coffee-support QR is visible and scannable;
  - quick validate/build smoke path still works.

## CP18 scope - local automated complete

- Added `online_builder/tests/cp18-python-regression.test.mjs`.
- Added `npm run check:cp18` and included it in `npm test`.
- CP18 compares the JS APKG path against stable Python builder invariants:
  - note/card count;
  - deck tree and deterministic deck IDs;
  - model IDs, model names and field order;
  - CardUID-derived GUIDs matching Python `genanki.guid_for`;
  - unchanged GUID when question text changes but CardUID remains the same;
  - APKG has `collection.anki2` and `media`, with SQLite integrity `ok`.
- Released local metadata: `v2.3.3 / CP18`;
  status `python-regression-guard`.
- Verification passed locally:
  - `npm run check:cp18`;
  - `npm test`;
  - `npm run build`.
- Manual Anki import is only needed if promoting CP18 beyond local QA or before
  deployment.

## CP17 scope - local complete

- Static build/preview behavior verified locally:
  - `npm test` passed;
  - `npm run build` passed;
  - `dist/index.html` uses `./assets/...`;
  - `npm run preview -- --host 127.0.0.1 --port 4174` smoke test returned
    HTTP 200.
- Fixed Build APKG button gating so blockers are evaluated against the selected
  source set, not the whole workbook.
- Browser APKG pipeline now validates/packages only selected sources.
- Google Sheet tabs without `Status` are ignored and no longer reported as
  visible blockers.
- Built JS contains `2.3.2`, `CP17` and
  `release-hardening-status-gate-fix`.
- Local preview/release notes documented in
  `online_builder/docs/CP17_RELEASE_HARDENING.md`.
- Dependency audit reviewed:
  - `npm audit --omit=dev` reports 2 moderate advisories via `exceljs -> uuid`;
  - npm suggests an ExcelJS downgrade to 3.4.0, so no automatic fix was applied.
- Bundle-size warning reviewed:
  - JS bundle is about 1.24 MB minified / 356 KB gzip due to ExcelJS and sql.js.
- Deploy-ready local artifact exists in `online_builder/dist/`.
- User manual acceptance passed:
  - UI version check OK;
  - Google Sheet validation OK;
  - Build APKG OK;
  - Anki import OK.
- Cloudflare Pages deployment completed after explicit user confirmation:
  - project: `sheet-to-anki-online-builder`;
  - production URL: `https://sheet-to-anki-online-builder.pages.dev`;
  - deployment URL:
    `https://c20f37d7.sheet-to-anki-online-builder.pages.dev`;
  - production alias smoke check returned HTTP 200.

## CP16 scope - done

- Python UI snapshot copied to `online_builder/index.html`, `app.js`, and
  `styles.css`.
- `/api/*` calls replaced with browser-only Google Sheet/CSV/XLSX validation
  and APKG download.
- Vite static build uses relative asset paths for future GitHub Pages hosting.
- Browser UI reads public Google Sheet links and local CSV/XLSX files.
- Browser UI can build/download APKG from selected validated sources.
- Noisy `HTML_MEDICAL_SIGN_SAFETY` warnings for normal medical `<` / `>`
  comparison signs were replaced with narrower `HTML_CONTENT_SAFETY` checks for
  unsupported or malformed HTML only.
- Codex ran automated checks/build; user accepted the UI flow enough to
  continue.
- Private Google Sheet OAuth, research telemetry/collection and deployment
  remain out of scope.

## CP15 scope - done

- Google Sheet public URL -> XLSX export adapter.
- XLSX/CSV -> normalized source adapters.
- Browser template loader and APKG download helper.
- Validation -> build plan -> APKG bytes pipeline.
- No UI integration, OAuth or deployment yet.
- User ran `npm run check:cp15`; URL, CSV/XLSX adapters, ignored-source
  filtering and in-memory APKG packaging all passed.
- Released project metadata: `v2.2.0 / CP15`.
- ExcelJS currently brings two moderate npm dependency advisories; do not run
  `npm audit fix --force` automatically.

## Quy uoc version

- CP11 and earlier: stable local/Python 1.x line.
- CP12: `v2.0.0`, contract freeze and online-builder sandbox start.
- CP13: `v2.0.1`, validation/source-filtering core.
- CP14: `v2.1.0`, minimal browser/dev APKG build accepted in Anki.
- CP15: `v2.2.0`, browser end-to-end input/build pipeline accepted.
- CP16: `v2.3.0`, browser pipeline integrated into the Python UI snapshot.
- CP17: `v2.3.2`, release hardening, selected-source Build APKG fix and Google
  Sheet Status gate fix.
- Patch `v2.0.x`: validation fixes, fixture updates, small bug fixes.
- Minor `v2.1.0`: substantial new capability, such as working browser APKG build
  or browser Google Sheet flow.
- Major: only for schema/template/import identity changes that may affect Anki
  or the future exam-builder workflow.

## Rule quan trong

### Khong sua layout de sua source-filtering

If a tab such as `Sheet2` appears as a buildable source, fix validation logic:

- full MCQ or Case schema is required;
- Google Sheet sources require `Status`;
- at least one real data row is required;
- draft/unknown/blank tabs go to ignored/audit sources, not buildable sources.

The current UI layout remains stable unless the user explicitly asks for a
design change.

### Local -> GitHub/Cloudflare workflow

The user's preferred deployment pattern:

1. Edit locally.
2. Run local web preview.
3. Test and confirm.
4. Only then deploy with Wrangler.
5. GitHub/Cloudflare is treated as the final released version, not the scratch
   workspace.

This can apply to future `online_builder/`:

- build/test local first;
- show version + CP in About;
- record changelog;
- deploy only after user confirmation.

## CP12 scope - v2.0.0

CP12 should not begin by building APKG.

Expected outputs:

- create `online_builder/` sandbox only after user approval;
- copy/port schema constants;
- copy template references from `online_builder_reference_snapshot/Anki_template`;
- create fixture plan;
- create source-filtering decision table:
  - visible;
  - ignored;
  - warning-only;
  - blocker;
- record version metadata `v2.0.0 / CP12`.

Acceptance:

- stable Python local workflow untouched;
- no real data/secrets copied;
- schema constants match current contract;
- template files remain compatible with MCQ and MCQ Case fields;
- no UI redesign is included in CP12.

## CP13 scope - v2.0.1

CP13 is validation/source-filtering core. Status: done.

Expected outputs:

- browser/Node-compatible schema detection;
- Status filtering;
- deck path mapping `0 Nhi > Ho hap` -> `0 Nhi::Ho hap`;
- CardUID extraction from Source;
- duplicate CardUID detection;
- HTML/medical sign safety checks;
- visible source list plus ignored-source audit list.

Acceptance:

- JS validation output matches Python-style report for mini fixtures;
- `Sheet2`-style tabs do not appear in buildable sources;
- missing Status in Google Sheet source is ignored, not shown as a buildable
  source or visible blocker;
- malformed schema blocks or is ignored according to source type rule.

Evidence:

- `online_builder/src/core/`
- `online_builder/tests/cp13-validate.test.mjs`
- `npm test` in `online_builder/` passes.

## CP14 scope - done

CP14 is the accepted minimal APKG builder.

Expected outputs:

- build-plan adapter before real APKG backend;
- choose APKG library path for browser/dev prototype;
- preserve model field order and template compatibility;
- build no more than one MCQ and one Case fixture if the library path is
  viable;
- document stop condition if model/template/update-safe behavior is not
  reliable.

Acceptance:

- CP13 validation tests still pass;
- stable Python local workflow untouched;
- no real data/secrets copied;
- generated APKG, if created, is treated as test-only and must be manually
  imported into an Anki test profile before any release claim.

CP14 acceptance:

- `online_builder/src/apkg/` exists.
- `online_builder/docs/CP14_APKG_BUILDER_DECISION.md` exists.
- Build-plan check passes:
  `node tests/cp14-build-plan.test.mjs`
- JS APKG dependencies installed: `sql.js`, `jszip`.
- Test-only builder script exists:
  `cd online_builder`
  `npm run build:cp14-fixture`
- Expected test output:
  `online_builder/out/cp14-fixture.apkg`
- User ran `npm run build:cp14-fixture` successfully.
- Build output: 2 notes, 2 decks, 2 models; one normal and one Case.
- User confirmed Anki import, fields and front/back rendering were all correct.
- Released project metadata: `v2.1.0 / CP14`.
- User provided reference app for architecture only:
  `https://exceltoanki.github.io/t/ho-so`
- Screenshots show AGPL dependencies such as `genanki-js` and `mkanki`; do not
  copy source/UI from the reference app without explicit license approval.
- GitHub check completed:
  - `exceltoanki/exceltoanki.github.io` is compiled Pages output only;
  - no public full Angular/Ionic source repo was found;
  - `drquochoai/genanki-js` has readable browser APKG engine source but is
    AGPLv3;
  - its `sql.js -> collection.anki2 -> JSZip -> FileSaver` flow confirms the
    CP14 architecture, but implementation must remain independent.

## Files can doc tiep

Main docs:

- `docs/ONLINE_CLIENT_SIDE_BUILD_PLAN.md`
- `docs/DATA_SOURCE_AND_DECK_RULES.md`
- `docs/ANKI_TEMPLATE_CONTRACT.md`
- `docs/LOCAL_WEB_APP_CHECKPOINTS.md`
- `docs/project_status.md`
- `docs/task.md`

Online-builder snapshot:

- `online_builder_reference_snapshot/ONLINE_BUILDER_IMPLEMENTATION_BLUEPRINT.md`
- `online_builder_reference_snapshot/TEMPLATE_REFERENCE_INDEX.md`
- `online_builder_reference_snapshot/README.md`
- `online_builder_reference_snapshot/Anki_template/`

Do not read:

- `input/` unless needed for a real data issue;
- `output/` unless checking evidence;
- `runs/` unless debugging PDF pipeline;
- `secrets/` unless user explicitly asks about OAuth/local auth.
