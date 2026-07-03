# task.md — Danh sách việc cần làm

## Tài liệu xử lý lỗi

- [x] Tổng hợp taxonomy lỗi và quy trình xử lý tại `docs/error_playbook.md`.

## Giai đoạn 0 — Chuẩn bị thư mục

- [ ] Tạo thư mục dự án:

```text
D:\PDF_Anki\
├─ input\
├─ parts\
├─ output\
│  ├─ left_right\
│  ├─ cases\
│  ├─ answers\
│  ├─ clean\
│  └─ csv\
└─ scripts\
```

- [ ] Copy PDF gốc 800 trang vào:

```text
D:\PDF_Anki\input\source.pdf
```

- [ ] Kích hoạt môi trường Python/conda đang dùng:

```bat
conda activate marker311
```

- [ ] Cài PyMuPDF nếu chưa có:

```bat
pip install pymupdf
```

## Giai đoạn 1 — Tách PDF để test

- [ ] Viết script:

```text
D:\PDF_Anki\scripts\split_pdf.py
```

- [ ] Script phải hỗ trợ:

```bat
python split_pdf.py input.pdf --out parts --test-pages 20
python split_pdf.py input.pdf --out parts --chunk 50
```

- [ ] Tạo file test 20 trang:

```text
D:\PDF_Anki\parts\test_001_020.pdf
```

- [ ] Chưa tách toàn bộ 800 trang cho tới khi script tách cột được kiểm tra ổn.

## Giai đoạn 2 — Script PyMuPDF tách cột động

- [ ] Viết script:

```text
D:\PDF_Anki\scripts\pdf_extract_left_right.py
```

- [ ] Không hard-code chia cột theo tỷ lệ 60/40.
- [ ] Phải tự phát hiện ranh giới cột theo từng trang bằng:
  - [ ] đường kẻ dọc;
  - [ ] khoảng trống lớn giữa text blocks;
  - [ ] từ khóa `Đáp án`, `Giải thích`.

- [ ] Chạy thử với file test 20 trang.

Output cần có:

```text
D:\PDF_Anki\output\left_right\test_001_020_all_left.md
D:\PDF_Anki\output\left_right\test_001_020_all_right.md
D:\PDF_Anki\output\left_right\test_001_020_debug_preview.md
D:\PDF_Anki\output\left_right\test_001_020_debug_layout.json
```

- [ ] Kiểm tra `debug_preview.md` bằng mắt.
- [ ] Nếu có nhiều trang `REVIEW_REQUIRED`, chỉnh lại thuật toán tách cột.
- [ ] Nếu tách ổn, chuyển sang giai đoạn 3.

## Giai đoạn 3 — Tách toàn bộ PDF thành part 50 trang

- [ ] Chạy tách PDF:

```bat
python D:\PDF_Anki\scripts\split_pdf.py D:\PDF_Anki\input\source.pdf --out D:\PDF_Anki\parts --chunk 50
```

- [ ] Kết quả kỳ vọng với file 800 trang:

```text
part_001_pages_001_050.pdf
part_002_pages_051_100.pdf
...
part_016_pages_751_800.pdf
```

- [ ] Chạy `pdf_extract_left_right.py` cho từng part.
- [ ] Mỗi part phải có đủ:
  - [ ] all_left.md
  - [ ] all_right.md
  - [ ] debug_preview.md
  - [ ] debug_layout.json

## Giai đoạn 4 — AI Agent 1 chia case và answer block

- [ ] Input:
  - [ ] all_left.md
  - [ ] all_right.md

- [ ] Chia `all_left.md` thành các case/câu hỏi.
- [ ] Chia `all_right.md` thành các answer block.
- [ ] Xuất:

```text
cases_left.md
cases_left.json
answers_right.md
answers_right.json
```

- [ ] Mỗi case cần có:
  - [ ] case_id
  - [ ] source_page hoặc part_id
  - [ ] question text
  - [ ] options A-D/E
  - [ ] question_count

- [ ] Mỗi answer block cần có:
  - [ ] answer_block_id
  - [ ] source_page hoặc part_id
  - [ ] danh sách đáp án
  - [ ] giải thích tương ứng

## Giai đoạn 5 — Match case với answer block

- [ ] Ghép theo thứ tự:

```text
Case 1 ↔ Answer block 1
Case 2 ↔ Answer block 2
Case 3 ↔ Answer block 3
```

- [ ] Nếu số câu hỏi và số đáp án khớp, tạm đánh dấu `Pending`.
- [ ] Nếu không khớp, đánh dấu `Needs review`.
- [ ] Nếu thiếu lựa chọn A/B/C/D, đánh dấu `Needs review`.
- [ ] Nếu đáp án ngoài A/B/C/D/E, đánh dấu `Needs review`.

Output:

```text
clean.md
clean.json
```

## Giai đoạn 6 — Xuất CSV Pending

- [ ] Xuất CSV đúng cột:

```text
Status | Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags
```

- [ ] Giai đoạn này status mặc định:
  - [ ] `Pending` nếu ghép ổn nhưng chưa kiểm kỹ.
  - [ ] `Needs review` nếu có lỗi.

- [ ] Không ghi prefix `A.`, `B.`, `C.`, `D.`, `E.` trong đáp án.
- [ ] Cột E để trống nếu câu chỉ có A-D.
- [ ] Không ghi dòng `Đáp án: ...` trong Ex.
- [ ] Công thức/chỉ số phải dùng HTML thô:

```html
V<sub>0</sub>
H<sub>2</sub>O
CO<sub>2</sub>
Ca<sup>2+</sup>
NAD<sup>+</sup>
FADH<sub>2</sub>
```

## Giai đoạn 7 — AI 2 / Script checker

- [ ] Kiểm tra từng dòng CSV.
- [ ] Nếu đạt, đổi `Status` thành `Approved`.
- [ ] Nếu nghi ngờ, giữ hoặc đổi thành `Needs review`.
- [ ] Ghi lý do vào `Note` nếu cần.

Checklist checker:

- [ ] Đủ đúng 13 cột.
- [ ] Không trống Ques.
- [ ] A-D không trống.
- [ ] E trống nếu không có đáp án E.
- [ ] Ans thuộc A/B/C/D/E.
- [ ] Ex không chứa dòng `Đáp án:`.
- [ ] Không có Unicode sub/sup như `H₂O`, `V₀`, `Ca²⁺`.
- [ ] Không có HTML bị escape như `&lt;sub&gt;`.
- [ ] Tags có tag chính phù hợp, ví dụ `enzyme`.

## Giai đoạn 8 — Output cuối

- [ ] Xuất file CSV cuối cùng:

```text
D:\PDF_Anki\output\csv\anki_approved.csv
```

