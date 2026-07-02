# error_playbook.md - Các loại lỗi thường gặp và cách xử lý

Tài liệu này dùng để nhận diện nhanh lỗi trong pipeline PDF -> clean JSON/MD -> CSV Anki.

## 1. Lệch đáp án theo offset cục bộ

### Dấu hiệu

```text
CASE nói một bệnh/chủ đề, ANSWER BLOCK nói chủ đề khác.
Nhiều match liên tiếp bị lệch cùng offset, ví dụ -2 hoặc -3.
Validator có thể chỉ báo Low overlap, nhưng cũng có thể bỏ sót nếu cùng chủ đề.
```

### Ví dụ đã gặp

```text
part_008_pages_351_400: cụm match_048 -> match_083
```

### Cách xử lý

1. Không sửa từng dòng bằng cảm tính.
2. Chạy report candidate:

```bat
python scripts\report_answer_offset_candidates.py --clean-json output\clean\PART_clean.json --answers-json output\answers\PART_answers_right.json --out-dir output\ai_review --window 5 --status "Needs review"
```

3. Kiểm tra bằng mắt các candidate quanh match nghi lỗi.
4. Nếu offset rõ và nhiều case liên tiếp, tạo file review JSON thủ công trong `output/ai_review`.
5. Apply bằng:

```bat
python scripts\apply_antigravity_review.py --result output\ai_review\manual_xxx.json --clean-dir output\clean --answers-dir output\answers --audit output\ai_review\manual_xxx_audit.json
```

### Lưu ý

`Pending` không bảo đảm đúng. Part 008 đã có nhiều record `Pending` nhưng vẫn lệch answer.

## 2. Answer/giải thích lọt vào CASE do cột đáp án quá hẹp

### Dấu hiệu

```text
CASE có đủ 5 câu hỏi thật, nhưng parser đếm thành 7, 8, 12, 14 câu.
Trong CASE xuất hiện các đoạn giải thích như "3. Với ung thư...", "4. Mổ cấp cứu..."
Ảnh/PDF cho thấy cột answer bên phải rất hẹp, text xuống dòng nhiều.
```

### Ví dụ đã gặp

```text
part_002_pages_051_100:
match_018, match_019, match_021, match_023, match_026, match_029,
match_037, match_038, match_040, match_042
```

### Cách xử lý

1. Re-extract part bằng PyMuPDF `--word-split`:

```bat
python scripts\pdf_extract_left_right.py parts\PART.pdf --out output_debug\word_split_PART\left_right --word-split
```

2. Re-parse/re-match vào debug:

```bat
python scripts\parse_cases_answers.py --left-right-dir output_debug\word_split_PART\left_right --part PART --cases-out output_debug\word_split_PART_v2\cases --answers-out output_debug\word_split_PART_v2\answers
python scripts\match_cases_answers.py --cases-dir output_debug\word_split_PART_v2\cases --answers-dir output_debug\word_split_PART_v2\answers --out output_debug\word_split_PART_v2\clean --part PART
python scripts\validate_clean_matches.py --clean-dir output_debug\word_split_PART_v2\clean
```

3. Nếu kết quả tốt hơn, backup output cũ rồi copy bản mới vào `output`.
4. Với các record chỉ còn page-gap nhưng nội dung đúng rõ, tạo high-confidence override.

### Lưu ý

Parser hiện đã được cải tiến: chỉ đếm một câu hỏi hợp lệ khi đoạn đó có đủ option A-D. Điều này giảm lỗi đếm nhầm các dòng giải thích.

## 3. Case/answer bị cắt ở ranh giới part

### Dấu hiệu

```text
Record cuối part có question_count < answer_count.
Case dừng giữa chừng ở cuối page 50/100/150...
Answer hoặc phần sau case nằm ở part kế tiếp.
```

### Ví dụ đã gặp

```text
part_002_pages_051_100_match_044
Case/answer vỡ lách thì 2 trải qua PDF pages 100-102.
```

