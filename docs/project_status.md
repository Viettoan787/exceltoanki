# project_status.md — Trạng thái dự án PDF → CSV Anki

## Error playbook

Các loại lỗi đã gặp và cách xử lý được tổng hợp tại:

```text
docs/error_playbook.md
```

## 1. Mục tiêu hiện tại

Xây dựng pipeline để chuyển PDF câu hỏi trắc nghiệm, bao gồm file rất dài khoảng 800 trang, thành CSV dùng cho Google Sheets và Anki.

Bang Review noi bo co them `Status`. CSV/APKG cuoi dua vao Anki phai bo
hoan toan `Status` va co dung cac cot:

```text
Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags
```

Neu bat ky nguon CSV/Spreadsheet nao co `Status`, chi giu dong `Approved` roi
xoa cot nay. Neu khong co Status, xu ly tat ca dong co du lieu nhung phai
hien warning: `Sheet chua co cot Status, du lieu co the chua duoc kiem tra.
Ban chac chan muon build?`

Người dùng muốn mặc định xuất file `.csv` cho các tác vụ Anki/Google Sheets.

## 2. Tình hình đã phân tích

### 2.1. MarkerPDF

MarkerPDF có thể chuyển PDF sang Markdown, nhưng với file dài 500–800 trang và layout bảng/cột phức tạp thì:

- có thể chậm;
- dễ khó kiểm soát nếu chạy nguyên file;
- không phải lựa chọn tối ưu nếu mục tiêu chính là tách chính xác cột câu hỏi và cột đáp án.

### 2.2. PyMuPDF basic extraction

Đã có ví dụ `basic` cho thấy text bị trộn thứ tự:

```text
Tình huống & Câu hỏi
Đáp án & Giải thích
Bệnh nhân...
Câu hỏi...
Đáp án...
```

Vấn đề: tiêu đề và nội dung cột phải có thể bị chèn vào giữa cột trái, khiến người đọc và AI dễ nhầm.

### 2.3. PyMuPDF columns extraction

Đã có ví dụ `columns_v2` tách được `LEFT` và `RIGHT`, cho thấy hướng tách cột có triển vọng hơn.

Tuy nhiên vẫn có vấn đề:

- Nội dung case có thể vắt qua trang.
- Vị trí cột đáp án không cố định giữa các trang.
- Không thể hard-code ranh giới cột theo tỷ lệ 60/40.

### 2.4. PDF → Word

Đã thử chuyển PDF sang Word nhưng bảng bị lỗi.

Kết luận: không dùng Word làm pipeline chính.

## 3. Quyết định kỹ thuật đã chốt

Pipeline chính:

```text
PDF gốc
→ tách test 20 trang
→ PyMuPDF tách cột động
→ debug_preview.md + debug_layout.json
→ nếu ổn, tách PDF thành part 50 trang
→ chạy tách cột cho từng part
→ AI Agent chia all_left.md thành cases_left
→ AI Agent chia all_right.md thành answers_right
→ match case với answer block
→ clean.md / clean.json
→ CSV Pending
→ AI 2 / script checker
→ CSV Approved hoặc Needs review
```

## 4. Quy tắc quan trọng

### 4.1. Không xử lý nguyên 800 trang ngay

Phải test 20 trang trước.

Sau khi thuật toán tách cột ổn, mới tách thành từng file 50 trang.

### 4.2. Không hard-code tọa độ cột

Do người dùng đã cung cấp ví dụ có nhiều kiểu layout:

- Có trang cột đáp án rộng vừa.
- Có trang cột đáp án rất hẹp sát phải.

Vì vậy script phải nhận diện ranh giới cột động theo từng trang.

### 4.3. Cần file debug

Bắt buộc xuất:

```text
debug_preview.md
debug_layout.json
```

Mục tiêu là người dùng chỉ cần kiểm tra các trang `REVIEW_REQUIRED`, không phải dò toàn bộ 800 trang.

## 5. Trạng thái triển khai hiện tại

Chưa triển khai code chính thức trong dự án.

Đã chốt thiết kế pipeline và chuẩn CSV.

Việc cần làm ngay:

1. Tạo thư mục `D:\PDF_Anki`.
2. Copy PDF gốc vào `D:\PDF_Anki\input\source.pdf`.
3. Viết `split_pdf.py`.
4. Tạo file test 20 trang.
5. Viết `pdf_extract_left_right.py`.
6. Test tách cột với 20 trang.

## 6. Cấu trúc thư mục mục tiêu

```text
D:\PDF_Anki\
├─ input\
│  └─ source.pdf
├─ parts\
│  ├─ test_001_020.pdf
│  ├─ part_001_pages_001_050.pdf
│  ├─ part_002_pages_051_100.pdf
│  └─ ...
├─ output\
│  ├─ left_right\
│  │  ├─ test_001_020_all_left.md
│  │  ├─ test_001_020_all_right.md
│  │  ├─ test_001_020_debug_preview.md
│  │  └─ test_001_020_debug_layout.json
│  ├─ cases\
│  ├─ answers\
│  ├─ clean\
│  └─ csv\
└─ scripts\
   ├─ split_pdf.py
   └─ pdf_extract_left_right.py
```

## 7. Chuẩn bảng Review và CSV Anki

Cau truc bang Review noi bo:

```text
Status | Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags
```

CSV/APKG Anki cuoi cung bo `Status`:

```text
Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags
```

Quy tắc chính:

- `Status`: chi dung de review; loc Approved khi cot ton tai, sau do xoa khoi du lieu Anki.
- `Ques`: chỉ ghi nội dung câu hỏi, bỏ nhãn kiểu `Chương 1 Câu ...`.
- `A-E`: chỉ ghi nội dung lựa chọn, bỏ prefix `A.`, `B.`, v.v.
- Nếu chỉ có A-D thì `E` để trống.
- `Ans`: chỉ ghi A/B/C/D/E.
- `Ex`: ghi giải thích, không ghi dòng `Đáp án: ...`.
- `Source`: ghi nguồn trong PDF nếu có.
- `Note`: để trống nếu không có lỗi; ghi lý do nếu cần review.
- `Image`: để trống trừ khi có link ảnh riêng.
- `Tags`: với file enzyme dùng tag chính `enzyme`, có thể thêm tag phụ.

## 8. Quy tắc HTML công thức

Phải giữ HTML thô:

```html
V<sub>0</sub>
H<sub>2</sub>O
CO<sub>2</sub>
Ca<sup>2+</sup>
NAD<sup>+</sup>
FADH<sub>2</sub>
```

Không được dùng:

```text
V₀
H₂O
Ca²⁺
V&lt;sub&gt;0&lt;/sub&gt;
```

Không dùng LaTeX.

## 9. Tiêu chí hoàn thành MVP

MVP được coi là đạt khi:

- Tách được file test 20 trang.
- `debug_preview.md` cho thấy cột trái/phải được tách đúng phần lớn trang.
- Có cơ chế đánh dấu `REVIEW_REQUIRED` khi tách cột không chắc.
- Tạo được `all_left.md` và `all_right.md`.
- Chuyển được một part nhỏ sang CSV đúng 13 cột.
- Checker phát hiện được lỗi cơ bản: thiếu đáp án, thiếu option, sai HTML, sai số cột.

## 10. Việc tiếp theo cho Codex/Antigravity

Đọc 3 file này theo thứ tự:

1. `SPEC.md`
2. `project_status.md`
3. `task.md`

Sau đó bắt đầu bằng task đầu tiên:

```text
Viết script split_pdf.py theo đúng task.md.
```

---

## 11. Cập nhật trạng thái sau triển khai thực tế

### 11.1. Đã triển khai

Đã có các script chính:

```text
scripts/split_pdf.py
scripts/pdf_extract_left_right.py
scripts/parse_cases_answers.py
scripts/match_cases_answers.py
scripts/validate_clean_matches.py
scripts/check_part_overlap.py
```

Các chức năng đã có:

- Tạo test PDF 20 trang.
- Chia PDF thành part 50 trang.
- Chia PDF thành part có overlap bằng `--overlap-pages`.
- Tách left/right bằng PyMuPDF theo vùng bảng và ranh giới cột.
- Lọc footer/header/chuyên mục không thuộc bảng.
- Parse case và answer block.
- Match case-answer theo thứ tự.
- Validate lệch case-answer bằng count, page gap, keyword overlap.
- Tạo overlap report để phát hiện trùng giữa cuối part trước và đầu part sau.

### 11.2. Kết quả hiện tại

Sau khi lọc footer/chuyên mục và validate lại:

```text
726 records
477 Pending
249 Needs review
```

`Pending` không có nghĩa là đúng tuyệt đối. `Pending` chỉ là chưa thấy lỗi rõ bằng rule hiện tại.

### 11.3. Bộ part overlap

Đã tạo bộ part overlap 2 trang trong:

```text
parts_overlap_2p
```

Dạng file:

```text
part_001_pages_001_050_ov002.pdf
part_002_pages_049_100_ov002.pdf
part_003_pages_099_150_ov002.pdf
```

Đã tạo output overlap thử nghiệm trong:

```text
output_overlap
```

Overlap report:

```text
output_overlap/clean/overlap_report.md
output_overlap/clean/overlap_report.json
```