- [ ] CSV Anki cuối phải bỏ cột `Status`; Status chỉ tồn tại trong bảng Review.

- [ ] Nếu người dùng yêu cầu bảng Markdown, xuất bảng Markdown đúng 13 cột.
- [ ] Không thêm giải thích ngoài bảng khi đang xuất dữ liệu.

## Prompt ngắn cho AI Agent chuyển PDF/Markdown sang CSV

```text
Tôi sẽ cung cấp file Markdown đã tách từ PDF chứa câu hỏi trắc nghiệm. Hãy chuyển thành CSV/Markdown table đúng cột:
Status | Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags

Quy tắc:
- Mỗi hàng là một câu hỏi.
- Không bỏ sót câu.
- Status sau kiểm tra là Approved; nếu nghi ngờ thì Needs review.
- Ques chỉ ghi nội dung câu hỏi, không ghi Chương/Câu nếu đó chỉ là nhãn.
- A-E chỉ ghi nội dung đáp án, bỏ prefix A./B./C./D./E.
- Nếu chỉ có A-D thì E để trống.
- Ans chỉ là A/B/C/D/E.
- Ex ghi giải thích, không ghi lại dòng Đáp án: ...
- Công thức dùng HTML thô: H<sub>2</sub>O, V<sub>0</sub>, Ca<sup>2+</sup>.
- Không dùng ký tự Unicode nhỏ như H₂O, V₀, Ca²⁺.
- Không escape HTML thành &lt;sub&gt;.
- Source lấy từ PDF nếu có.
- Note để trống nếu không có lỗi.
- Image để trống nếu không có link ảnh.
- Tags dùng tag chính phù hợp, ví dụ enzyme.
```

---

## Giai đoạn bổ sung sau test thực tế

### Giai đoạn A — Làm sạch layout và text

- [x] Lọc footer dạng `1. Tiêu hóa Page N`.
- [x] Lọc footer/chuyên mục dạng `1. Tiêu hóa`, `2. Chấn thương chỉnh hình`, `3. Thận tiết niệu`, `4. Tim mạch lồng ngực`, `5. Thần kinh`, `6. Nhi`, `1. Đại cương`.
- [x] Bỏ nội dung ngoài bảng khi extract left/right.
- [ ] Thêm bước normalize text cho lỗi dính chữ.
- [ ] Tạo report token nghi dính chữ để bổ sung rule an toàn.

### Giai đoạn B — Overlap part

- [x] Thêm option `--overlap-pages` cho `split_pdf.py`.
- [x] Tạo bộ part overlap 2 trang:

```bat
python scripts\split_pdf.py input\source.pdf --out parts_overlap_2p --chunk 50 --overlap-pages 2
```

- [x] Tạo script `check_part_overlap.py`.
- [x] Tạo `overlap_report.md/json`.
- [ ] Dùng overlap report để reject bản trùng/cắt cụt khi merge cuối.

### Giai đoạn C — Status và audit

- [x] Bổ sung trạng thái `Rejected`.
- [ ] Tạo `rejected.md` và `rejected.json` khi có record bị loại.
- [ ] Không xuất `Rejected` vào CSV.
- [ ] Chỉ đổi sang `Approved` sau khi qua checker hoặc AI/người xác nhận.

### Giai đoạn D — Risk và AI review

- [x] Validate case-answer bằng `question_count`, `answer_count`, page gap, keyword overlap.
- [ ] Thêm `risk_level`: `low`, `medium`, `high` cho mọi record.
- [ ] Tạo batch review cho Antigravity:
  - `CASE`
  - `CURRENT ANSWER`
  - `CANDIDATE ANSWER -2/-1/0/+1/+2`
- [ ] Yêu cầu Antigravity trả JSON chọn candidate tốt nhất.
- [ ] Viết script apply kết quả Antigravity vào `clean.json/md` khi confidence cao.
- [ ] Giữ `Needs review` nếu AI không chắc.

### Giai đoạn E — CSV

- [ ] Chỉ xuất CSV nháp từ record `Pending`/`Approved` theo lựa chọn.
- [ ] Không xuất `Rejected`.
- [ ] Với `Needs review`, có thể xuất file riêng để kiểm tra, chưa đưa vào CSV cuối.

---

## Hướng dẫn dùng Antigravity review batch

### Mục tiêu

Dùng Antigravity để review các record `Needs review` hoặc `Pending` rủi ro cao, đặc biệt khi `CASE` đúng nhưng `ANSWER BLOCK` bị lệch.

Antigravity không cần đọc toàn bộ PDF. Chỉ đọc batch nhỏ gồm CASE và các candidate answer lân cận.

### File prompt cho Antigravity

Đưa file này cho Antigravity đọc trước:

```text
docs/ANTIGRAVITY_REVIEW_PROMPT.md
```

### Workflow dự kiến

1. Codex tạo batch review trong:

```text
output/ai_review/antigravity_batch_001.md
```

2. Người dùng đưa prompt + batch sang Antigravity.

3. Antigravity chỉ trả JSON array theo schema:

```json
[
  {
    "match_id": "...",
    "best_candidate": "-2|-1|0|+1|+2|none",
    "confidence": "high|medium|low",
    "reason": "..."
  }
]
```

4. Người dùng lưu kết quả vào:

```text
output/ai_review/antigravity_result_001.json
```

5. Codex chạy script apply kết quả:

```text
scripts/apply_antigravity_review.py
```

### Nguyên tắc apply

- Nếu `confidence = high` và `best_candidate != none`: tự sửa match sang candidate đó.
- Nếu `confidence = medium`: giữ `Needs review`, ghi note gợi ý.
- Nếu `confidence = low` hoặc `best_candidate = none`: giữ `Needs review`.
- Mọi thay đổi phải ghi audit.

### Việc cần làm thêm

- [ ] Tạo script sinh batch Antigravity từ `clean.json`.
- [ ] Tạo script apply JSON kết quả Antigravity.
- [ ] Tạo thư mục `output/ai_review`.
- [ ] Chạy thử batch nhỏ 10-20 item trước khi làm hàng loạt.

---

## Cập nhật sau AI G batch 001 - 2026-06-05

Đã hoàn thành:

- [x] Tạo batch review nhỏ cho AI G: `output/ai_review/antigravity_batch_001.md`.
- [x] Nhận kết quả AI G: `output/ai_review/antigravity_result_001.json`.
- [x] Viết script apply kết quả AI G: `scripts/apply_antigravity_review.py`.
- [x] Apply 11/15 mục high-confidence từ AI G.
- [x] Giữ lại 4/15 mục chưa đủ chắc để review tiếp.
- [x] Sửa apply script để chạy lại không làm lệch candidate nhiều lần.
- [x] Sửa validator để không hạ trạng thái các record đã được AI G high-confidence xác nhận chỉ vì keyword-overlap thấp.

