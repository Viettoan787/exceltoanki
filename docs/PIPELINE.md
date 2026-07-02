# Quy trình PDF -> Anki CSV

Tài liệu này là quy trình chuẩn cho các PDF mới. Mỗi PDF nên chạy trong một thư mục riêng dưới `runs/` để tránh trộn file trung gian với dự án hiện tại.

## 1. Chuẩn bị

Đặt PDF vào một thư mục dễ nhớ, ví dụ:

```powershell
input\my_new_book.pdf
```

Nếu máy chưa có PyMuPDF:

```powershell
pip install pymupdf
```

## 2. Chạy toàn bộ pipeline

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book
```

Mặc định script sẽ:

1. Copy PDF vào `runs/my_new_book/input/source.pdf`.
2. Tách PDF thành part trong `runs/my_new_book/parts/`.
3. Extract cột trái/phải bằng chế độ `--word-split`.
4. Parse case và answer block.
5. Match case-answer theo thứ tự.
6. Validate các match nghi ngờ.
7. Export CSV wide format.

File quan trọng nhất sau khi chạy:

```text
runs/my_new_book/output/csv/pending_anki_case_wide_import_ready.csv
```

## 2.1. Quy tắc tách part có overlap

Với tài liệu case-answer, nên ưu tiên tách có overlap 2 trang để tránh mất case ở ranh giới part.

Mẫu mong muốn:

```text
part_001: pages 001-051
part_002: pages 050-101
part_003: pages 100-151
```

Nghĩa là part sau lùi lại 2 trang so với ranh giới cũ. Khi merge/export cuối, bản trùng do overlap phải được loại hoặc đánh dấu `Rejected`, còn bản đầy đủ hơn được giữ lại.

Nếu có lỗi cần xem tay:

```text
runs/my_new_book/output/csv/pending_anki_case_wide_warnings.csv
runs/my_new_book/output/clean/validation_summary.md
runs/my_new_book/logs/pipeline.log
```

## 3. Chạy thử 20 trang đầu

Khi gặp PDF mới chưa chắc layout giống tài liệu cũ, nên chạy thử:

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book_test --test-pages 20 --test-only --stop-after extract
```

Sau đó mở:

```text
runs/my_new_book_test/output/left_right/
```

Kiểm tra các file `*_debug_preview.md`. Nếu tách cột ổn thì chạy toàn bộ như mục 2.

## 4. Resume khi đã có part/output

Nếu đã tách PDF rồi và chỉ muốn chạy lại từ extract:

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book --start-at extract
```

Nếu đã sửa clean JSON thủ công và chỉ muốn validate/export lại:

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book --start-at validate
```

Nếu chỉ muốn export lại CSV:

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book --start-at export
```

## 5. Cấu trúc thư mục một run

```text
runs/my_new_book/
├─ input/
│  └─ source.pdf
├─ parts/
├─ output/
│  ├─ left_right/
│  ├─ cases/
│  ├─ answers/
│  ├─ clean/
│  └─ csv/
├─ logs/
│  └─ pipeline.log
├─ README.md
└─ run_manifest.json
```

## 6. Ghi chú quan trọng

- Chế độ mặc định là `--word-split` vì các khung đáp án hẹp dễ bị tách sai nếu dùng block text.
- Pipeline chỉ tự động hóa phần cơ học. Nếu `warnings.csv` có dòng, vẫn cần kiểm tra tay hoặc nhờ AI G review.
- Các file ở `output/`, `parts/` gốc là kết quả của đợt xử lý hiện tại. Với PDF mới, ưu tiên dùng `runs/<name>/...`.

## 7. Lọc Needs review và dùng AI G

Sau khi chạy pipeline, xem số lượng `Needs review` tại:

```text
runs/my_new_book/output/clean/validation_summary.md
```

Nếu còn nhiều `Needs review`, tạo batch cho AI G:

```powershell
python scripts\make_ai_g_review_batches.py --run-dir runs\my_new_book --batch-size 20
```

Script sẽ tạo:

```text
runs/my_new_book/output/ai_review/AI_G_BATCH_INDEX.md
runs/my_new_book/output/ai_review/antigravity_batch_001.md
runs/my_new_book/output/ai_review/antigravity_batch_002.md
...
```

Đưa cho AI G đọc theo thứ tự:

1. `docs/ANTIGRAVITY_REVIEW_PROMPT.md`
2. Một file batch, ví dụ `runs/my_new_book/output/ai_review/antigravity_batch_001.md`

AI G phải trả JSON thô. Lưu kết quả vào file tương ứng:

```text
runs/my_new_book/output/ai_review/antigravity_result_001.json
```

Apply kết quả:

```powershell
python scripts\apply_antigravity_review.py --result runs\my_new_book\output\ai_review\antigravity_result_001.json --clean-dir runs\my_new_book\output\clean --answers-dir runs\my_new_book\output\answers --audit runs\my_new_book\output\ai_review\antigravity_apply_audit_001.json
```

Sau khi apply các batch, chạy lại validate và export:

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book --start-at validate
```