### 11.4. Quy ước trạng thái mới

Dùng 4 trạng thái:

```text
Pending
Needs review
Approved
Rejected
```

- `Rejected` dùng cho record không xuất CSV, ví dụ trùng overlap, case fragment, không phải MCQ, hoặc không tìm được answer.
- Không xóa `Rejected`; phải giữ audit trong `.md/.json`.

### 11.5. Việc nên làm tiếp

Ưu tiên tiếp theo:

1. Thêm `risk_level` cho mọi record, không chỉ `Needs review`.
2. Tạo batch review cho Antigravity từ `Needs review` và `Pending` rủi ro cao.
3. Viết script đọc JSON trả về từ Antigravity để sửa match tự động khi confidence cao.
4. Thêm bước normalize text để xử lý lỗi dính chữ OCR/text extraction.
5. Sau khi AI review xong mới xuất CSV Pending/Approved.

## 2026-06-05 - AI G batch 001

Đã nhận kết quả review batch 001 từ AI G và lưu tại:

```text
output/ai_review/antigravity_result_001.json
```

Kết quả apply:

```text
15 review items
11 high-confidence updates applied
4 items kept for review
```

Đã sửa `scripts/apply_antigravity_review.py` để việc apply có tính idempotent: chạy lại cùng result không dịch candidate thêm lần nữa. Candidate offset giờ được tính từ `match_number` gốc thay vì `answer_block_id` hiện tại.

Đã sửa `scripts/validate_clean_matches.py` để record đã được AI G xác nhận `high` và đã apply không bị rule keyword-overlap tự động kéo lại về `Needs review`. Validator vẫn ghi score/page-gap để audit.

Sau khi apply lại và validate:

```text
726 records
452 Pending
274 Needs review
```

11 record high-confidence của AI G hiện đều ở trạng thái `Pending` và có dấu `ai_g_validation_override = high_confidence_review`.

Đã tạo toàn bộ batch tiếp theo cho AI G:

```text
output/ai_review/AI_G_BATCH_INDEX.md
output/ai_review/antigravity_batch_002.md
...
output/ai_review/antigravity_batch_015.md
```

Tổng batch 002-015: 274 review items, không trùng `match_id`.

## 2026-06-05 - Apply AI G batch 002-015

Đã nhận đủ kết quả AI G:

```text
output/ai_review/antigravity_result_002.json
...
output/ai_review/antigravity_result_015.json
```

Đã apply toàn bộ batch 002-015:

```text
274 review items
155 high-confidence updates applied
119 items kept for review
```

Audit được lưu tại:

```text
output/ai_review/antigravity_apply_audit_002.json
...
output/ai_review/antigravity_apply_audit_015.json
```

Sau khi validate lại:

```text
726 records
560 Pending
166 Needs review
```

Các part còn nhiều `Needs review` nhất:

```text
part_011_pages_501_550: 52
part_010_pages_451_500: 50
part_008_pages_351_400: 24
part_002_pages_051_100: 14
```

Nhận xét: AI G giúp giảm mạnh lỗi match thường gặp, nhưng `part_010` và `part_011` vẫn có vấn đề hệ thống hoặc candidate lân cận chưa đủ để sửa tự động. Không nên xuất CSV cuối trước khi xử lý hai part này kỹ hơn.

Đã tạo batch wide cho vòng review tiếp theo:

```text
output/ai_review/AI_G_BATCH_INDEX_WIDE_010_011.md
output/ai_review/antigravity_batch_016_wide_010_011.md
...
output/ai_review/antigravity_batch_026_wide_010_011.md
```

Batch wide gồm 102 item thuộc `part_010` và `part_011`, candidate window `-5..+5`, không trùng `match_id`.

## 2026-06-05 - Apply AI G wide batch 016-026

Đã nhận đủ kết quả:

```text
output/ai_review/antigravity_result_016.json
...
output/ai_review/antigravity_result_026.json
```

Kết quả apply:

```text
102 review items
2 high-confidence updates applied
100 items kept for review
```

Chi tiết quan trọng:

```text
60 items: high confidence + best_candidate none
40 items: low confidence + best_candidate none
1 item: high confidence + candidate -4
1 item: high confidence + candidate -2
```

Hai record được sửa:

```text
part_011_pages_501_550_match_045 -> answer_041
part_010_pages_451_500_match_028 -> answer_026
```

Sau khi validate lại:

```text
726 records
560 Pending
166 Needs review
```

Nhận xét: batch wide không giảm tổng `Needs review` vì phần lớn kết quả là `none`. Điều này cho thấy lỗi chính ở `part_010` và `part_011` có thể nằm ngoài phạm vi chọn candidate gần, ví dụ answer bị extract thiếu, parser tách sai block, hoặc lệch hệ thống lớn hơn cửa sổ `-5..+5`. Không nên tiếp tục dùng AI G batch rộng hơn vì sẽ tốn token mà ít lợi ích.

## 2026-06-05 - Re-extract part 010-011 with PyMuPDF word split

Sau khi kiểm tra thủ công, phát hiện lỗi chính ở `part_010` và `part_011` không phải do AI match mà do extract/parse:

- Một số case không có dòng `Câu hỏi:` và đi thẳng vào câu `1.` nên parser cũ gộp nhiều case thành một.
- PyMuPDF block-mode đôi khi gộp text qua hai cột, làm `Đáp án` lọt vào phần case.

Đã sửa:

```text
scripts/parse_cases_answers.py
scripts/pdf_extract_left_right.py
```

Thay đổi chính:

- Parser chấp nhận case mới nếu sau phần mở đầu có block MCQ `1.` + option A-D, kể cả không có dòng `Câu hỏi:`.
- `Missing question header` không còn bị coi là lỗi nếu case có đủ câu hỏi MCQ.
- Thêm chế độ PyMuPDF `--word-split` để tách cột theo từng word thay vì text block.

Đã backup output cũ tại:

```text
output_backup/before_word_split_010_011_20260605
```

Đã re-extract/re-parse/re-match chính thức cho:

```text
part_010_pages_451_500
part_011_pages_501_550
```

Kết quả sau validate:

```text
731 records
660 Pending
71 Needs review
```

Riêng hai part khó:

```text
part_010_pages_451_500: 62 Pending, 1 Needs review
part_011_pages_501_550: 75 Pending, 6 Needs review
```

## 2026-06-05 - Manual/user review fixes for part 008

Người dùng kiểm tra `part_008` và báo 3 lỗi đại diện:

```text
part_008_pages_351_400_match_016: case không có đáp án
part_008_pages_351_400_match_020: lệch đáp án trên/dưới
part_008_pages_351_400_match_027: answer block bị dính giải thích/case kế tiếp
```

Đã xử lý:

- `match_016`: chuyển `Rejected`, xóa answer block, không xuất CSV.
- `match_020`: sửa sang `answer_019`.
- `match_027`: sửa `question_count` từ 6 về 5 do dòng `BMI 22. Khám...` bị đếm nhầm; thay answer text bằng block sạch từ PyMuPDF `--word-split`.
- Sửa `scripts/parse_cases_answers.py`: regex đếm câu hỏi chỉ nhận số 1-9.
- Sửa `scripts/validate_clean_matches.py`: không tự hạ `Rejected`/`Approved` về `Needs review`.

Sau validate:

```text
731 records
661 Pending
69 Needs review
```

`part_008` còn:

```text
61 Pending
21 Needs review
1 Rejected
```

## 2026-06-05 - Part 008 additional offset audit

Người dùng tiếp tục báo 3 lỗi trong `part_008`:

```text
part_008_pages_351_400_match_031: lệch đáp án
part_008_pages_351_400_match_063: không có đáp án
part_008_pages_351_400_match_065: lệch đáp án
```

Đã thêm script hỗ trợ quét nghi lệch answer:

```text
scripts/report_answer_offset_candidates.py
```

Script này đọc `clean.json` và `answers_right.json`, tính candidate answer lân cận theo cửa sổ offset, rồi xuất:

```text
output/ai_review/part_008_pages_351_400_answer_offset_candidates.json
output/ai_review/part_008_pages_351_400_answer_offset_candidates.md
```

Đã apply các fix người dùng xác nhận:

```text
part_008_pages_351_400_match_031 -> answer_029
part_008_pages_351_400_match_063 -> Rejected
part_008_pages_351_400_match_065 -> answer_062
```

File review/audit:

```text
output/ai_review/manual_part_008_user_reported_fixes.json
output/ai_review/manual_part_008_user_reported_fixes_audit.json
```

Đã mở rộng `scripts/apply_antigravity_review.py` để hỗ trợ `action: "reject"` cho các match không có đáp án.

Sau validate:

```text
part_008_pages_351_400: 63 Pending, 18 Needs review, 2 Rejected
whole clean set: 731 records
```

Report hiện tại cho 18 mục `Needs review` còn lại của `part_008`:

```text
17 offset_candidate
1 current_is_best_but_needs_manual_review
```

## 2026-06-05 - Part 008 offset cluster fixed

Sau khi người dùng xác nhận 18 mục còn lại của `part_008` đều lệch đáp án, đã kiểm tra lại và phát hiện thêm một số record `Pending` cũng lệch answer. Kết luận: lỗi của `part_008` không chỉ nằm ở `Needs review`; có một cụm offset ẩn trong `Pending`.