### Cách xử lý

1. Kiểm tra part overlap tương ứng:

```text
parts_overlap_2p/part_003_pages_099_150_ov002.pdf
output_overlap/left_right/part_003_pages_099_150_ov002_all_left.md
output_overlap/left_right/part_003_pages_099_150_ov002_all_right.md
```

2. Nếu overlap chứa đủ case/answer, vá record bị cắt trong:

```text
output/cases/PART_cases_left.json/md
output/answers/PART_answers_right.json/md
output/clean/PART_clean.json/md
```

3. Ghi note rõ:

```text
Manual overlap repair from part_xxx_ov002 because this case/answer spans original PDF pages ...
```

4. Validate lại toàn bộ.

## 4. Thiếu answer thật sự

### Dấu hiệu

```text
CASE có chủ đề rõ nhưng không candidate answer lân cận nào khớp.
Tìm trong answers JSON bằng keyword không thấy answer tương ứng.
AI/reviewer chọn none high confidence.
```

### Ví dụ đã gặp

```text
part_008_pages_351_400_match_063:
BPH tuyến tiền liệt lớn/Open Prostatectomy/HoLEP không có answer tương ứng.
```

### Cách xử lý

1. Tìm keyword trong `output/answers` và debug `word_split` nếu có.
2. Nếu không thấy answer tương ứng, chuyển record sang `Rejected`.
3. Không xuất `Rejected` vào CSV.
4. Giữ audit để truy vết.

## 5. Answer block bị dính nhiều block

### Dấu hiệu

```text
ANSWER BLOCK có nhiều đoạn "Giải thích:" hoặc chứa giải thích của case sau.
answer_count có thể vẫn là 5, nhưng nội dung Ex bị dư.
```

### Ví dụ đã gặp

```text
part_008_pages_351_400_match_027
```

### Cách xử lý

1. Kiểm tra bản `--word-split` trong `output_debug`.
2. Nếu answer sạch có trong debug, thay `answer_text`, `answers`, `answer_count` của record clean.
3. Giữ note/audit.
4. Nếu nhiều block bị dính theo cụm, re-extract/re-parse cả part thay vì sửa lẻ.

## 6. Page-gap false positive

### Dấu hiệu

```text
CASE và ANSWER khớp ngữ nghĩa rõ, question_count = answer_count = 5.
Validator chỉ báo "Answer starts before/after case pages".
```

### Ví dụ đã gặp

```text
part_002_pages_051_100_match_026
part_002_pages_051_100_match_036
```

### Cách xử lý

1. Xác nhận bằng mắt rằng CASE/ANSWER đúng.
2. Tạo high-confidence override candidate `0`.
3. Apply override.
4. Validator hiện đã được sửa để high-confidence override không bị page-gap kéo lại về `Needs review`.

## 7. Đếm nhầm câu hỏi do số trong nội dung

### Dấu hiệu

```text
question_count lớn hơn thực tế vì dòng có số như "BMI 22. Khám..." bị hiểu nhầm là câu hỏi 22.
```

### Ví dụ đã gặp

```text
part_008_pages_351_400_match_027
```

### Cách xử lý

Parser đã giới hạn `QUESTION_RE` chỉ nhận số `1-9` ở đầu dòng, giảm lỗi kiểu này.

Nếu gặp biến thể mới:

1. Kiểm tra full `CASE`.
2. Không sửa answer trước khi xác định là lỗi đếm hay lỗi match.
3. Cập nhật parser bằng rule hẹp, không mở rộng bừa.

## 8. Footer/header/chuyên mục lọt vào nội dung

### Dấu hiệu

```text
CASE hoặc ANSWER chứa dòng như:
1. Tiêu hóa Page 5
2. Chấn thương chỉnh hình
3. Thận tiết niệu
4. Tim mạch lồng ngực
5. Thần kinh
6. Nhi
```

### Cách xử lý

Extractor đã có rule lọc footer/header/chuyên mục.

Nếu gặp footer mới:

1. Thêm pattern lọc vào extractor.
2. Re-extract part liên quan.
3. Không sửa thủ công từng record nếu footer lặp hệ thống.

## 9. Lỗi chữ dính do extraction

### Dấu hiệu

```text
tiền sửmổviêm
thểtrạng
hạsườn
ổbụng
tếbào
```

### Cách xử lý

Chưa xử lý triệt để. Cần thêm bước normalize text có kiểm soát.

Nguyên tắc:

- Không thêm khoảng trắng bừa.
- Không làm hỏng `SpO2`, `mmHg`, `H2O`, `CO2`, `Beta-hCG`.
- Nên tạo report token nghi dính chữ trước, rồi bổ sung rule an toàn.

## 10. Quy trình chung khi gặp part lỗi nặng

1. Không xuất CSV từ part đó.
2. Xác định lỗi thuộc nhóm nào:

```text
offset answer
answer lọt vào case
case bị cắt ranh giới part
thiếu answer
answer block dính nhiều block
page-gap false positive
```

3. Nếu lỗi hệ thống, ưu tiên re-extract/re-parse cả part.
4. Nếu lỗi ranh giới, dùng overlap.
5. Nếu lỗi lẻ đã xác minh rõ, tạo manual JSON + audit.
6. Validate lại toàn bộ:

```bat
python scripts\validate_clean_matches.py --clean-dir output\clean
```

7. Cập nhật `docs/project_status.md` và `docs/task.md`.

## 11. Nội dung lý thuyết/NOTE sau case lọt vào CASE

### Dấu hiệu

```text
Một record có question_count rất lớn, ví dụ 64 vs answer_count 5.
Sau đáp án D của câu cuối, file tiếp tục chứa nội dung lý thuyết/NOTE không thuộc bảng.
CASE source_pages trải dài qua rất nhiều trang.
```

### Ví dụ đã gặp

```text
part_012_pages_551_600_match_006
```

### Cách xử lý

1. Xác định điểm kết thúc thật của case: thường ngay sau option D/E của câu cuối.
2. Cắt bỏ phần lý thuyết/NOTE khỏi `case_text`.
3. Cập nhật `question_count`, `option_counts`, `source_pages` nếu cần.
4. Nếu lỗi lặp lại, bổ sung rule parser để dừng case khi gặp tiêu đề NOTE/lý thuyết hoặc khi đã đủ 5 câu hỏi có đủ A-D.

## 12. Case chứa hai bộ câu hỏi liền nhau

### Dấu hiệu

```text
question_count = 10 hoặc bội số của 5.
CASE có hai tình huống/câu hỏi liên tiếp nhưng chỉ có một answer block.
Answer hiện tại chỉ khớp một nửa sau hoặc một nửa trước.
```

### Ví dụ đã gặp

```text
part_004_pages_151_200_match_035
```

### Cách xử lý

1. Không ép record thành Pending nếu answer chỉ khớp 5/10 câu.
2. Kiểm tra xem parser có bỏ sót một case start giữa hai bộ câu hỏi không.
3. Nếu có thể tách, split record thành hai case riêng và match lại answer tương ứng.
4. Nếu không đủ answer cho một nửa, phần thiếu đánh dấu `Needs review` hoặc `Rejected` tùy nội dung.

## 13. Orphan answer cuối part

### Dấu hiệu

```text
Record có case_id = None.
Chỉ có ANSWER BLOCK, thường ở cuối part.
Nội dung answer bắt đầu từ ý 5 hoặc là phần tiếp của answer ở trang trước.
```

### Ví dụ đã gặp

```text
part_010_pages_451_500_match_063
```

### Cách xử lý

1. Kiểm tra các trang cuối part và đầu part kế tiếp/overlap.
2. Nếu đây là phần tiếp của answer trước, ghép vào answer trước.
3. Nếu là duplicate/fragment không dùng được, đánh dấu `Rejected`.
4. Không tạo CSV từ orphan answer.