Trạng thái sau khi apply và validate:

```text
726 records
452 Pending
274 Needs review
```

Việc tiếp theo:

- [x] Tạo batch AI G tiếp theo từ toàn bộ record `Needs review` còn lại.
- [x] Tạo index hướng dẫn cho AI G: `output/ai_review/AI_G_BATCH_INDEX.md`.
- [x] Kiểm tra batch 002-015: 274 `match_id`, không trùng.
- [x] Cho AI G làm lần lượt từ `antigravity_batch_002.md` đến `antigravity_batch_015.md`.
- [x] Apply kết quả AI G batch 002-015.
- [x] Validate lại toàn bộ clean matches sau khi apply.
- [ ] Trong mỗi batch, vẫn gửi cả `CASE`, `CURRENT ANSWER`, candidate answer lân cận và phần giải thích.
- [ ] Chỉ auto-apply khi AI G trả `confidence = high`.
- [ ] Với `medium`, giữ `Needs review` nhưng ghi note để người dùng/Codex quyết sau.
- [ ] Với `low` hoặc `none`, giữ `Needs review`.

Kết quả apply batch 002-015:

```text
274 review items
155 high-confidence updates applied
119 items kept for review
```

Trạng thái mới nhất:

```text
726 records
560 Pending
166 Needs review
```

Ưu tiên tiếp theo:

- [ ] Xử lý sâu `part_010_pages_451_500` vì còn 50 `Needs review`.
- [ ] Xử lý sâu `part_011_pages_501_550` vì còn 52 `Needs review`.
- [x] Tạo batch đặc biệt với window rộng hơn (`-5..+5`) cho part 010-011.
- [x] Tạo index batch wide: `output/ai_review/AI_G_BATCH_INDEX_WIDE_010_011.md`.
- [x] Cho AI G review batch wide 016-026.
- [x] Apply kết quả AI G wide batch 016-026.
- [ ] Chỉ sau khi giảm lỗi hệ thống ở part 010-011 mới tính bước xuất CSV nháp.

Kết quả batch wide 016-026:

```text
102 review items
2 high-confidence updates applied
100 items kept for review
60 high-confidence none
40 low-confidence none
```

Kết luận: không nên tiếp tục gửi batch AI G rộng hơn cho part 010-011. Cần quay lại debug nguồn dữ liệu:

- [ ] Kiểm tra `output/answers/part_010_pages_451_500_answers_right.json`.
- [ ] Kiểm tra `output/answers/part_011_pages_501_550_answers_right.json`.
- [x] So sánh số case và answer block ở part 010-011.
- [x] Kiểm tra debug layout/extract của hai part này để xem right column có bị tách sai hoặc thiếu answer không.
- [x] Extract lại part 010-011 bằng PyMuPDF `--word-split`.
- [x] Sửa parser để nhận case không có dòng `Câu hỏi:` nhưng có cấu trúc MCQ.
- [x] Re-parse/re-match part 010-011 vào output chính.

Kết quả sau re-extract part 010-011:

```text
731 records
660 Pending
71 Needs review
```

Riêng hai part đã sửa:

```text
part_010_pages_451_500: 1 Needs review
part_011_pages_501_550: 6 Needs review
```

Việc tiếp theo:

- [ ] Review các part còn nhiều lỗi nhất: `part_008` còn 24, `part_002` còn 14.
- [ ] Kiểm tra 7 lỗi còn lại ở part 010-011, đa số là missing case/extra answer cuối part hoặc validator flag.
- [ ] Sau khi xử lý xuống mức chấp nhận được, tạo CSV nháp từ `Pending`.

---

## Cập nhật part 008 theo báo cáo người dùng - 2026-06-05

Đã thêm:

- [x] Script quét candidate lệch đáp án: `scripts/report_answer_offset_candidates.py`.
- [x] Report part 008: `output/ai_review/part_008_pages_351_400_answer_offset_candidates.md`.
- [x] Mở rộng `scripts/apply_antigravity_review.py` để hỗ trợ `action: "reject"`.

Đã sửa theo báo cáo người dùng:

- [x] `part_008_pages_351_400_match_031` -> đổi sang `answer_029`.
- [x] `part_008_pages_351_400_match_063` -> `Rejected` vì không thấy answer BPH/Open Prostatectomy/HoLEP trong answer blocks lân cận.
- [x] `part_008_pages_351_400_match_065` -> đổi sang `answer_062`.

Trạng thái sau validate:

```text
part_008_pages_351_400: 63 Pending, 18 Needs review, 2 Rejected
```

Các mục `Needs review` còn lại của `part_008` cần kiểm tra tiếp:

```text
match_029
match_066
match_068
match_069
match_070
match_071
match_072
match_073
match_074
match_075
match_076
match_077
match_078
match_079
match_080
match_081
match_082
match_083
```

Ghi chú: từ `match_068` trở đi report tự động gợi ý lệch chủ yếu `-3`, nhưng không auto-apply hàng loạt vì có false positive trong cùng chủ đề tiết niệu. Cần người dùng hoặc AI G kiểm tra bằng PDF/answer text trước khi sửa cụm.

---

## Cập nhật sau sửa cụm offset part 008 - 2026-06-05

Đã phát hiện thêm lỗi ẩn trong các record `Pending` của `part_008`; vì vậy không được chỉ dựa vào `Needs review`.

Đã apply file:

```text
output/ai_review/manual_part_008_offset_cluster_fixes.json
```

Audit:

```text
output/ai_review/manual_part_008_offset_cluster_fixes_audit.json
```

Kết quả:

```text
29 high-confidence updates applied
part_008_pages_351_400: 81 Pending, 0 Needs review, 2 Rejected
whole clean set: 731 records, 681 Pending, 48 Needs review, 2 Rejected
```

Đã sửa cụm chính:

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

Việc tiếp theo:

- [ ] Không xuất CSV cuối từ `Pending` ngay.
- [ ] Thêm hoặc cải tiến bước `risk_level` cho `Pending` để bắt các cụm offset ẩn.
- [ ] Review các part còn `Needs review`: `part_002` còn 14, `part_011` còn 7, `part_003`/`006`/`007` còn 4-5, các part nhỏ còn lại ít lỗi.
- [ ] Sau khi giảm `Needs review`, tạo batch kiểm tra `Pending` rủi ro cao trước khi CSV.

---

## Cập nhật part 002 word-split v2 - 2026-06-05

Người dùng kiểm tra `part_002` và báo lỗi hệ thống: khung đáp án bên phải quá hẹp, nội dung answer/giải thích lọt vào case Markdown làm parser đếm thừa câu hỏi.