Đã tạo file fix thủ công:

```text
output/ai_review/manual_part_008_offset_cluster_fixes.json
```

Đã apply và ghi audit:

```text
output/ai_review/manual_part_008_offset_cluster_fixes_audit.json
```

Số lượng apply:

```text
29 high-confidence updates applied
```

Các cụm chính đã sửa:

```text
match_029 -> answer_027
match_048 -> answer_046
match_049 -> answer_047
match_050 -> answer_048
match_051 -> answer_049
match_052 -> answer_050
match_053 -> answer_051
match_054 -> answer_052
match_056 -> answer_054
match_059 -> answer_057
match_064 -> answer_061
match_066 -> answer_063
match_067 -> answer_064
match_068 -> answer_065
...
match_083 -> answer_080
```

`match_063` giữ `Rejected` vì không thấy answer tương ứng với case BPH tuyến tiền liệt lớn/Open Prostatectomy/HoLEP.

Sau validate:

```text
part_008_pages_351_400: 81 Pending, 0 Needs review, 2 Rejected
whole clean set: 731 records, 681 Pending, 48 Needs review, 2 Rejected
```

Ghi chú quan trọng: validator hiện tại có thể bỏ sót lỗi lệch answer trong `Pending`. Trước khi xuất CSV, cần thêm bước risk/review cho `Pending` rủi ro cao, không chỉ review `Needs review`.

## 2026-06-05 - Re-extract and reparse part 002 with word split

Người dùng kiểm tra `part_002_pages_051_100` và báo lỗi hệ thống: cột answer bên phải quá hẹp nên nội dung đáp án/giải thích lọt vào case Markdown, làm parser đếm thừa câu hỏi ở các match:

```text
match_001, match_018, match_019, match_021, match_023, match_026, match_029,
match_036, match_037, match_038, match_039, match_040, match_042, match_044
```

Đã re-extract part 002 bằng PyMuPDF `--word-split`:

```text
output_debug/word_split_002
```

Đã sửa `scripts/parse_cases_answers.py`:

- Không còn đếm mọi dòng dạng `1.`, `2.`, `3.` là câu hỏi.
- Chỉ tính một câu hỏi hợp lệ khi đoạn đó có đủ option A-D.
- Điều này tránh đếm nhầm các dòng giải thích bị lọt vào case như `3. Với ung thư...`.

Đã backup output cũ:

```text
output_backup/before_word_split_002_20260605
```

Đã ghi bản word-split v2 vào output chính cho part 002:

```text
output/left_right/part_002_pages_051_100*
output/cases/part_002_pages_051_100*
output/answers/part_002_pages_051_100*
output/clean/part_002_pages_051_100*
```

Đã thêm override xác nhận ngữ nghĩa cho 2 record chỉ còn bị page-gap:

```text
output/ai_review/manual_part_002_word_split_v2_overrides.json
output/ai_review/manual_part_002_word_split_v2_overrides_audit.json
output/ai_review/manual_part_002_word_split_v2_overrides_audit_rerun.json
```

Đã sửa `scripts/validate_clean_matches.py` để high-confidence override không bị page-gap kéo lại về `Needs review`.

Sau validate:

```text
part_002_pages_051_100: 43 Pending, 1 Needs review
remaining Needs review in part 002: match_044
whole clean set: 731 records, 683 Pending, 35 Needs review, 2 Rejected
```

`match_044` còn review vì case ở cuối part bị cắt ngang, chỉ parse được 1 câu hỏi trong khi answer có 5 đáp án. Cần xử lý bằng overlap/part kế tiếp hoặc kiểm tra PDF vùng ranh giới part 002-003.

## 2026-06-05 - Part 002 boundary repair completed

Đã xử lý `part_002_pages_051_100_match_044` bằng output overlap:

```text
parts_overlap_2p/part_003_pages_099_150_ov002.pdf
output_overlap/left_right/part_003_pages_099_150_ov002_all_left.md
output_overlap/left_right/part_003_pages_099_150_ov002_all_right.md
```

Nguyên nhân:

```text
Case/answer vỡ lách thì 2 trải qua original PDF pages 100-102.
Part 002 thường chỉ đến page 100 nên case bị cắt còn 1/5 câu hỏi.
```

Đã vá thủ công nội dung đầy đủ vào:

```text
output/cases/part_002_pages_051_100_cases_left.json/md
output/answers/part_002_pages_051_100_answers_right.json/md
output/clean/part_002_pages_051_100_clean.json/md
```

Sau validate:

```text
part_002_pages_051_100: 44 Pending, 0 Needs review
whole clean set: 731 records, 695 Pending, 34 Needs review, 2 Rejected
```

Các part còn `Needs review`:

```text
part_001_pages_001_050: 1
part_003_pages_101_150: 5
part_004_pages_151_200: 2
part_005_pages_201_250: 3
part_006_pages_251_300: 4
part_007_pages_301_350: 5
part_009_pages_401_450: 4
part_010_pages_451_500: 1
part_011_pages_501_550: 7
part_012_pages_551_600: 2
```

## 2026-06-05 - User review notes for remaining Needs review

Người dùng đã kiểm tra sơ bộ các part còn lỗi và phân loại như sau:

```text
part_001: 1 lỗi. Case có câu 5 không có đáp án/answer structure khó đọc, cần chỉnh cấu trúc.

part_003: còn 5 lỗi, chưa phân loại chi tiết.

part_004: còn 2 lỗi.
- match_035: đề của vài câu đang tính liền vào nhau, có thể là một record chứa hai bộ câu hỏi.
- match_068: thiếu câu 4-5 do phần dưới trang chưa quét/ranh giới part.

part_005: còn 3 lỗi, chưa phân loại chi tiết.
part_006: còn 4 lỗi, chưa phân loại chi tiết.
part_007: còn 5 lỗi, chưa phân loại chi tiết.
part_009: còn 4 lỗi, chưa phân loại chi tiết.

part_010: còn 1 lỗi.
- match_063: cuối file chỉ có answer từ ý 5, không có đề; nghi là phần answer chưa quét hết của vùng gần đó hoặc orphan answer cuối part.

part_011: còn 7 lỗi, chưa phân loại chi tiết.

part_012: còn 2 lỗi.
- match_005: note cũ nói không có đáp án nhưng thực tế đọc logic thì answer khớp.
- match_006: lỗi do sau đáp án D của câu 5 là nội dung lý thuyết, không thuộc bảng, bị parser đưa vào case.
```

Đã cập nhật `docs/error_playbook.md` thêm các nhóm lỗi:

```text
Nội dung lý thuyết/NOTE sau case lọt vào CASE
Case chứa hai bộ câu hỏi liền nhau
Orphan answer cuối part
```

Ưu tiên xử lý tiếp:

```text
1. part_012 match_005/match_006 vì lỗi đã rõ và ít.
2. part_004 match_035/match_068 vì đã phân loại được nguyên nhân.
3. part_010 match_063 bằng overlap/cuối part.
4. Sau đó mới xử lý các part còn chưa phân loại chi tiết.
```

## 2026-06-05 - Part 001 match 060 checked and fixed

Đã kiểm tra `part_001_pages_001_050_match_060`.

Kết luận:

```text
Không thiếu đáp án câu 5.
Answer gốc có đủ "Đáp án: 1. A; 2. B; 3. B; 4. A; 5. C".
Vấn đề là phần giải thích gộp "1. & 5." nên khó đọc, và validator giữ Needs review do page-gap.
```

Đã chuẩn hóa lại `answer_text` thành giải thích riêng từng ý 1-5 trong:

```text
output/answers/part_001_pages_001_050_answers_right.json/md
output/clean/part_001_pages_001_050_clean.json/md
```

Sau validate:

```text
part_001_pages_001_050: 64 Pending, 0 Needs review
whole clean set: 696 Pending, 33 Needs review, 2 Rejected
```

## 2026-06-05 - Part 003 re-extracted with word-split and cleared

Người dùng phân loại 5 mục còn lỗi của `part_003`:

```text
match_002: câu hỏi/đáp án sắp xếp lộn xộn.
match_032: thiếu phần câu/đáp án 4-5.
match_042: case bị mix giữa nhiều bài.
match_046: đã check bảng, nội dung đúng.
match_052: có text rác "Tình huống & Câu hỏi / Đáp án & Giải thích" trong case do lỗi Markdown.
```

Đã chạy lại `part_003_pages_101_150.pdf` bằng PyMuPDF `--word-split`.

Backup bản cũ:

```text
output_backup/before_20260605_word_split_003
```

Output chính đã được thay bằng bản word-split:

```text
output/cases/part_003_pages_101_150_cases_left.json/md
output/answers/part_003_pages_101_150_answers_right.json/md
output/clean/part_003_pages_101_150_clean.json/md
```

Manual audit/acceptance:

```text
output/ai_review/manual_part_003_word_split_acceptance.json
```

Ghi chú kỹ thuật:

- `match_032` và `match_042` sạch sau word-split.
- `match_046` và `match_049` có `answer_text` giải thích đủ 5 câu, nhưng dòng `Đáp án:` malformed nên parser đếm thiếu; đã mark manual high-confidence accept.
- `match_002`, `match_047`, `match_052` là false-positive do page-gap/keyword-overlap sau khi người dùng và Codex xác nhận ngữ nghĩa khớp.
- Đã sửa `scripts/validate_clean_matches.py` để note `Manual high-confidence accept...` không bị validator tự động kéo lại về `Needs review`.