## 14. Answer header malformed nhưng giải thích đủ

### Dấu hiệu

```text
question_count = 5 nhưng answer_count chỉ là 2-4.
Trong answer_text vẫn có phần "Giải thích:" cho đủ 5 câu.
Dòng "Đáp án:" bị viết dài, lồng ghi chú, hoặc lặp lại "chốt đáp án" khiến parser chỉ bắt được vài cặp số-đáp án.
```

### Ví dụ đã gặp

```text
part_003_pages_101_150_match_046
part_003_pages_101_150_match_049
```

### Cách xử lý

1. Đọc full `answer_text`, không chỉ nhìn `answer_count`.
2. Nếu giải thích đủ và ngữ nghĩa khớp case, có thể manual accept high-confidence.
3. Không tự bịa đáp án 3-5 nếu header không ghi rõ; giữ nguyên `answer_text` làm nguồn chính.
4. Nếu cần CSV chi tiết từng câu sau này, quay lại chuẩn hóa thủ công dòng `Đáp án:` từ nội dung PDF/bảng gốc.
5. Ghi audit vào `output/ai_review/manual_*.json`.

## 15. Case bị chồng: hai case trong một record

### Dấu hiệu

```text
question_count = 10 nhưng answer_count = 5.
Trong CASE có một tình huống mới bắt đầu sau câu 5 của tình huống trước.
Answer block chỉ khớp một trong hai tình huống.
```

### Ví dụ đã gặp

```text
part_004_pages_151_200_match_035
part_011_pages_501_550_match_074
```

### Cách xử lý

1. Đọc answer block để xác định nó khớp case thứ nhất hay case thứ hai.
2. Nếu answer khớp case thứ hai, cắt `case_text` từ đầu case thứ hai.
3. Nếu answer khớp case thứ nhất, cắt bỏ phần case thứ hai khỏi cuối record.
4. Cập nhật `question_count = 5`, `status = Pending`, và ghi manual audit.
5. Nếu cả hai case đều cần giữ, cần split thành hai record riêng rồi match lại answer tương ứng.

## 16. Lý thuyết lọt vào sau câu hỏi

### Dấu hiệu

```text
question_count > 5 nhưng 5 câu hỏi đầu và answer block đã khớp.
Sau option D/E của câu 5 xuất hiện đoạn lý thuyết, checklist, bảng kiến thức, hoặc nguồn "From <...>".
Answer block không có vấn đề.
```

### Ví dụ đã gặp

```text
part_005_pages_201_250_match_007
part_005_pages_201_250_match_027
part_005_pages_201_250_match_057
part_012_pages_551_600_match_006
```

### Cách xử lý

1. Xác định điểm kết thúc thật của câu 5, thường là sau option D/E.
2. Cắt bỏ toàn bộ lý thuyết phía sau khỏi `case_text`.
3. Cập nhật `question_count = 5`, giữ nguyên answer block nếu đã khớp.
4. Ghi manual audit và validate lại.

## 17. Source incomplete: PDF/text layer thiếu câu hỏi

### Dấu hiệu

```text
PDF/markdown chỉ có một phần câu hỏi, ví dụ Q1 với option A-B.
Ngay sau đó đã nhảy sang answer block 1-5.
Overlap, part trước/sau và PyMuPDF raw text đều không có phần Q2-Q5.
```

### Ví dụ đã gặp

```text
part_007_pages_301_350_match_035
```

### Cách xử lý

1. Kiểm tra lại bằng markdown, overlap và PyMuPDF raw text trực tiếp trên `input/source.pdf` hoặc part PDF.
2. Nếu source thật sự thiếu nội dung, không tự dựng câu hỏi còn thiếu từ đáp án/giải thích.
3. Đánh dấu record là `Rejected`, ghi rõ lý do `source incomplete`.
4. Không xuất record này sang CSV tự động.
5. Chỉ phục hồi nếu người dùng cung cấp ảnh/PDF crop có đầy đủ câu hỏi để nhập tay.
