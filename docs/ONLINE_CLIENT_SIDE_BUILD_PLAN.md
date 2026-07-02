# Online Client-Side Build Plan

## Muc tieu

Tach rieng huong build APKG online/static de nghien cuu va phat trien ma
khong lam hong workflow Python hien tai.

Ban Python local hien tai duoc xem la `stable/local workflow`:

- doc Google Sheet/CSV/XLSX;
- validate schema, Status, CardUID;
- build APKG bang Python;
- dung cho cong viec that cua user.

Huong online/static chi duoc lam trong sandbox rieng cho den khi dat du
test tuong duong.

## Vi sao khong sua truc tiep ban Python hien tai

- Ban Python da build duoc APKG va user dang dung duoc.
- APKG builder co nhieu chi tiet de vo: SQLite, media, model id, deck id,
  template HTML/CSS/JS, update-safe CardUID.
- Neu port sang JavaScript qua som, loi se kho phan biet la do data, do
  template hay do builder moi.
- Cach an toan la giu Python lam ban doi chieu, tao mot project/module
  client-side rieng.

## Kien truc tham khao tu app tien boi

App tien boi co kha nang build ngay trong trinh duyet. Cac thu vien duoc
nhac trong phan ban quyen gom:

- `genanki-js`
- `sql.js`
- `JSZip`
- `FileSaver.js`
- `mkanki`

Dong chay kha nang cao:

```text
Sheet/Excel/CSV data
-> JavaScript parse rows
-> Tao deck/model/note
-> sql.js tao collection.anki2
-> JSZip dong goi .apkg
-> FileSaver.js tai file ve may
```

Day la huong co the dua len GitHub Pages/Cloudflare Pages vi khong can
server Python.

## Nguyen tac ban quyen

- Khong copy y nguyen source code cua app tien boi vao du an.
- Chi tham khao kien truc, thu vien va luong thao tac.
- Neu sau nay dung truc tiep thu vien co license AGPL/GPL/MIT, phai ghi ro
  trong docs va UI About.
- Template MCQ/Case cua du an nay van la template rieng.

## Pham vi sandbox moi

De tranh lam hong ban Python, huong moi nen nam rieng:

```text
online_builder/
  README.md
  package.json
  src/
    schema.js
    validate.js
    build-apkg.js
    templates/
  fixtures/
    mcq.json
    case.json
  tests/
```

Hoac neu chua code, chi can giu tai lieu trong `docs/` cho den khi user
dong y mo CP12.

## Nguyen tac UI hien tai

Khong coi cac loi nhu `Sheet2` xuat hien trong bang build la loi layout.
Do la loi loc nguon/validation:

- nguon Google Sheet chi duoc dua vao report/build khi co du schema MCQ hoac
  Case va co cot `Status`;
- tab khong du schema, thieu `Status`, hoac khong co dong du lieu phai bi bo
  qua hoac dua vao audit `ignoredSources`;
- UI hien tai chi hien thi ket qua da loc dung, khong can thay doi bo cuc de
  sua cac loi nay.

Chi thay doi layout khi user yeu cau rieng ve trai nghiem, khong gan layout
vao checkpoint sua schema/source-filtering.

## Quy uoc version tu CP12

Tu khi mo nhanh online/static builder, dung semantic version de de theo doi:

- CP11 tro ve truoc: dong local/Python 1.x, dang la workflow on dinh.
- CP12: `v2.0.0`, mo the he online-builder rieng va dong bang contract.
- CP13: `v2.0.1`, validation/source-filtering core dau tien.
- CP14 tro di: tang patch/minor theo muc do thay doi:
  - patch `v2.0.x` cho sua logic, validate, fixture, loi nho;
  - minor `v2.1.0` cho them kha nang lon nhu APKG builder hoat dong, Google
    Sheet browser flow, hoac static release dau tien;
  - major chi tang khi doi field schema, template contract, hoac cach import
    co the anh huong Anki/exam-builder.

Version phai hien trong docs, About/build metadata cua nhanh online khi no
bat dau co UI/build rieng.

## CP12 - Phan tich va dong bang contract

- Version: `v2.0.0`.
- Ghi lai contract field MCQ va Case dang dung.
- Ghi ro loi source-filtering la logic/backend/core, khong phai layout.
- Xac dinh output APKG phai giong ban Python o cac diem:
  - deck path;
  - note model fields;
  - card template;
  - CardUID/update behavior;
  - media/image handling;
  - HTML escaping cho dau y khoa nhu `<2cm`, `INR > 1.5`.
- Chon thu vien JS de thu nghiem:
  - uu tien `genanki-js` neu du kha nang;
  - neu can tao SQLite thap hon thi dung `sql.js` + `JSZip`.

## CP13 - Prototype JS voi fixture nho

- Version: `v2.0.1`.
- Lay 1 MCQ va 1 Case fixture da co.
- Trien khai validation/source-filtering truoc:
  - full MCQ/Case schema;
  - bat buoc `Status` voi Google Sheet;
  - skip `Sheet2`/draft tab vao ignored audit.
- Chi sau khi validation khop Python moi build APKG bang JS trong moi truong
  local/dev va import vao Anki test profile.
- So sanh voi APKG Python:
  - deck dung;
  - field dung;
  - front/back render dung;
  - image/Drive link dung;
  - khong loi font/encoding.

## CP14 - Port template

- Dung lai template MCQ/Case da on dinh.
- Khong bo tinh nang dang co:
  - show answer;
  - dung/sai mau xanh/do;
  - font Segoe UI;
  - dark/light;
  - font size controls;
  - Drive image renderer;
  - HTML/medical sign safety.

## CP15 - Static web app

- Chay hoan toan trong browser.
- Input co the la:
  - CSV/XLSX upload;
  - Google Sheet qua OAuth browser flow;
  - pasted/exported JSON snapshot.
- Output la file `.apkg` tai ve truc tiep.
- Co About/version rieng de phan biet ban Python va ban static.

## Tieu chi khong duoc phep thay the ban Python

Huong online/static chua duoc thay the ban Python neu chua dat cac dieu kien:

- APKG import vao Anki khong loi.
- MCQ va Case render dung tren front/back.
- Update-safe CardUID duoc kiem chung.
- 100% fixture CP1/CP5/CP7 quan trong pass.
- User test va xac nhan tren Anki profile rieng.

## Ket luan hien tai

Huong online client-side la kha thi va dang de nghien cuu, nhung phai la
mot nhanh song song. Ban Python local hien tai van la ban san xuat ca nhan
cho den khi online builder co test va Anki acceptance tuong duong.