Sau validate:

```text
part_003_pages_101_150: 56 Pending, 0 Needs review
whole clean set: 701 Pending, 28 Needs review, 2 Rejected
```

Các part còn `Needs review`:

```text
part_004_pages_151_200: 2
part_005_pages_201_250: 3
part_006_pages_251_300: 4
part_007_pages_301_350: 5
part_009_pages_401_450: 4
part_010_pages_451_500: 1
part_011_pages_501_550: 7
part_012_pages_551_600: 2
```

## 2026-06-05 - User classified remaining errors; obvious records fixed

Người dùng phân loại thêm các lỗi còn lại:

```text
part_004 match_035: hai case chồng nhau; phần thừa bắt đầu từ "Một sinh viên...".
part_004 match_068: đề thiếu câu 4-5, đáp án không lỗi.

part_005 match_007, match_027, match_057: thừa lý thuyết vào case, đáp án không lỗi.

part_010 match_063: thiếu câu hỏi ở source.pdf trang 500-501 do batch cut.

part_011 match_005: không lỗi, đã Pending.
part_011 match_074: case chồng chéo câu hỏi.
part_011 match_075, match_076, match_077: lệch đáp án.
part_011 match_078: thiếu case, case nằm ở source.pdf trang 550.

part_012 match_005: không lỗi.
part_012 match_006: thừa đoạn lý thuyết "Dụng cụ..." sau câu 5.
```

Đã sửa trực tiếp:

```text
part_004_pages_151_200_match_035
part_005_pages_201_250_match_007
part_005_pages_201_250_match_027
part_005_pages_201_250_match_057
part_012_pages_551_600_match_005
part_012_pages_551_600_match_006
```

Audit:

```text
output/ai_review/manual_user_review_clear_obvious_20260605.json
```

Sau validate:

```text
part_004_pages_151_200: 67 Pending, 1 Needs review
part_005_pages_201_250: 67 Pending, 0 Needs review
part_012_pages_551_600: 6 Pending, 0 Needs review
whole clean set: 707 Pending, 22 Needs review, 2 Rejected
```

Các part còn `Needs review`:

```text
part_004_pages_151_200: 1
part_006_pages_251_300: 4
part_007_pages_301_350: 5
part_009_pages_401_450: 4
part_010_pages_451_500: 1
part_011_pages_501_550: 7
```

Ưu tiên tiếp theo:

```text
1. Sửa boundary/overlap: part_004 match_068, part_010 match_063, part_011 match_078.
2. Sửa cụm offset: part_011 match_075-077.
3. Xử lý case chồng: part_011 match_074.
4. Phân loại tiếp part_006, part_007, part_009.
```

## 2026-06-05 - Clean review completed for current dataset

Đã xử lý hết `Needs review` còn lại trong `output/clean`:

```text
part_007_pages_301_350_match_069: recovered full case from overlap part_008.
part_009_pages_401_450_match_056: recovered boundary renal AVF case and full answer from overlap part_010.
part_007_pages_301_350_match_035: Rejected because source PDF/text layer is incomplete; only Q1 A-B exists before answer 1-5.
```

Audit:

```text
output/clean/manual_final_review_repairs_20260605.json
```

Sau validate và rebuild summary:

```text
whole clean set: 727 Pending, 0 Needs review, 4 Rejected
```

Ý nghĩa:

- `Pending`: đủ điều kiện đưa vào bước QA/CSV tiếp theo.
- `Rejected`: không xuất CSV tự động; giữ lại để audit hoặc sửa tay từ PDF nếu muốn.
- `Needs review`: hiện bằng 0 cho toàn bộ clean set.

Ưu tiên tiếp theo:

```text
1. Nếu muốn chắc thêm, random QA một mẫu Pending trước khi xuất CSV.
2. Sau khi chốt QA, triển khai script xuất CSV từ Pending.
3. Bỏ qua Rejected trong CSV export.
```

## 2026-06-05 - Pending CSV exported

Đã thêm script:

```text
scripts/export_pending_csv.py
```

Script xuất từng câu hỏi nhỏ thành một dòng CSV Anki, gồm đủ cột:

```text
Status | Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags
```

Kết quả export:

```text
output/csv/pending_anki.csv              3635 rows
output/csv/pending_anki_import_ready.csv 3627 rows
output/csv/pending_anki_warnings.csv     8 rows
output/csv/pending_anki_report.json
```

Phân bố theo tag:

```text
tieu_hoa: 1145
chan_thuong_chinh_hinh: 1390
than_tiet_nieu: 70
tim_mach_long_nguc: 550
than_kinh: 390
nhi: 90
```

Ghi chú:

- `pending_anki.csv`: bản đầy đủ, có 8 dòng `Note`.
- `pending_anki_import_ready.csv`: bản loại 8 dòng cảnh báo, phù hợp để import thử.
- `pending_anki_warnings.csv`: 8 dòng cần sửa tay nếu muốn đủ 3635 dòng sạch.

## 2026-06-05 - Case-wide CSV exported using sample format

Người dùng bổ sung file mẫu:

```text
input/anki_case_export_20260601_180603.csv
input/Review (Toàn).xlsx
```

Đã chuyển sang format case-wide, 1 case = 1 dòng, 5 câu nằm ngang theo cột `Ques1...Ex5`.

Script:

```text
scripts/export_pending_case_wide_csv.py
```

Output:

```text
output/csv/pending_anki_case_wide.csv              727 rows, 41 columns, matches sample CSV header
output/csv/pending_anki_case_wide_review.csv       727 rows, adds Status column
output/csv/pending_anki_case_wide_import_ready.csv 723 rows
output/csv/pending_anki_case_wide_warnings.csv     4 rows
output/csv/pending_anki_case_wide_report.json
```

Phân bố case theo tag:

```text
tieu_hoa: 229
chan_thuong_chinh_hinh: 278
than_tiet_nieu: 14
tim_mach_long_nguc: 110
than_kinh: 78
nhi: 18
```

## 2026-06-05 - Case-wide warnings cleared

Đã kiểm tra lại và sửa 4 case warning:

```text
part_001_pages_001_050_match_064: phục hồi Q5 option C/D và Ex5 từ overlap.
part_003_pages_101_150_match_046: chuẩn hóa answer Q3-Q5 từ giải thích.
part_003_pages_101_150_match_049: chuẩn hóa answer Q3-Q5 từ giải thích.
part_006_pages_251_300_match_074: phục hồi Q5 option A-D từ overlap.
```

Sau khi export lại:

```text
output/csv/pending_anki_case_wide.csv              727 rows
output/csv/pending_anki_case_wide_import_ready.csv 727 rows
output/csv/pending_anki_case_wide_warnings.csv     0 rows
```

## 2026-06-05 - Multi-PDF pipeline packaged

Đã thêm workflow đóng gói cho các PDF mới:

```text
scripts/run_pipeline.py
scripts/make_ai_g_review_batches.py
docs/PIPELINE.md
requirements.txt
```

Mục tiêu: mỗi PDF mới chạy trong một thư mục riêng dưới `runs/<name>/`, không trộn file trung gian vào `output/` và `parts/` gốc.