Đã làm:

- [x] Backup output cũ tại `output_backup/before_word_split_002_20260605`.
- [x] Re-extract `part_002_pages_051_100.pdf` bằng `--word-split`.
- [x] Sửa `scripts/parse_cases_answers.py` để chỉ đếm câu hỏi có đủ option A-D.
- [x] Re-parse/re-match part 002 vào output chính.
- [x] Apply override ngữ nghĩa cho `match_026` và `match_036`.
- [x] Sửa `scripts/validate_clean_matches.py` để high-confidence override không bị page-gap false positive kéo lại về `Needs review`.

Kết quả:

```text
part_002_pages_051_100: 43 Pending, 1 Needs review
remaining: match_044
```

Lý do `match_044` còn review:

```text
case cuối part bị cắt ngang ở ranh giới part 002-003
question_count = 1
answer_count = 5
```

Việc tiếp theo:

- [ ] Kiểm tra ranh giới `part_002` / `part_003` hoặc dùng output overlap để ghép case cuối.
- [ ] Sau khi xử lý `match_044`, tiếp tục review các part còn nhiều lỗi nhất.

### Hoàn tất boundary repair part 002

- [x] Dùng overlap `part_003_pages_099_150_ov002` để lấy đủ case/answer cho `part_002_pages_051_100_match_044`.
- [x] Vá đầy đủ 5 câu hỏi và 5 giải thích vào `cases`, `answers`, `clean`.
- [x] Rebuild clean summary.

Kết quả:

```text
part_002_pages_051_100: 44 Pending, 0 Needs review
whole clean set: 695 Pending, 34 Needs review, 2 Rejected
```

Việc tiếp theo:

- [ ] Review các part còn lỗi, ưu tiên `part_011` còn 7, `part_003` và `part_007` mỗi part còn 5.

---

## Cập nhật phân loại lỗi còn lại từ người dùng - 2026-06-05

Đã ghi vào `docs/error_playbook.md` các nhóm lỗi mới:

- [x] Nội dung lý thuyết/NOTE sau case lọt vào CASE.
- [x] Case chứa hai bộ câu hỏi liền nhau.
- [x] Orphan answer cuối part.

Các lỗi đã được người dùng phân loại:

```text
part_001 match_060: câu 5/answer structure khó đọc, cần chỉnh cấu trúc.

part_004 match_035: đề của vài câu đang tính liền vào nhau.
part_004 match_068: thiếu câu 4-5 do trang phía dưới/ranh giới part chưa quét.

part_010 match_063: cuối file chỉ có answer từ ý 5, không có đề; nghi orphan/answer fragment.

part_012 match_005: thực tế answer logic, note cũ nghi sai.
part_012 match_006: lý thuyết sau đáp án D câu 5 bị đưa vào case.
```

Việc tiếp theo nên làm:

- [ ] Xử lý `part_012` trước vì chỉ còn 2 lỗi và nguyên nhân rõ.
- [ ] Xử lý `part_004` sau đó.
- [ ] Xử lý `part_010 match_063` bằng overlap/cuối part.
- [ ] Tiếp tục review các part chưa phân loại chi tiết: `part_003`, `part_005`, `part_006`, `part_007`, `part_009`, `part_011`.

---

## Cập nhật part 003 word-split - 2026-06-05

Người dùng kiểm tra chi tiết 5 mục còn `Needs review` của `part_003`:

```text
match_002: đáp án và câu hỏi sắp xếp lộn xộn với nhau.
match_032: chưa quét đáp án/câu 4-5.
match_042: case lẫn lộn, mix giữa nhiều bài.
match_046: người dùng đã check bảng, nội dung đúng.
match_052: case có text rác "Tình huống & Câu hỏi / Đáp án & Giải thích" do lỗi quét Markdown.
```

Đã xử lý:

- [x] Re-extract `part_003_pages_101_150.pdf` bằng PyMuPDF `--word-split`.
- [x] Backup bản cũ tại `output_backup/before_20260605_word_split_003`.
- [x] Ghi bản word-split vào output chính cho `cases`, `answers`, `clean`.
- [x] Xác nhận `match_032` và `match_042` sạch sau word-split.
- [x] Thêm manual acceptance tại `output/ai_review/manual_part_003_word_split_acceptance.json`.
- [x] Sửa `scripts/validate_clean_matches.py` để nhận diện `Manual high-confidence accept...` như một override hợp lệ.

Kết quả sau validate:

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

---

## Cập nhật user review batch còn lại - 2026-06-05

Người dùng đã phân loại chi tiết thêm:

```text
part_004:
- match_035: có 2 case chồng vào nhau; phần thừa bắt đầu từ "Một sinh viên...".
- match_068: đề còn thiếu câu 4-5, đáp án không lỗi.

part_005:
- match_007, match_027, match_057: case bị thừa phần lý thuyết sau câu hỏi, đáp án không lỗi.

part_010:
- match_063: không quét được câu hỏi ở vị trí source.pdf trang 500-501 do cắt batch.

part_011:
- match_005: không có lỗi, đề và đáp án khớp. Hiện record đã là Pending.
- match_074: case bị chồng chéo nhiều câu hỏi.
- match_075, match_076, match_077: lệch đáp án.
- match_078: thiếu case; case nằm ở source.pdf trang 550.

part_012:
- match_005: không có lỗi.
- match_006: thừa đoạn lý thuyết bắt đầu từ "Dụng cụ..." sau câu 5.
```

Đã xử lý trực tiếp:

- [x] `part_004 match_035`: cắt bỏ case đầu, giữ case thứ hai khớp với answer block.
- [x] `part_005 match_007`, `match_027`, `match_057`: cắt phần lý thuyết lọt vào sau câu 5.
- [x] `part_012 match_005`: bỏ `Needs review`, manual accept.
- [x] `part_012 match_006`: cắt phần lý thuyết dụng cụ phẫu thuật sau câu 5.
- [x] Ghi audit tại `output/ai_review/manual_user_review_clear_obvious_20260605.json`.

Kết quả sau validate:

```text
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

Việc tiếp theo:

- [ ] Dùng overlap/source boundary để sửa `part_004 match_068` và `part_010 match_063`.
- [ ] Xử lý cụm `part_011 match_074-078`, ưu tiên offset cho `match_075-077` và boundary cho `match_078`.
- [ ] Tiếp tục phân loại `part_006`, `part_007`, `part_009`.

---

## Cập nhật final review clean set - 2026-06-05

Đã xử lý nốt các record còn `Needs review` sau vòng kiểm tra thủ công:

- [x] `part_007 match_069`: phục hồi full case từ overlap `part_008_pages_349_400_ov002`.
- [x] `part_009 match_056`: phục hồi case/answer thông động tĩnh mạch thận từ overlap `part_010_pages_449_500_ov002`.
- [x] `part_007 match_035`: đánh dấu `Rejected` vì PDF/text layer chỉ có câu 1 với option A-B rồi nhảy sang đáp án 1-5; câu 2-5 không phục hồi được từ source/overlap.
- [x] Ghi audit tại `output/clean/manual_final_review_repairs_20260605.json`.
- [x] Chạy lại validator.

Kết quả hiện tại:

```text
whole clean set: 727 Pending, 0 Needs review, 4 Rejected
```

Việc tiếp theo:

- [ ] Không xuất CSV từ các record `Rejected`.
- [ ] Nếu cần độ sạch cao hơn trước khi làm AI CSV, kiểm tra mẫu ngẫu nhiên các record `Pending` theo part.
- [ ] Sau khi chốt QA, triển khai bước xuất CSV Pending.

---

## Cập nhật export CSV - 2026-06-05

Đã tạo script:

```text
scripts/export_pending_csv.py
```

Đã xuất CSV từ 727 record `Pending`, bỏ qua 4 record `Rejected`.

Output:

```text
output/csv/pending_anki.csv              # full draft: 3635 rows
output/csv/pending_anki_import_ready.csv # excludes warning rows: 3627 rows
output/csv/pending_anki_warnings.csv     # rows needing manual check: 8 rows
output/csv/pending_anki_report.json
```

Phân bố câu hỏi theo tag:

```text
tieu_hoa: 1145
chan_thuong_chinh_hinh: 1390
than_tiet_nieu: 70
tim_mach_long_nguc: 550
than_kinh: 390
nhi: 90
```

8 dòng cần kiểm tra tay:

```text
part_001_pages_001_050_match_064 q5: missing A-D option
part_003_pages_101_150_match_046 q3-q5: missing answer
part_003_pages_101_150_match_049 q3-q5: missing answer
part_006_pages_251_300_match_074 q5: missing A-D option
```

Việc tiếp theo:

- [ ] Mở `output/csv/pending_anki_warnings.csv` và sửa 8 dòng cảnh báo nếu muốn đủ bộ.
- [ ] QA mẫu `output/csv/pending_anki_import_ready.csv`.
- [ ] Sau khi QA ổn, dùng file import-ready để import thử vào Anki/Google Sheets.

---

## Cập nhật export CSV wide case format - 2026-06-05

Người dùng bổ sung file mẫu trong `input`:

```text
input/anki_case_export_20260601_180603.csv
input/Review (Toàn).xlsx
```

Đã xác nhận sheet/file mẫu dùng format case-wide:

```text
CaseTitle | CaseStem | Ques1 | A1 | B1 | C1 | D1 | Ans1 | Ex1 | ... | Ques5 | A5 | B5 | C5 | D5 | Ans5 | Ex5 | Source | Note | Image | Tags
```

Đã tạo script:

```text
scripts/export_pending_case_wide_csv.py
```

Output:

```text
output/csv/pending_anki_case_wide.csv              # 727 rows, exact 41-column sample header
output/csv/pending_anki_case_wide_review.csv       # 727 rows, adds Status column first
output/csv/pending_anki_case_wide_import_ready.csv # 723 rows, excludes warning rows
output/csv/pending_anki_case_wide_warnings.csv     # 4 rows needing manual check
output/csv/pending_anki_case_wide_report.json
```

4 case cần kiểm tra tay:

```text
part_001_pages_001_050_match_064: q5 missing A-D option
part_003_pages_101_150_match_046: q3-q5 missing answer
part_003_pages_101_150_match_049: q3-q5 missing answer
part_006_pages_251_300_match_074: q5 missing A-D option
```

Đã xử lý lại 4 case trên:

- [x] `part_001 match_064`: phục hồi option C/D của Q5 và Ex5.
- [x] `part_003 match_046`: thêm answer Q3-Q5 theo giải thích.
- [x] `part_003 match_049`: thêm answer Q3-Q5 theo giải thích.
- [x] `part_006 match_074`: phục hồi option A-D của Q5.

Kết quả mới:

```text
pending_anki_case_wide.csv: 727 rows
pending_anki_case_wide_import_ready.csv: 727 rows
pending_anki_case_wide_warnings.csv: 0 rows
```
## Local web app checkpoint plan - 2026-07-01

- [x] Define mandatory checkpoint framework and acceptance rules.
- [x] CP0: turn the frozen contracts into executable fixtures.
- [x] CP1: create golden fixtures and regression snapshots.
- [x] CP2: unify import, normalization and validation core.
- [ ] CP3: connect private Google Sheets with read-only OAuth, snapshot selected tabs, and map sheet/tab names to decks with ` > ` -> `::`.
- [ ] CP3 fallback: support published links and XLSX/CSV through the same validation core.
- [ ] CP4: harden APKG structural validation and atomic output.
- [ ] CP5: build local-only backend API.
- [ ] CP6: build operational web interface.
- [ ] CP7: complete real Anki acceptance matrix.
- [ ] CP8: prove update/identity/migration behavior.
- [ ] CP9: freeze and test exam-builder compatibility.
- [ ] CP10: package launcher, recovery and release workflow.
- [ ] CP11: consider public/server deployment only after local release stability.

Detailed criteria: `docs/LOCAL_WEB_APP_CHECKPOINTS.md`.
## CP0 contract decisions recorded - 2026-07-01

- [x] Status is review-only and never enters Anki/exam data.
- [x] Filter Approved only when a Status column exists, then remove Status.
- [x] If Status is absent, allow build only with a visible warning:
  `Sheet chua co cot Status, du lieu co the chua duoc kiem tra. Ban chac chan muon build?`
- [x] Detect MCQ/Case from schema, never from sheet name.
- [x] Map Sheet/XLSX tab names to the complete Anki deck path with ` > ` -> `::`.
- [x] Single-answer MCQ/Case only.
- [x] Use HTMLChem; MathJax/mhchem is not required.
- [x] Keep existing field schema and embed CardUID + Sheet link in Source.
- [x] Add versioned executable schema fixtures.
- [ ] Prove re-import/update behavior using CardUID in CP8 with real Anki re-import checks.

Authoritative contract: `docs/DATA_SOURCE_AND_DECK_RULES.md`.

## CP1 golden fixtures completed - 2026-07-01

- [x] Valid Spreadsheet workbook with tab-to-deck mapping fixtures.
- [x] MCQ and Case schemas with Status filtering expectations.
- [x] Case fixtures covering 1, 2, 3, 4 and 5 questions.
- [x] Vietnamese, multiline text, HTMLChem, arrows and image variants.
- [x] Intentional blockers: multi-answer, missing CardUID, duplicate CardUID,
  malformed deck path and missing schema column.
- [x] Headerless MCQ/Case CSV, raw Review CSV and cross-file duplicate CSV.
- [x] Expected machine-readable manifest and visual previews for every sheet.
- [x] Refreshed CSV fallback fixtures from processed Nhi samples so manual
  inspection shows realistic MCQ/Case content.

Evidence: `tests/fixtures/spreadsheet_cp1/`.

## CP2 import/normalize/validate core completed - 2026-07-01

- [x] Added `docs/schema_contract.v1.json`.
- [x] Added `scripts/import_validate_core.py`.
- [x] Added `tests/test_import_validate_core.py`.
- [x] Supports XLSX sheets, multiple CSV files, header/headerless CSV,
  `Status` filtering/removal, schema detection, exact deck path validation,
  CardUID extraction from `Source`, single-answer validation and duplicate
  CardUID/deck conflict detection.
- [x] Generated CP2 reports in `tests/fixtures/spreadsheet_cp1/`.
- [x] Verification passed: `python -m unittest tests.test_import_validate_core`
  with 6 tests.

Next: CP3 Google Sheets OAuth/snapshot mapping.

## CP3 Google Sheets snapshot core started - 2026-07-01

- [x] Added `scripts/google_sheets_snapshot.py`.
- [x] Added `tests/test_google_sheets_snapshot.py`.
- [x] Added `docs/GOOGLE_SHEETS_OAUTH_SETUP.md`.
- [x] Added `.gitignore` entries for `secrets/`, token files and local snapshot reports.
- [x] Offline fake-service tests cover Spreadsheet URL parsing, tab listing,
  selected-tab snapshotting, tab-name-to-deck mapping and feeding the snapshot
  into the CP2 validation core.
- [x] Verification passed: `python -m unittest tests.test_import_validate_core tests.test_google_sheets_snapshot`
  with 10 tests.
- [x] Install Google API dependencies in the active Python runtime.
- [x] Added `scripts/google_sheets_preflight.py` and
  `tests/test_google_sheets_preflight.py`.
- [x] Created local ignored `secrets/` folder for OAuth client JSON.
- [ ] User creates/downloads OAuth Desktop client JSON and saves it as
  `secrets/google_oauth_client.json`.
- [x] User created/downloaded OAuth Desktop client JSON and saved it as
  `secrets/google_oauth_client.json`.
- [x] Run real OAuth login and list tabs for Google Sheet `Review (Toàn)`.
- [x] Save CP3 real snapshot/report evidence:
  - `output/sheets_snapshot_review_toan.json`
  - `output/sheets_validation_report_review_toan.json`
- [ ] Resolve real Sheet data blockers before build:
  - export rows need a CardUID embedded in `Source`
  - generic tab names such as `Anki Export` / `Anki Export Case` need a deck
    mapping decision or should be renamed/copied to deck-path tab names.

## CP6 UI prototype started - 2026-07-01

- [x] Added local prototype server: `webapp/app.py`.
- [x] Added static UI: `webapp/static/index.html`,
  `webapp/static/styles.css`, `webapp/static/app.js`.
- [x] Added `webapp/README.md`.
- [x] Prototype reads CP2 reports from `tests/fixtures/spreadsheet_cp1/`.
- [x] UI includes source selector, validation summary, process steps,
  Airtable-like source table, source detail panel, issue list and deck tree
  preview.
- [x] Build APKG button is disabled when blockers exist.
- [x] Verified API endpoints and JS syntax locally.
- [x] Switched prototype UI labels to Vietnamese with accents; technical terms
  such as APKG, MCQ, Case, CardUID, BLOCKER and WARNING remain unchanged.
- [ ] User visual review of layout, colors, spacing and workflow.
- [x] Connected UI to CP5 local CSV/XLSX validation.

## CP5 local file validation in UI - 2026-07-01

- [x] Add `POST /api/validate/local`.
- [x] Support XLSX paths where each sheet name maps to the complete deck path
  with ` > ` -> `::`.
- [x] Support one or more CSV paths with a user-provided deck path.
- [x] Restrict CP5 local path reads to files inside the project folder.
- [x] Reuse CP2 validation core and report shape.
- [x] Add UI controls for source type, file paths and CSV deck path.
- [x] Render real local validation results in the existing table/detail/deck UI.
- [x] Connect APKG build action to the CP4 builder after successful validation.
- [x] Verify with compile checks, JS syntax check, unit tests and fixture
  CSV/XLSX validation calls.
- [ ] User copies/exports one real Sheet CSV/XLSX into the project folder and
  tests it through the UI.
- [ ] Fix any CP5 workflow friction found during manual testing.
- [x] Add `POST /api/build` regression coverage for validated upload reports.
- [ ] User tests Build APKG from the web UI and imports the downloaded package
  into an Anki test profile.

## Google Sheet source path - 2026-07-01

- [x] Add Google Sheet as a selectable source in the UI.
- [x] Add Spreadsheet URL/ID input.
- [x] Add OAuth client JSON path input with default
  `secrets/google_oauth_client.json`.
- [x] Add optional tab list input; blank means all non-ignored tabs.
- [x] Add `POST /api/validate/google`.
- [x] Reuse CP3 snapshot logic and CP2 validation core.
- [x] Verify missing OAuth JSON returns a clear API error.
- [ ] User downloads OAuth Desktop client JSON from Google Cloud and saves it
  to `secrets/google_oauth_client.json`.
- [ ] Run first real private Google Sheet snapshot from the UI.

## Dev server workflow - 2026-07-01

- [x] Add `webapp/dev_server.py`.
- [x] Dev command is now `python webapp\dev_server.py`.
- [x] The dev server starts `webapp/app.py` and auto-restarts it when files
  under `webapp/`, `scripts/` or `docs/schema_contract.v1.json` change.
- [x] Document the workflow in `webapp/README.md`.
- [ ] During active UI/backend development, prefer `python webapp\dev_server.py`
  over manually rerunning `python webapp\app.py`.

## CP5 file upload workflow - 2026-07-01

- [x] Replace the CSV/XLSX path textbox with a file picker and drag-drop zone.
- [x] Support selecting multiple files and removing individual selections.
- [x] Upload local files to a temporary request folder for validation.
- [x] Remove each temporary request folder after validation.
- [x] Keep Google Sheet URL/ID controls unchanged.
- [x] Close XLSX workbook handles after reading.
- [x] Add upload regression tests for XLSX and CSV Case.
- [x] Verify responsive upload layout in the in-app browser.
- [ ] User tests one real CSV or XLSX export through the picker.
- [ ] After CP5 user acceptance, continue OAuth testing or connect APKG build.

## CP1 XLSX compatibility repair - 2026-07-01

- [x] Identify the root cause: Microsoft Excel forbids `:` in sheet names.
- [x] Replace the conflicting "verbatim XLSX flat deck" rule with the locked
  Sheet/XLSX mapping rule: ` > ` in a tab name maps to Anki `::`.
- [x] Update validation core and Google Sheet snapshot path to apply the same
  tab-name-to-deck mapping.
- [x] Replace the invalid nested-deck XLSX fixture with Excel-valid tab names:
  `0 Nhi > Hô hấp`, `0 Nội > Tim mạch > Ôn tập`, `0 Nhi > Case cấp cứu`.
- [x] Regenerate CP2 valid/csv/duplicate fixture reports after the mapping fix.
- [x] User opened the replacement fixture in Microsoft Excel and confirmed there
  is no recovery prompt.
- [x] Verification passed:
  `python -m unittest tests.test_import_validate_core tests.test_google_sheets_snapshot tests.test_webapp_upload tests.test_build_apkg_from_report`
  with 16 tests.

## CP5/CP4 web build endpoint - 2026-07-01

- [x] Refactored `webapp/app.py` build logic into `build_apkg_payload()` so it
  can be tested directly.
- [x] Added regression tests that a validated XLSX upload can build one selected
  source into APKG and that missing build sessions are rejected.
- [x] Verification passed:
  `python -m unittest tests.test_webapp_upload tests.test_build_apkg_from_report tests.test_import_validate_core tests.test_google_sheets_snapshot`
  with 18 tests.
- [x] Fixed upload picker friction: after removing a selected file, choosing the
  same file again triggers validation normally.
- [x] Fixed Drive image rendering in generated APKG templates: MCQ/Case
  front/back now inject `Auto-image-link-renderer`, and the renderer reruns on
  each Anki card side.
- [x] Added multi-source web build regression: validated XLSX upload can build
  all selected sources into one APKG with 9 notes, 3 decks and 2 note models.
- [x] Added APKG integrity regression that generated models include the Drive
  thumbnail renderer and no unresolved `{{AnkiAutoImageLinkRenderer}}`
  placeholder.
- [x] Built CP5 fixture APKG evidence:
  `output/apkg/CP5_fixture_all_sources.apkg`
  - 9 notes / 9 cards
  - decks: `0 Nhi::Hô hấp`, `0 Nội::Tim mạch::Ôn tập`,
    `0 Nhi::Case cấp cứu`
  - types: 4 MCQ, 5 Case
  - SQLite integrity: `ok`
- [x] Verification passed:
  `python -m unittest tests.test_webapp_upload tests.test_build_apkg_from_report tests.test_import_validate_core tests.test_google_sheets_snapshot`
  with 20 tests.
- [x] User tested the latest web-built APKG after the upload-picker and Drive
  image fixes and confirmed it is OK.

## Future standalone web app idea - 2026-07-01

- [x] Captured the no-Python/browser-only direction in
  `docs/STANDALONE_WEB_APP_IDEA.md`.
- [ ] Do not start this migration until the Python-backed local workflow passes
  CP5/CP6 and CP7 manual Anki acceptance.

## CP7 Anki functional acceptance - 2026-07-01

- [x] Created the manual CP7 checklist:
  `docs/CP7_ANKI_FUNCTIONAL_ACCEPTANCE.md`.
- [ ] User tests the latest web-built APKG or
  `output/apkg/CP5_fixture_all_sources.apkg` in an Anki test profile.
- [ ] Record PASS/FAIL for sections A through J.
- [ ] Fix any CP7 BLOCKER/MAJOR template issue before CP8.

## Google Sheet review-tab source rule - 2026-07-02

- [x] Treat `Anki Export` / `Anki Export Case` as old CSV compatibility outputs,
  not the preferred APKG source.
- [x] Ignore `Anki Export` / `Anki Export Case` by default in direct APKG mode.
- [x] Prefer real review/data tabs whose names are deck paths, e.g.
  `0 Nhi > Case` -> `0 Nhi::Case`.
- [x] Detect MCQ/Case from schema, not from sheet name.
- [x] If `Status` exists, only `Approved` rows are eligible.
- [x] If `Status` is absent, allow build only with a visible warning:
  `Sheet chua co cot Status, du lieu co the chua duoc kiem tra. Ban chac chan muon build?`
- [ ] Update Google Sheet UI/backend to support this review-tab workflow.
- [x] Add a build confirmation when selected sources lack `Status`.
- [x] Downgrade missing CardUID to warning with generated `auto_...` fallback
  for test builds; keep CP8 CardUID stability as a future hardening gate.
- [x] Run direct snapshot against the real Google Sheet and confirm
  `Anki Export` / `Anki Export Case` are no longer fetched by default.
- [x] Build `output/apkg/CP3_review_toan_direct_tabs_test.apkg` from the direct
  snapshot: 827 notes, 2 decks, SQLite integrity `ok`.
- [x] Escape loose medical `<` and `>` comparison signs before APKG packaging.
- [x] Add `scripts/check_html_angle_safety.py` to audit loose `<`/`>` medical
  comparison signs and write optional JSON evidence.
- [x] Create replacement Apps Script at
  `apps_script/sheet_to_anki_apps_script.gs` with CardUID generation in Source,
  fixed Vietnamese labels and the old CSV/export helpers preserved.
- [x] Harden Apps Script CardUID generation so it checks existing IDs across
  both `Review` and `Review Case`, retries on generated collisions, and never
  overwrites existing CardUIDs.
- [x] Add Apps Script menu action `Kiểm tra trùng CardUID` for manual duplicate
  audits before export/build.
- [x] Add Apps Script active-sheet workflow:
  `Quét sheet hiện tại`, `Validate sheet hiện tại`, and
  `Tạo CardUID sheet hiện tại`.
- [x] Make Apps Script detect MCQ/Case from headers, so tab names can remain
  deck paths such as `Review > Test` or `0 Nhi > Hô hấp`.
- [x] Make active-sheet CardUID generation require `Status` and affect only
  `Approved` rows.
- [x] Replace active-sheet validation popup with a sidebar containing
  clickable cell links for manual-fix errors.
- [x] Group bulk missing-CardUID warnings in the validation dialog instead of
  listing every row as a clickable issue.
- [x] Fix Apps Script validation so `0`/`0%` values are considered real cell
  content, not blank answers.
- [x] Add `Reload` to the Apps Script validation sidebar so the user can fix
  cells and refresh the remaining error count without reopening the menu.
- [x] Fix validation sidebar Vietnamese mojibake by replacing UI labels with
  Unicode-escaped strings.
- [x] CP9: hide ignored/empty sources from the web app's source table and build
  selection while retaining them under `ignoredSources` in the report payload.
- [x] CP9: skip blank Google Sheet tabs before validation so empty tabs such as
  `Sheet2` do not appear as Unknown/0-row build sources.
- [x] CP9.1: add `/api/version`, bottom version pill and topbar About button
  so stale frontend/backend/report state can be checked from the web UI.
- [x] Google Sheet source rule: only tabs with full MCQ/Case schema and a
  `Status` column are accepted into validation/build; draft/non-Anki tabs such
  as `Sheet2` are skipped even if they contain stray cells.
- [x] CP11: add an in-app `Hướng dẫn` handbook section for the daily
  Sheet-to-Anki workflow, validation rules, build/import steps and common
  errors.
- [x] Create `docs/ONLINE_CLIENT_SIDE_BUILD_PLAN.md` as a separate sandbox
  plan for a future browser-only/static APKG builder. Keep the current Python
  local builder as the stable workflow.
- [x] Create `online_builder_reference_snapshot/` with isolated copies of the
  current docs/contracts/templates/reference scripts/static UI for future
  online-builder work, excluding real data and secrets.
- [x] Add detailed online-builder blueprint and template reference index inside
  the snapshot so future implementation can follow CP12-CP18 without touching
  the stable Python workflow.
- [x] Clarify online-builder plan so `Sheet2`/draft-tab problems are handled
  as schema/status source-filtering logic, not layout redesign work.
- [x] Record online-builder versioning rule: CP12 = `v2.0.0`, CP13 =
  `v2.0.1`, later checkpoints follow semantic versioning.
- [x] Create `docs/NEXT_SESSION_HANDOFF.md` with a ready-to-paste prompt and
  detailed next-session instructions for CP12/v2.0.0.

## CP12 online-builder contract freeze - 2026-07-02

- [x] Create isolated `online_builder/` sandbox for the online/static builder
  line.
- [x] Keep stable Python local workflow untouched.
- [x] Add `v2.0.0 / CP12` version metadata.
- [x] Add JS schema constants matching the current MCQ and MCQ Case contract.
- [x] Copy current MCQ/Case template references into
  `online_builder/src/templates/`.
- [x] Add mini fixtures without real data or secrets.
- [x] Add source-filtering decision table for visible, ignored, warning-only
  and blocker outcomes.
- [x] Add and run CP12 contract check:
  `node online_builder/tests/cp12-contract-check.mjs`.
- [x] CP13: implement browser/Node validation and source-filtering core
  (`v2.0.1`).
- [x] CP13: keep `Sheet2`/draft tabs out of visible buildable sources.
- [x] CP13/CP17: ignore Google Sheet tabs with full schema but missing `Status`;
  they do not become buildable sources or visible blockers.
- [x] CP13: block partial Anki-like schemas.
- [x] CP13: keep CSV sources without `Status` as warning-only.
- [x] CP13: add CardUID extraction and duplicate CardUID blocker detection.
- [x] CP13: add loose medical comparison sign warning.
- [x] CP13: run `npm test` in `online_builder/`.
- [x] Record online UI decision: use the stable Python web UI snapshot as the
  starting point; do not redesign layout to fix filtering.
- [x] CP14: start minimal APKG builder investigation without replacing the
  stable Python workflow.
- [x] CP14: add deterministic build-plan adapter for deck/model/note specs.
- [x] CP14: mirror stable Python model IDs, model names and deck namespace.
- [x] CP14: document backend decision and tester gate.
- [x] CP14: choose/wire real APKG backend (`sql.js + JSZip`) behind a
  test-only fixture script.
- [x] User test: run `npm run build:cp14-fixture` in `online_builder/`.
- [x] User test: import CP14 test-only APKG into a clean Anki test profile.
- [x] CP15: connect public Google Sheet URL, CSV/XLSX adapters, validation and
  in-memory APKG packaging.
- [x] CP15: user ran `npm run check:cp15` successfully.
- [x] CP16: integrate browser pipeline into Python UI snapshot without UI
  redesign.
- [x] CP16: replace `/api/*` calls with browser-only validation/build flow.
- [x] CP16: fix noisy medical `<` / `>` warning behavior so ordinary
  comparison signs are not reported in bulk.
- [x] CP16: run `npm test` and `npm run build` in `online_builder/`.
- [x] CP16: release online-builder metadata as `v2.3.0 / CP16`.

## CP17 online-builder release hardening - 2026-07-02

- [x] Verify `dist/` can be previewed as a static site with relative assets.
- [x] Confirm About/version shows current metadata in the UI.
- [x] Document local preview and deploy commands for the online builder.
- [x] Review dependency audit and bundle-size warnings without force-fixing.
- [x] Fix Build APKG gating so blockers are evaluated only for selected
  sources.
- [x] Fix browser packaging pipeline so it validates/builds only selected
  sources.
- [x] Release online-builder metadata as `v2.3.2 / CP17`.
- [x] User manual test passed: UI version, Google Sheet validation, APKG build
  and Anki import.
- [x] Prepare deploy-ready local artifact.
- [x] Deploy CP17 to Cloudflare Pages after explicit user confirmation.
- [x] Verify production alias returns HTTP 200:
  `https://sheet-to-anki-online-builder.pages.dev`.

## CP18 online-builder Python regression guard - 2026-07-03

- [x] Add JS APKG regression check against stable Python builder invariants.
- [x] Verify note/card count and deck tree.
- [x] Verify deterministic deck IDs against Python `stable_int`.
- [x] Verify model IDs, model names and field order.
- [x] Verify JS CardUID GUIDs match Python `genanki.guid_for`.
- [x] Verify editing content while keeping CardUID preserves note GUID.
- [x] Inspect generated APKG for `collection.anki2`, `media` and SQLite
  integrity `ok`.
- [x] Add `npm run check:cp18`.
- [x] Release online-builder metadata as `v2.3.3 / CP18`.
- [x] Run `npm run check:cp18`, `npm test` and `npm run build` in
  `online_builder/`.
- [ ] User/Anki smoke test before CP18 deployment, only if promoting beyond
  local QA.

## CP19 online-builder contribution/contact page - 2026-07-03

- [x] Rename displayed brand to `SheetToAnki`.
- [x] Add sidebar `Đóng góp` item.
- [x] Add contribution/contact page with Google Form link.
- [x] Add Facebook contact link.
- [x] Add optional coffee-support QR.
- [x] Keep browser-only behavior; no hidden telemetry or workbook collection.
- [x] Release local metadata as `v2.4.0 / CP19`.
- [x] Run `npm test` and `npm run build` in `online_builder/`.
- [x] User manual test: version, sidebar `Đóng góp`, Google Form, Facebook,
  coffee-support QR, quick validate/build smoke path.