Nguyên tắc apply:

- `confidence = high` và chọn candidate cụ thể: tự sửa sang answer block đó.
- `confidence = medium`: giữ `Needs review`, ghi note.
- `confidence = low` hoặc `best_candidate = none`: giữ `Needs review`.
- `action = reject`: loại record khỏi CSV.

Nếu muốn tiết kiệm token cho AI G, giảm batch size hoặc giảm độ dài text:

```powershell
python scripts\make_ai_g_review_batches.py --run-dir runs\my_new_book --batch-size 10 --max-case-chars 3000 --max-answer-chars 1800
```

## 8. Xuat APKG cho Anki

Sau khi CSV da sach/review xong, co the tao thang file `.apkg` de tranh import nham deck hoac nham note type.

Case:

```powershell
python scripts\build_apkg.py --type case --deck "Nhi::Case" --input runs\nhi_y4y6\output\csv\pending_anki_case_wide_import_ready.csv --out runs\nhi_y4y6\output\apkg\nhi_case.apkg
```

MCQ thuong:

```powershell
python scripts\build_apkg.py --type normal --deck "Nhi::MCQ" --input input\review_normal.csv --out output\apkg\nhi_mcq.apkg
```

Ghi chu:

- Script dung template trong `Anki_template/`.
- Neu du lieu co cot `Status`, chi lay dong `Approved` roi xoa hoan toan cot nay truoc khi tao Anki.
- Neu du lieu khong co `Status`, xu ly toan bo dong co du lieu nhung phai hien
  warning truoc khi build: `Sheet chua co cot Status, du lieu co the chua duoc
  kiem tra. Ban chac chan muon build?` `Status` khong bao gio la field/tag/Source cua Anki.
- Truong `Image`, `Ex`, `Ex1..Ex5`, va `Note` co the chua link ShareX/Google Drive tho. Template se tu render link anh khi hoc card.
- Link Drive can co quyen xem "Anyone with the link can view".

## 9. Cong thuc y khoa va hoa hoc trong Anki

Template V10 dung HTMLChem, khong dung MathJax/mhchem va khong can CDN.

```html
H<sub>2</sub>O
HCO<sub>3</sub><sup>-</sup>
Ca<sup>2+</sup>
CO<sub>2</sub> + H<sub>2</sub>O ⇌ H<sub>2</sub>CO<sub>3</sub>
```

Bao toan/chuan hoa an toan `->`, `=>`, `<->` va `⇌`; khong sua URL/the HTML.
## Build one APKG from multiple CSV files

This is a fallback/CLI workflow. The local web app's primary workflow connects
directly to a private Google Spreadsheet using read-only OAuth, scans selected
tabs and builds from one immutable snapshot.

1. Put all MCQ and MCQ Case CSV exports in `input/anki_csv/`.
2. Run:

```powershell
python scripts/build_apkg_batch.py --out "output/apkg/0_Nhi.apkg" --deck "0 Nhi"
```

The script auto-detects each CSV from its remaining Anki columns and supports
headerless Apps Script exports. For any input that contains `Status`, it keeps
only `Approved` rows and removes `Status`; otherwise it processes every
non-empty row with a visible warning before build.
Status never enters Anki. The current folder CLI uses the requested root deck;
the local web app maps each Spreadsheet/XLSX tab name to a deck path, translating
` > ` to Anki `::` for subdecks.