Lệnh chính:

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book
```

Output chính của mỗi run:

```text
runs/<name>/output/csv/pending_anki_case_wide_import_ready.csv
runs/<name>/output/csv/pending_anki_case_wide_warnings.csv
runs/<name>/output/clean/validation_summary.md
runs/<name>/logs/pipeline.log
```

Đã smoke test bằng:

```powershell
python scripts\run_pipeline.py input\source.pdf --name pipeline_smoke --test-pages 2 --test-only --stop-after extract
```

Kết quả smoke test:

```text
runs/pipeline_smoke/parts/test_001_002.pdf
runs/pipeline_smoke/output/left_right/test_001_002_all_left.md
runs/pipeline_smoke/output/left_right/test_001_002_all_right.md
runs/pipeline_smoke/output/left_right/test_001_002_debug_preview.md
runs/pipeline_smoke/output/left_right/test_001_002_debug_layout.json
```

Đã thêm workflow AI G cho từng run:

```powershell
python scripts\make_ai_g_review_batches.py --run-dir runs\my_new_book --batch-size 20
```

Script này lọc toàn bộ record `Needs review`, tạo batch trong:

```text
runs/my_new_book/output/ai_review/
```

Sau khi AI G trả `antigravity_result_XXX.json`, dùng `scripts/apply_antigravity_review.py` để apply rồi chạy lại:

```powershell
python scripts\run_pipeline.py input\my_new_book.pdf --name my_new_book --start-at validate
```

## 2026-06-30 - Archived completed source.pdf artifacts

Da gom artifact cua lan xu ly `input/source.pdf` vao:

```text
runs/source_pdf_completed/
```

File CSV source cu can dung:

```text
runs/source_pdf_completed/output/csv/pending_anki_case_wide_import_ready.csv
```

Thu muc goc hien chi nen giu:

```text
docs/
input/
runs/
scripts/
requirements.txt
```

Ly do: tranh tron artifact cua source cu voi cac PDF moi, dac biet `input/veyhoc.com-Nhi-Y4Y6-Ver3.pdf`.

## 2026-06-30 - Nhi Y4Y6 initial pipeline run

Da chay pipeline rieng cho:

```text
input/veyhoc.com-Nhi-Y4Y6-Ver3.pdf
```

Run folder:

```text
runs/nhi_y4y6/
```

Chi xu ly page range:

```text
1-358
```

Ly do: pages 359-626 la ly thuyet/notes, khong dua vao CSV case.

Ket qua hien tai:

```text
records: 503
pending: 371
needs_review: 132
csv_warning_rows: 0
tag_override: nhi
```

CSV draft hien tai:

```text
runs/nhi_y4y6/output/csv/pending_anki_case_wide_import_ready.csv
```

Da tao AI G batches:

```text
runs/nhi_y4y6/output/ai_review/AI_G_BATCH_INDEX.md
runs/nhi_y4y6/output/ai_review/antigravity_batch_001.md
...
runs/nhi_y4y6/output/ai_review/antigravity_batch_007.md
```

Viec tiep theo: dua 7 batch cho AI G review, luu result JSON, apply bang `scripts/apply_antigravity_review.py`, roi validate/export lai voi `--tag-override nhi`.

## 2026-06-30 - APKG export checkpoint

Da them template auto-render link anh va script xuat `.apkg`.

File moi/chinh:

```text
Anki_template/Auto-image-link-renderer.md
scripts/build_apkg.py
```

Template da nhung logic render link anh trong:

```text
Anki_template/Front-template-MCQ-Case.md
Anki_template/back-template-MCQ-Case.md
Anki_template/Front-template-MCQ-NonCase.md
Anki_template/back-template-MCQ-NonCase.md
```

Ho tro link dang:

```text
https://drive.google.com/uc?id=FILE_ID
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/open?id=FILE_ID
URL anh truc tiep .png/.jpg/.webp/.gif/.svg
```

Da cai dependency:

```text
genanki>=0.13
```

Da test build:

```text
runs/nhi_y4y6/output/apkg/nhi_case.apkg
notes: 489
deck: Nhi::Case
```

## 2026-06-30 - Historical Math/Chem experiment (superseded)

This experiment was rejected after Anki testing. Do not restore its renderer or
syntax. Current guidance is V10 HTMLChem with `<sub>`, `<sup>` and safe arrows.

## 2026-06-30 - Historical Template V2 smoke test (superseded)

Sau khi test Anki phat hien template cu bi mojibake va note type co the khong duoc update khi import lai cung model ID, da tao template/model V2.

File test nho nen import truoc:

```text
output/apkg/template_smoke_test.apkg
```

No gom 6 note:

- 3 MCQ thuong
- 3 MCQ case
- Co HTML `<sub>/<sup>`
- Historical formula-renderer checks from V2 are obsolete; use V10 HTMLChem tests.
- Co link Google Drive dang `https://drive.google.com/uc?id=...`

Model V2:

```text
PDF Anki MCQ Case V2
PDF Anki MCQ NonCase V2
```

Ban Nhi moi sau khi template smoke test on:

```text
runs/nhi_y4y6/output/apkg/nhi_case_v2.apkg
```

Khong nen tiep tuc test bang `runs/nhi_y4y6/output/apkg/nhi_case.apkg` vi no dung model/template cu.
## APKG template V9 display controls - 2026-07-01

- Giu nguyen loi V8 HTMLChem da test on dinh cho MCQ va MCQ Case.
- Them thanh hien thi gom `A-`, `A` (reset 18px), `A+` va nut sang/toi.
- Co chu gioi han 14-26px; theme va co chu duoc luu trong `localStorage` qua cac the.
- Chua them dao cau/dao dap an; tinh nang nay de checkpoint sau.
- Model moi: `PDF Anki MCQ Case V9 DisplayControls` va `PDF Anki MCQ NonCase V9 DisplayControls`.
- Smoke deck: `0 PDF_Anki_V9_Display_Test`.
- File test: `output/apkg/ONLY_6_CARDS_V9_DISPLAY_test.apkg`.
- Da xac minh goi co dung 6 notes, 6 cards va 2 model V9.
## APKG template V9.1 display fix - 2026-07-01

- Sua loi `.card` ghi de bien `--anki-font-size` va bang mau cua `:root`.
- Theme toi ap dung tren toan bo `html`, `body` va `.card`, khong chi mot container.
- Cac dong lua chon A/B/C/D dung cung co chu voi noi dung chinh.
- Tao model ID moi de Anki khong tai lai cache V9 cu.
- Deck test: `0 PDF_Anki_V9.1_Display_Test`.
- File: `output/apkg/ONLY_6_CARDS_V9.1_DISPLAY_test.apkg` (6 notes, 6 cards).
## APKG template V10 original structure HTMLChem - 2026-07-01

- Extracted the original note types `02. MCQ` and `01. MCQ Case :))` from the Anki profile in read-only mode.
- Restored their original Front/Back/Styling and structural selectors for future exam-builder compatibility.
- Kept the current CSV field schemas; MCQ includes the additional `Tags` field.
- Formula content continues to use stable HTML `<sub>`, `<sup>` and entities; MathJax/mhchem is not injected.
- Answer shuffling is present in the original structure but remains off by default and deferred for later testing.
- Preserved original templates in `Anki_template/original_reference/`.
- Added structural contract: `docs/ANKI_TEMPLATE_CONTRACT.md`.
- Smoke deck: `0 PDF_Anki_V10_Original_Test`.
- File: `output/apkg/ONLY_6_CARDS_V10_ORIGINAL_test.apkg` (6 notes, 6 cards).
- Removed all older generated APKG checkpoints from `output/apkg`.
## Batch CSV to APKG - 2026-07-01

- Added `scripts/build_apkg_batch.py`.
- It merges multiple MCQ and MCQ Case CSV files into one APKG with two subdecks.
- Supports standard CSV files with headers and headerless 12-column MCQ exports.
- If Status exists, filters Approved and removes Status; otherwise processes all rows.
- Status never enters Anki. Duplicate GUIDs are skipped/reported.
- Verified with 2 CSV files: 100 MCQ + 5 Case = 105 notes/cards.
- Drop folder and quick command: `input/anki_csv/README.md`.
## Status boundary - 2026-07-01

- Status is review metadata regardless of whether input is CSV or Spreadsheet.
- If Status exists, keep Approved rows and remove the column; if absent, use all
  non-empty rows only after a warning that the sheet may not have been reviewed.
- Status never enters Anki or exam data.
- Apps Script final exports normally omit Status and the header row.
## Local web app checkpoint framework - 2026-07-01

- Architecture selected: local web UI with Python backend on Windows.
- Added mandatory acceptance gates in `docs/LOCAL_WEB_APP_CHECKPOINTS.md`.
- No UI/backend implementation starts before CP0 contract approval.
- Former contract blockers are resolved: HTMLChem, one-answer-only, exact
  sheet-to-deck mapping, schema detection, and CardUID embedded in Source.
- Remaining CP0 proof: executable schema fixtures and CardUID re-import behavior.
- Existing V10 and original template references remain the rollback baseline.
## Authoritative data/deck rules recorded - 2026-07-01

- Added `docs/DATA_SOURCE_AND_DECK_RULES.md` as the source of truth.
- Status is review-only metadata: filter Approved when present, then remove it.
- Status never enters Anki or the future exam data.
- MCQ/Case is detected from schema; sheet name is used only as exact deck path.
- Sheet names do not require MCQ/Case suffixes.
- Single-answer only; HTMLChem only; CardUID is embedded in Source with a Sheet link.
- Conflicting current-guidance sections in SPEC/PIPELINE/checkpoints were updated;
  old MathJax entries are explicitly marked historical only.
- Architecture decision updated: Version 1 is Spreadsheet-first.
- Primary input is a private Google Spreadsheet through local installed-app OAuth
  with read-only Sheets scope; published links and XLSX/CSV are fallbacks.
- Selected tabs are snapshotted before validation/build to prevent mixed live data.

## CP1 golden fixture corpus passed - 2026-07-01

- Created `tests/fixtures/spreadsheet_cp1/cp1_golden_valid.xlsx`.
- Created `tests/fixtures/spreadsheet_cp1/cp1_intentional_errors.xlsx`.
- Valid expected output: 9 notes across three exact deck paths; Case coverage 1-5 questions.
- Invalid corpus contains six expected blocker/warning records.
- Added four CSV variants: headerless MCQ, headerless Case, raw Review with
  Status, and duplicate CardUID across files.
- Added `expected_manifest.json` and rendered/visually checked every sheet.
- Workbook inspection found no Excel formula errors.
- Next checkpoint: CP2 unified import/normalization/validation core.

## CP1 CSV fixtures refreshed from Nhi source - 2026-07-01

- Replaced the small CSV fallback fixtures with realistic samples copied from
  the processed Nhi run.
- `cp1_headerless_mcq.csv`: 5 headerless MCQ rows from
  `runs/nhi_y4y6/output/csv/pending_anki_import_ready.csv`.
- `cp1_headerless_case.csv`: 5 headerless Case-wide rows from
  `runs/nhi_y4y6/output/csv/pending_anki_case_wide_import_ready.csv`.
- `cp1_raw_review_mcq.csv`: the same Nhi MCQ sample with `Status`
  added back; 4 `Approved` rows and 1 `Pending` row.
- `cp1_duplicate_across_file_mcq.csv`: intentionally reuses
  `anki_10000001` to test duplicate CardUID detection.
- Added `tests/fixtures/spreadsheet_cp1/README.md` explaining the fixture source.

## CP2 import/normalize/validate core passed - 2026-07-01

- Added executable schema contract: `docs/schema_contract.v1.json`.
- Added reusable validation core: `scripts/import_validate_core.py`.
- Added regression tests: `tests/test_import_validate_core.py`.
- Core supports XLSX workbook sheets, multiple CSV inputs, header/headerless CSV,
  `Status` filtering/removal, schema detection after technical-column removal,
  exact deck path validation, CardUID extraction from `Source`, single-answer
  validation, image warnings, duplicate CardUID blocking and CardUID/deck
  conflict blocking.
- Generated evidence reports:
  - `tests/fixtures/spreadsheet_cp1/cp2_valid_report.json`
  - `tests/fixtures/spreadsheet_cp1/cp2_invalid_report.json`
  - `tests/fixtures/spreadsheet_cp1/cp2_csv_report.json`
  - `tests/fixtures/spreadsheet_cp1/cp2_duplicate_report.json`
- Verification passed: `python -m unittest tests.test_import_validate_core`
  ran 6 tests successfully.
- Next checkpoint: CP3 private Google Sheets OAuth, tab listing and immutable
  snapshot mapping into the CP2 core.

## CP3 Google Sheets snapshot core started - 2026-07-01

- Added `scripts/google_sheets_snapshot.py`.
- Added `tests/test_google_sheets_snapshot.py`.
- Added `docs/GOOGLE_SHEETS_OAUTH_SETUP.md`.
- Added `.gitignore` entries for `secrets/`, token files and local snapshot reports.
- The module can parse Spreadsheet URLs/IDs, list tabs, fetch selected tabs via
  read-only Sheets API, freeze them into a `SheetSnapshot`, and convert that
  snapshot into CP2 validation sources.
- Google OAuth imports are lazy so offline tests do not require credentials.
- Offline verification passed: `python -m unittest tests.test_import_validate_core tests.test_google_sheets_snapshot`
  ran 10 tests successfully.
- Google API dependencies from `requirements.txt` were installed successfully in
  the active Codex Python runtime and import-checked.
- Remaining CP3 evidence requires the user to create/download an OAuth Desktop
  client JSON and run one real private Spreadsheet snapshot.

## CP6 UI prototype started - 2026-07-01

- Added `webapp/app.py` local server bound to `127.0.0.1:8765`.
- Added static prototype UI in `webapp/static/`.
- The prototype reads CP2 fixture reports and renders:
  - report/source selector
  - validation summary counters
  - step/status strip
  - Airtable-style source table
  - detail panel for selected sheet/source
  - issue list
  - Anki-like deck tree preview
- Build APKG is disabled when blockers exist.
- Verified server health, report API, CSV report API and JavaScript syntax.
- Prototype UI labels were switched to Vietnamese with accents. Keep technical
  terms unchanged: APKG, MCQ, Case, CardUID, BLOCKER and WARNING.
- Visual browser verification is still pending user review.

## CP5 local CSV/XLSX validation connected to UI - 2026-07-01

- Added `POST /api/validate/local` to `webapp/app.py`.
- XLSX mode reads workbook sheets and maps ` > ` in each sheet title to Anki
  `::` in the deck path.
- CSV mode reads one or more CSV files and uses the deck path typed in the UI.
- The endpoint reuses the CP2 validation core and returns the same report shape
  used by fixture reports.
- Added a UI panel for checking real local CSV/XLSX files from the project
  folder.
- `Build APKG` is now connected after validation; it uses the cached validated
  report and selected sources.
- Verification passed:
  - Python compile for `webapp/app.py` and `scripts/import_validate_core.py`.
  - JavaScript syntax check for `webapp/static/app.js`.
  - `python -m unittest tests.test_import_validate_core tests.test_google_sheets_snapshot`
    with 10 tests.
  - Direct CP5 validation calls using the CP1 CSV/XLSX fixtures.
- Next action: user tests the Build APKG button from the web UI and imports the
  downloaded package into a clean/test Anki profile.

## CP3/CP5 Google Sheet validation path added - 2026-07-01

- Added a Google Sheet source option to the local UI.
- Added `POST /api/validate/google` to `webapp/app.py`.
- The endpoint accepts a Spreadsheet URL/ID, optional tab names and an OAuth
  Desktop client JSON path.
- Default OAuth client path: `secrets/google_oauth_client.json`.
- Google Sheet snapshots map selected tab names to deck paths with the same
  ` > ` to `::` rule.
- Missing OAuth JSON now returns a clear 400 error instead of failing silently.
- Real private Sheet validation is pending the user-provided OAuth Desktop
  client JSON.
- UI layout was adjusted so source type, source input, OAuth/deck fields and the
  check action live in the top source panel instead of feeling detached.

## CP5 file picker and drag-drop upload - 2026-07-01

- CSV/XLSX no longer require typing project-relative paths in the main UI.
- Added multi-file picker, drag-drop zone, selected-file list and per-file
  removal before validation.
- Added `POST /api/validate/upload`; uploaded files are stored only while the
  request is validated and the request folder is removed afterward.
- Google Sheet keeps its URL/ID workflow unchanged.
- CSV uploads share the explicit deck path entered in the UI; XLSX sheet names
  use ` > ` for nested deck hierarchy.
- Replaced the removed Python `cgi` module with the standard `email` multipart
  parser, so the app runs on the current Python runtime without extra packages.
- Fixed XLSX workbook handles so Windows can delete temporary uploads after
  validation.
- Verified desktop/mobile layout and real fixture uploads: XLSX produced 9
  cards across 3 sources; CSV Case produced 5 cards; both had 0 blockers.
- 12 unit tests passed, plus Python and JavaScript syntax checks.

## CP5/CP4 web APKG build endpoint - 2026-07-01

- Refactored the UI build path in `webapp/app.py` into `build_apkg_payload()`
  so endpoint behavior is covered without a live browser/server.
- Added upload/build regression tests:
  - validated XLSX upload can build one selected source into APKG
  - missing build sessions are rejected clearly
- APKG output is written under `output/apkg/` and served through
  `/api/output/<filename>.apkg`.
- Verification passed with 18 tests:
  `python -m unittest tests.test_webapp_upload tests.test_build_apkg_from_report tests.test_import_validate_core tests.test_google_sheets_snapshot`.

## XLSX deck-name compatibility finding - 2026-07-01

- Microsoft Excel forbids `:` in worksheet names, so a workbook containing tab
  names such as `0 Nhi::Ho hap` is invalid and Excel recovers those tabs as
  `Recovered_Sheet*`.
- The deck mapping rule was updated: Google Sheet/XLSX tab names use ` > ` for
  hierarchy, and the app maps that separator to Anki `::`.
- CSV sources still use the explicit deck path typed in the UI or CLI.
- Rebuilt `tests/fixtures/spreadsheet_cp1/cp1_golden_valid.xlsx` with
  Excel-valid tab names:
  - `0 Nhi > Hô hấp` -> `0 Nhi::Hô hấp`
  - `0 Nội > Tim mạch > Ôn tập` -> `0 Nội::Tim mạch::Ôn tập`
  - `0 Nhi > Case cấp cứu` -> `0 Nhi::Case cấp cứu`
- Updated `scripts/import_validate_core.py`, `scripts/google_sheets_snapshot.py`,
  UI helper text and the CP2 fixture reports.
- Verification passed with 16 tests:
  `python -m unittest tests.test_import_validate_core tests.test_google_sheets_snapshot tests.test_webapp_upload tests.test_build_apkg_from_report`.

## CP5/CP4 multi-source APKG build hardening - 2026-07-01

- Fixed web upload picker state: after a selected CSV/XLSX file is removed,
  choosing the same file again now triggers the file input change event.
- Fixed Drive image rendering in generated APKG templates:
  `Auto-image-link-renderer` is now injected into MCQ and MCQ Case front/back
  templates, and reruns on each Anki card side.
- Confirmed real Drive image fixture link:
  `https://drive.google.com/uc?id=1uR9tul7Q-NfulzmzMcsaCkYOIS65_SsZ`.
- Added regression coverage for building all selected XLSX sources from the web
  validation report into one APKG.
- Added APKG model inspection to verify the Drive thumbnail renderer is present
  in generated note models and no renderer placeholder remains.
- Built evidence APKG:
  `output/apkg/CP5_fixture_all_sources.apkg`
  - 9 notes / 9 cards
  - 3 decks: `0 Nhi::Hô hấp`, `0 Nội::Tim mạch::Ôn tập`,
    `0 Nhi::Case cấp cứu`
  - 2 models: MCQ and MCQ Case
  - SQLite integrity: `ok`
- Verification passed with 20 tests:
  `python -m unittest tests.test_webapp_upload tests.test_build_apkg_from_report tests.test_import_validate_core tests.test_google_sheets_snapshot`.
- Next manual evidence: import `output/apkg/CP5_fixture_all_sources.apkg` into a
  clean/test Anki profile and confirm deck hierarchy, MCQ/Case behavior and
  Drive image display.
- Manual evidence completed: user tested the latest web-built APKG after the
  upload-picker and Drive image fixes and confirmed it is OK.

## Standalone no-Python web app idea captured - 2026-07-01

- Created `docs/STANDALONE_WEB_APP_IDEA.md`.
- The preferred long-term direction is a static, browser-only Sheet-to-Anki app
  that reads CSV/XLSX/Google Sheet data, validates it and builds APKG in
  JavaScript.
- The current decision is to keep the Python-backed local app as the reference
  implementation until CP5/CP6 and CP7 pass, then use the frozen contract to
  port the workflow safely.

## CP7 Anki functional acceptance started - 2026-07-01

- Created `docs/CP7_ANKI_FUNCTIONAL_ACCEPTANCE.md`.
- CP7 is a manual Anki checklist, not an automated builder test.
- The user should test the latest web-built APKG, or
  `output/apkg/CP5_fixture_all_sources.apkg`, in a clean/test Anki profile.
- The checklist covers import/deck tree, MCQ front/back, Case front/back,
  images, display controls, HTMLChem/text rendering, Browse/Preview/Edit
  Current and a light re-import sanity check.
- CP7 must pass before CP8 identity/update safety starts.

## CP3 Google Sheets preflight prepared - 2026-07-01

- Added `scripts/google_sheets_preflight.py`.
- Added `tests/test_google_sheets_preflight.py`.
- Installed Google Sheets Python dependencies into the active user Python:
  `google-api-python-client`, `google-auth`, `google-auth-oauthlib`.
- Created local ignored `secrets/` folder.
- Current preflight result:
  - Google dependencies: OK
  - OAuth client JSON: missing
  - token path: `C:\Users\DELL\AppData\Roaming\PDF_Anki\google_sheets_token.json`
    not created yet
- Remaining user action: download a Google OAuth Desktop client JSON and save it
  as `secrets/google_oauth_client.json`.
- Verification passed:
  `python -m unittest tests.test_google_sheets_preflight tests.test_google_sheets_snapshot tests.test_import_validate_core`
  with 14 tests.

## Google Sheet review-tab direction clarified - 2026-07-02

- The primary APKG source should be real review/data tabs whose names are the
  intended Anki deck paths, for example `0 Nhi > Case` mapping to
  `0 Nhi::Case`.
- `Anki Export` and `Anki Export Case` are compatibility outputs for the old
  Apps Script/CSV workflow, not the preferred APKG source; the direct APKG
  workflow ignores them by default.
- The web app should detect MCQ/Case from schema, not from tab names.
- If a tab contains `Status`, only `Approved` rows are eligible and `Status` is
  removed before Anki/APKG output.
- If a tab lacks `Status`, the build may proceed only after a visible warning:
  `Sheet chua co cot Status, du lieu co the chua duoc kiem tra. Ban chac chan muon build?`
- Missing CardUID in `Source` is still an identity/update concern for CP8. The
  current validator warns and generates an `auto_...` fallback so test APKGs can
  be built, but update-safe production use requires real CardUIDs in `Source`.

## CP3 direct Google Sheet snapshot/build evidence - 2026-07-02

- Updated the validation core to ignore legacy `Anki Export` and
  `Anki Export Case` tabs by default.
- Added a non-blocking `MISSING_STATUS` warning and a UI confirmation before
  building selected sources without a `Status` column.
- Downgraded missing `CardUID` from blocker to warning for test builds and
  generated deterministic `auto_...` fallback identities.
- Real Google Sheet snapshot evidence:
  - `output/sheets_snapshot_review_toan_direct_tabs.json`
  - `output/sheets_validation_report_review_toan_direct_tabs.json`
- Fetched tabs:
  - `Review > Test` -> `Review::Test`
  - `Review Case > Test Case` -> `Review Case::Test Case`
  - `Sheet2` empty
- Validation result: 827 normalized rows, 0 blockers, 827 warnings for missing
  real CardUIDs.
- Built direct snapshot APKG:
  `output/apkg/CP3_review_toan_direct_tabs_test.apkg`
  - 827 notes / 827 cards
  - decks: `Review::Test`, `Review Case::Test Case`
  - models: 2
  - SQLite integrity: `ok`
- Fixed APKG field cleanup so loose medical comparison signs such as `<2cm`,
  `< 35°C` and `INR > 1.5` are escaped without breaking real HTML tags.
- Added `scripts/check_html_angle_safety.py` to audit loose medical comparison
  signs before build/import. The first real-sheet audit wrote:
  `output/html_angle_safety_review_toan_direct_tabs.json`.
- Created `apps_script/sheet_to_anki_apps_script.gs` as a full replacement for
  the old Google Sheets Apps Script. It preserves the old Review/Review Case
  validation and CSV export flow, fixes Vietnamese labels and adds menu actions
  to generate stable CardUID text inside `Source`.
- Hardened Apps Script CardUID handling:
  - new CardUID generation scans existing IDs across both `Review` and
    `Review Case` before writing;
  - a generated collision is retried instead of being written;
  - existing CardUID text is never replaced automatically;
  - the menu includes `Kiểm tra trùng CardUID` to report duplicate IDs and row
    locations before exporting/building.
- Updated the replacement Apps Script to support the active-tab workflow:
  - new menu actions work on the current sheet/tab instead of requiring fixed
    sheet names like `Review` or `Review Case`;
  - the script detects MCQ vs Case from the header schema;
  - `Quét sheet hiện tại` reports row count, `Approved`, missing/blank Status,
    non-Approved rows, missing CardUIDs and duplicate CardUID count;
  - `Tạo CardUID sheet hiện tại` writes only to current-sheet `Approved` rows
    and refuses to run if the sheet has no `Status` column.
- Replaced active-sheet validation alert with a Google Sheets sidebar:
  - manual-fix errors include clickable cell locations such as `H250` or
    `L517`;
  - clicking an error activates the matching cell in the current Google Sheet;
  - bulk CardUID warnings are grouped instead of creating hundreds of links;
  - the sidebar stays open while editing and avoids the large fixed-size
    modeless dialog frame.
- Fixed Apps Script blank-cell detection so valid falsy values such as `0`,
  `0%`, `0.0` or boolean `FALSE` are not treated as empty during validation.
- Added a `Reload` button to the active-sheet validation sidebar. The sidebar
  now fetches a fresh validation payload from the current sheet and re-renders
  the error/warning counts without closing the panel.
- Hardened validation sidebar labels against Apps Script copy/paste encoding
  issues by using JavaScript Unicode escapes for Vietnamese UI text.
- CP9 source-list cleanup:
  - empty/ignored sources such as blank `Sheet2` are kept in report audit data
    as `ignoredSources` but hidden from the public `sources` list used by the
    web table and build selection;
  - blank Google Sheet tabs are now skipped before validation, so they do not
    become selectable build sources;
  - web auto-select also filters out any source with `ignored: true`;
  - regression coverage added for empty-source payload hiding.
- CP9.1 version/About visibility:
  - backend exposes `/api/version` with app version, server start time, project
    root and active build-session count;
  - frontend shows a bottom-right version pill and a topbar `!` About button;
  - About lists frontend/backend versions plus currently visible and ignored
    report sources, useful for checking stale browser/server state.
- Google Sheet direct snapshot now accepts only tabs that look like real Anki
  data tables: full MCQ/Case schema plus a `Status` column. Blank tabs and
  draft/non-Anki tabs with stray content are skipped before validation/build.
- CP11 workflow guide added to the web app:
  - sidebar now includes `Hướng dẫn`;
  - guide content is a compact in-app handbook covering quick start, tab/deck
    naming, data rules, Google Sheet validation, APKG build/import, common
    errors and multi-document workflow.

- Created `docs/ONLINE_CLIENT_SIDE_BUILD_PLAN.md` to preserve a separate
  online/static APKG builder direction inspired by browser-side builders such
  as genanki-js/sql.js/JSZip/FileSaver.js. This is explicitly a sandbox plan;
  the current Python local builder remains the stable workflow and must not be
  replaced until the JS builder passes equivalent Anki acceptance tests.
- Created `online_builder_reference_snapshot/` as an isolated reference copy
  for the future online builder. It includes selected docs, Anki templates,
  Python validation/build reference scripts, Apps Script helper and current
  static web UI files, but excludes real data folders such as `input/`,
  `output/`, `runs/` and `secrets/`.
- Added detailed online-builder planning docs inside the reference snapshot:
  - `ONLINE_BUILDER_IMPLEMENTATION_BLUEPRINT.md` with architecture, folder
    layout, checkpoints CP12-CP18, test matrix, risks and stop conditions;
  - `TEMPLATE_REFERENCE_INDEX.md` mapping MCQ/Case front/back/styling files
    and features that must not be dropped during a browser-only port.
- Clarified the online-builder plan: source-filtering bugs such as `Sheet2`
  appearing in buildable sources are logic/validation issues, not layout
  issues. CP12-CP13 must focus on schema/status filtering and ignored-source
  reporting; UI layout changes are separate user-approved design work.
- Versioning decision for the online-builder branch:
  - CP12 starts the new online/static line as `v2.0.0`;
  - CP13 becomes `v2.0.1`;
  - later checkpoints use semantic versioning, with patch for validation/fixes,
    minor for substantial new capability, and major only for schema/template or
    import-identity changes.
- Added `docs/NEXT_SESSION_HANDOFF.md` for the next session. It records the
  CP11 -> CP12 state, the CP12/v2.0.0 and CP13/v2.0.1 version policy, the
  local-first then Wrangler deploy workflow, and the rule that source-filtering
  fixes do not require UI layout changes.

## CP12 online-builder sandbox started - 2026-07-02

- Created isolated `online_builder/` sandbox for the online/static builder
  line. Stable Python local workflow remains untouched.
- Recorded online-builder metadata as `v2.0.0 / CP12`.
- Added frozen JS schema constants for:
  - MCQ fields: `Ques, A, B, C, D, E, Ans, Ex, Source, Note, Image, Tags`;
  - MCQ Case fields: `CaseTitle, CaseStem, Ques1..Ex5, Source, Note, Image,
    Tags`;
  - `Status` as review-only metadata;
  - CardUID embedded in `Source`.
- Copied current MCQ/Case templates from
  `online_builder_reference_snapshot/Anki_template/` into
  `online_builder/src/templates/`.
- Added mini no-real-data fixtures for MCQ, Case and mixed source-filtering
  decisions.
- Added `online_builder/SOURCE_FILTERING_DECISION_TABLE.md` so CP13 treats
  `Sheet2`/draft tabs as validation/source-filtering logic, not UI layout work.
- Added `online_builder/tests/cp12-contract-check.mjs`; check passed with:
  `node online_builder/tests/cp12-contract-check.mjs`.

## CP13 online-builder validation core - 2026-07-02

- Advanced `online_builder/` to `v2.0.1 / CP13`.
- Added browser/Node-compatible validation modules under
  `online_builder/src/core/`:
  - schema detection;
  - `Status` filtering;
  - deck path mapping from ` > ` to `::`;
  - CardUID extraction from `Source`;
  - duplicate CardUID blocker detection;
  - loose medical comparison sign warning;
  - public report split into visible `sources[]` and `ignoredSources[]`.
- CP13 source-filtering behavior:
  - valid Google Sheet tabs require full MCQ/Case schema, `Status`, and data;
  - draft/unknown tabs such as `Sheet2` go to `ignoredSources[]`;
  - Google Sheet tabs with full schema but missing `Status` are blockers;
  - partial Anki-like schemas are blockers;
  - CSV sources without `Status` are warning-only and can remain visible.
- Recorded the UI decision: future online UI starts from the stable Python web
  UI snapshot, not a redesign; filtering behavior stays in validation core.
- Added `online_builder/tests/cp13-validate.test.mjs`.
- `npm test` in `online_builder/` passes both contract and CP13 validation
  tests.

## CP14 APKG builder investigation started - 2026-07-02

- Started CP14 without replacing or touching the stable Python APKG workflow.
- Added APKG build-plan adapter under `online_builder/src/apkg/`.
- Current CP14 output maps CP13 validated rows to deterministic:
  - deck specs;
  - model specs;
  - note specs;
  - field order;
  - CardUID GUID source;
  - template file references.
- Mirrored stable Python builder constants:
  - model IDs `1707015001` for Case and `1707015002` for MCQ;
  - model names from V10 templates;
  - deck ID namespace `pdf_anki_deck_v1`.
- Added `online_builder/docs/CP14_APKG_BUILDER_DECISION.md`.
- Added lightweight build-plan check:
  `node tests/cp14-build-plan.test.mjs`.
- Installed `sql.js` and `jszip` for the test-only CP14 backend.
- Added a minimal `sql.js + JSZip` APKG package writer and fixture script:
  `npm run build:cp14-fixture` from `online_builder/`.
- Stop point: user should run the fixture build and import
  `online_builder/out/cp14-fixture.apkg` into a clean Anki test profile. CP14
  remains investigation/prototype until that manual Anki acceptance is recorded.

## CP14-CP16 online-builder acceptance - 2026-07-02

- CP14 was accepted after the user ran `npm run build:cp14-fixture` and
  imported `online_builder/out/cp14-fixture.apkg` into Anki successfully.
- CP15 was accepted after the user ran `npm run check:cp15`; browser URL,
  CSV/XLSX adapters, source filtering and in-memory APKG packaging passed.
- CP16 integrated the accepted browser pipeline into the stable Python UI
  snapshot under `online_builder/`.
- CP16 browser UI now supports public Google Sheet links, local CSV/XLSX files,
  validation/source filtering, selected-source APKG download and About/version.
- Fixed overly noisy HTML/medical sign validation: ordinary comparison signs
  such as `pH < 7.35` and `INR > 1.5` no longer create bulk warnings; only
  unsupported or malformed HTML is reported as `HTML_CONTENT_SAFETY`.
- CP16 released metadata: `v2.3.0 / CP16`.
- Verification passed in `online_builder/`: `npm test` and `npm run build`.
- CP17 release hardening fixed Build APKG source-selection behavior:
  - UI no longer disables Build APKG because of blockers outside the selected
    source set;
  - browser APKG packaging validates and builds only selected sources.
- CP17 also fixed the Google Sheet Status gate: tabs without `Status` are
  ignored instead of becoming visible blockers.
- CP17 released metadata: `v2.3.2 / CP17`.
- Verification passed in `online_builder/`: `npm test` and `npm run build`.
- User manually tested CP17:
  - UI showed the current version;
  - Google Sheet validation no longer surfaced export/missing-Status tabs as
    blockers;
  - Build APKG worked;
  - the downloaded APKG imported into Anki successfully.
- User explicitly confirmed deployment.
- CP17 was deployed to Cloudflare Pages project
  `sheet-to-anki-online-builder`.
- Production URL:
  `https://sheet-to-anki-online-builder.pages.dev`
- Cloudflare deployment URL:
  `https://c20f37d7.sheet-to-anki-online-builder.pages.dev`
- Production alias smoke check returned HTTP 200.

## CP18 online-builder Python regression guard - 2026-07-03

- Advanced `online_builder/` to `v2.3.3 / CP18` for local regression coverage.
- Added `online_builder/tests/cp18-python-regression.test.mjs`.
- Added `npm run check:cp18` and included it in `npm test`.
- CP18 compares browser/static APKG output against stable Python builder
  invariants:
  - same note/card count for the clean fixture set;
  - same deck tree and deterministic deck IDs;
  - same model IDs, model names and field order;
  - JS CardUID GUIDs match Python `genanki.guid_for`;
  - editing question text with the same CardUID keeps the same note GUID;
  - APKG contains `collection.anki2` and `media`, and SQLite integrity is `ok`.
- Documented CP18 in `online_builder/docs/CP18_PYTHON_REGRESSION.md`.
- Verification passed in `online_builder/`: `npm run check:cp18`, `npm test`
  and `npm run build`.
- CP18 has not been deployed. Manual Anki smoke test is only needed if this
  checkpoint is promoted beyond local QA.

## CP19 online-builder contribution/contact page - 2026-07-03

- Advanced `online_builder/` to `v2.4.0 / CP19` locally.
- Updated displayed product name to `SheetToAnki`.
- Added a sidebar `Đóng góp` item and contribution/contact section.
- Added user-provided links:
  - Google Form for feedback/bug reports/workflow suggestions;
  - Facebook contact link.
- Added user-provided optional coffee-support QR at
  `online_builder/public/support-qr.png`.
- The app remains browser-only: no hidden telemetry, no backend and no workbook
  collection behavior was added.
- Documented CP19 in `online_builder/docs/CP19_CONTRIBUTION_CONTACT.md`.
- Verification passed in `online_builder/`: `npm test` and `npm run build`.
- User manually accepted CP19 after checking the contribution/contact UI and QR.
- CP19 is ready for GitHub/Cloudflare release.

## CP3 real Google Sheet OAuth/list-tabs succeeded - 2026-07-02

- User created a Google OAuth Desktop client and saved it at
  `secrets/google_oauth_client.json`.
- OAuth login succeeded and token was created at:
  `C:\Users\DELL\AppData\Roaming\PDF_Anki\google_sheets_token.json`.
- `Review (Toàn)` Spreadsheet was accessed successfully.
- Tabs listed:
  - `Review`
  - `Review Case`
  - `Anki Export`
  - `Anki Export Case`
  - `Sheet2`
- Snapshot/report evidence:
  - `output/sheets_snapshot_review_toan.json`
  - `output/sheets_validation_report_review_toan.json`
- Current validation result:
  - `normalizedRows`: 0
  - `blockers`: 827
  - blocker reason: export rows do not embed a CardUID in `Source`
- Data-contract issue found:
  - Current `Source` examples look like `Lippincott (Chương 16); 5+6. Lipid.pdf`
    or `part_001_pages_001_050_match_001; pages 1`.
  - The builder requires a stable CardUID in `Source`, for example a Sheet link
    label containing `anki_...` or `nhi_case_...`.
  - Current export tab names are generic (`Anki Export`, `Anki Export Case`), so
    they map to generic Anki decks unless the sheet is renamed/copied to a deck
    path tab name such as `0 Nhi > Hô hấp`.
