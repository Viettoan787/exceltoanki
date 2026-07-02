# SPEC.md — Pipeline PDF 2 cột → Markdown/JSON → CSV Anki

## 1. Mục tiêu

Xây dựng một quy trình bán tự động để chuyển file PDF chứa câu hỏi trắc nghiệm thành file CSV có thể copy vào Google Sheets và import vào Anki.

Tài liệu PDF có thể rất dài, ví dụ 800 trang, và thường có dạng layout 2 cột/bảng:

- Cột trái: tình huống, bệnh án, câu hỏi, đáp án lựa chọn.
- Cột phải: đáp án đúng và giải thích.

Quy trình phải ưu tiên:

- Không bỏ sót câu hỏi.
- Không trộn đáp án/giải thích của case này sang case khác.
- Có trạng thái kiểm tra: `Pending`, `Approved`, `Needs review`.
- Có file debug để người dùng kiểm tra các trang bị tách cột lỗi.
- Xuất CSV đúng cấu trúc Anki.

## 2. Không dùng hướng PDF → Word làm pipeline chính

Đã thử chuyển PDF sang Word nhưng bảng bị lỗi, nên không chọn hướng Word.

Pipeline chính dùng:

```text
PDF gốc
→ PyMuPDF tách cột trái/phải theo layout động
→ all_left.md / all_right.md
→ AI Agent chia case và answer block
→ match case với answer block
→ clean.md / clean.json
→ CSV Pending
→ AI 2 hoặc script checker kiểm tra
→ CSV Approved / Needs review
```

## 3. Nguyên tắc xử lý PDF lớn

Với file khoảng 800 trang:

- Không chạy toàn bộ ngay từ đầu.
- Trước tiên tách thử 20 trang để test thuật toán tách cột.
- Nếu test ổn, tách PDF thành các file nhỏ, khuyến nghị 50 trang/file.
- Mỗi part xử lý độc lập để dễ debug và chạy lại khi lỗi.

Cấu trúc thư mục đề xuất:

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

## 4. Bước PyMuPDF: tách cột động

Script không được chia cột bằng tọa độ cố định kiểu 60/40.

Yêu cầu script PyMuPDF:

1. Đọc từng trang PDF.
2. Lấy text block kèm tọa độ.
3. Đọc thêm vector/line nếu PDF có đường kẻ bảng.
4. Tự phát hiện ranh giới cột theo từng trang bằng:
   - đường kẻ dọc nếu có;
   - khoảng trống lớn giữa các text block nếu không có đường kẻ;
   - từ khóa `Đáp án`, `Giải thích` nếu vẫn chưa chắc.
5. Text bên trái ranh giới → question column.
6. Text bên phải ranh giới → answer column.
7. Nếu độ tin cậy thấp, đánh dấu `REVIEW_REQUIRED`.

Output bắt buộc:

```text
all_left.md
all_right.md
debug_preview.md
debug_layout.json
```

`debug_preview.md` phải có format dễ kiểm tra:

```markdown
## Page 12
Split_x: 475
Confidence: high

### QUESTION
...

### ANSWER
...
```

Nếu trang nghi ngờ:

```markdown
## Page 37
Split_x: unknown
Confidence: low
REVIEW_REQUIRED

### QUESTION
...

### ANSWER
...
```

## 5. Bước AI Agent 1: chia case và answer block

AI Agent 1 nhận:

```text
all_left.md
all_right.md
```

Nhiệm vụ:

1. Chia `all_left.md` thành từng case/câu hỏi.
2. Chia `all_right.md` thành từng answer block.
3. Ghép `Case 1` với `Answer block 1`, `Case 2` với `Answer block 2`, v.v.
4. Không được tự ý bỏ câu.
5. Nếu số câu hỏi và số đáp án không khớp, đánh dấu `Needs review`.
6. Nếu không chắc case nào khớp với answer block nào, đánh dấu `Needs review`.

Output khuyến nghị:

```text
cases_left.md
answers_right.md
clean.md
clean.json
```

Nên có JSON trung gian để script checker dễ kiểm tra.

## 6. Bước checker

Checker có thể là script Python hoặc AI Agent 2.

Nhiệm vụ kiểm tra:

- Số câu hỏi trong case có khớp số đáp án không.
- Mỗi câu có đủ lựa chọn A/B/C/D không.
- Nếu có E thì ghi vào cột E; nếu không có E thì để trống.
- Đáp án đúng chỉ được là A, B, C, D hoặc E.
- Không có chữ `A.`, `B.`, `C.`, `D.` trong nội dung đáp án.
- Không có dòng `Đáp án: ...` bị ghi nhầm vào cột Ex.
- Không có HTML bị escape sai kiểu `&lt;sub&gt;`.
- Không dùng ký tự subscript/superscript Unicode như `H₂O`, `V₀`, `Ca²⁺`.
- Nếu nghi ngờ, giữ status là `Needs review`.

## 7. Cấu trúc dữ liệu Review và CSV Anki

Bảng Review nội bộ có các cột:

```text
Status | Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags
```

CSV/APKG cuối đưa vào Anki phải bỏ hoàn toàn `Status` và chỉ còn:

```text
Ques | A | B | C | D | E | Ans | Ex | Source | Note | Image | Tags
```

Nếu nguồn bất kỳ có cột `Status`, chỉ giữ dòng `Approved` rồi xóa cột này.
Nếu nguồn không có `Status`, xử lý toàn bộ dòng có dữ liệu nhưng phải cảnh báo trước khi build:
`Sheet chưa có cột Status, dữ liệu có thể chưa được kiểm tra. Bạn chắc chắn muốn build?`
`Status` không bao giờ đi vào
field, tag, Source, APKG hoặc dữ liệu đề thi.

## 8. Quy tắc điền từng cột

### 8.1. Status

Mặc định theo giai đoạn:

- Sau convert lần đầu: `Pending`.
- Sau khi AI 2/script checker xác nhận ổn: `Approved`.
- Nếu có lỗi hoặc nghi ngờ: `Needs review`.

Khi người dùng yêu cầu xuất bản cuối cùng theo chuẩn import Anki, các câu đã kiểm tra đạt yêu cầu phải là:

```text
Approved
```

### 8.2. Ques

- Chỉ ghi nội dung câu hỏi.
- Không ghi `Chương 1 Câu ...` vào câu hỏi.
- Nếu PDF có câu như `Chương 1 Câu 36`, chỉ lấy phần câu hỏi thật sự.
- Nếu câu hỏi xuống dòng trong PDF, nối lại thành câu hoàn chỉnh.

### 8.3. A, B, C, D, E

- Điền các lựa chọn tương ứng.
- Nếu chỉ có 4 đáp án A-D thì cột E để trống.
- Không ghi chữ `A.`, `B.`, `C.`, `D.`, `E.` vào trong ô đáp án.
- Chỉ ghi nội dung đáp án.

### 8.4. Ans

- Chỉ ghi chữ cái đáp án đúng.
- Giá trị hợp lệ: `A`, `B`, `C`, `D`, `E`.

### 8.5. Ex

- Ghi phần giải thích.
- Không ghi lại dòng `Đáp án: ...` trong phần giải thích.
- Nếu có công thức hóa học, ký hiệu chỉ số dưới/số mũ thì dùng HTML thô.

Ví dụ đúng:

```html
V<sub>0</sub>
H<sub>2</sub>O
CO<sub>2</sub>
Ca<sup>2+</sup>
NAD<sup>+</sup>
FADH<sub>2</sub>
```

Ví dụ sai:

```text
V₀
H₂O
Ca²⁺
V&lt;sub&gt;0&lt;/sub&gt;
```

Không dùng LaTeX.

### 8.6. Source

- Ghi nguồn trong PDF.
- Ví dụ:
  - `1. Enzyme.pdf`
  - `Lippincott Ch.5`
  - `BRS Ch.2`
- Nếu có nhiều nguồn thì ngăn cách bằng dấu chấm phẩy.

### 8.7. Note

- Để trống nếu không có ghi chú đặc biệt.
- Nếu lỗi hoặc nghi ngờ, ghi lý do review.

Ví dụ:

```text
Needs review: số đáp án không khớp số câu hỏi
```

### 8.8. Image

- Để trống, trừ khi người dùng cung cấp link ảnh riêng.

### 8.9. Tags

- Ghi tag ngắn, không dấu hoặc có dấu đều được.
- Với file enzyme, tag chính là:

```text
enzyme
```

Có thể thêm tag phụ:

```text
enzyme; coenzyme
enzyme; dong_hoc
enzyme; uc_che_enzyme
enzyme; isoenzyme
```

## 9. Yêu cầu output cho người dùng

Khi người dùng yêu cầu output dạng bảng để copy vào Google Sheets:

- Xuất thành bảng Markdown.
- Mỗi hàng là một câu hỏi.
- Không thêm giải thích ngoài bảng.
- Không bỏ sót câu.
- Giữ nguyên HTML thô, không render thành ký tự nhỏ.

Khi người dùng yêu cầu file:

- Xuất file `.csv` là mặc định.
- Có thể xuất thêm `.md` hoặc `.json` để kiểm tra nếu cần.

## 10. Ưu tiên triển khai

Thứ tự nên làm:

1. Tạo folder dự án.
2. Script tách PDF thành test 20 trang và part 50 trang.
3. Script PyMuPDF tách left/right động.
4. Xuất debug files.
5. Test với 20 trang.
6. Nếu ổn, chạy từng part 50 trang.
7. AI Agent chia case và answer block.
8. Match case-answer.
9. Xuất clean.json/clean.md.
10. Xuất CSV Pending.
11. Checker xác nhận và đổi sang Approved hoặc Needs review.

---

## 11. Bổ sung quyết định kỹ thuật sau test thực tế

### 11.1. Trạng thái record

Pipeline dùng 4 trạng thái:

```text
Pending
Needs review
Approved
Rejected
```

- `Pending`: ghép tự động, chưa thấy lỗi rõ, nhưng chưa được xác nhận.
- `Needs review`: có dấu hiệu lệch/thiếu/nghi ngờ, cần AI hoặc người kiểm tra.
- `Approved`: đã được checker/AI/người xác nhận, có thể đưa vào CSV cuối.
- `Rejected`: không dùng cho CSV, nhưng vẫn giữ trong file audit để truy vết.

Không được coi `Pending` là đúng tuyệt đối. Chỉ `Approved` mới là trạng thái cuối an toàn.

### 11.2. Chia PDF có overlap

Ngoài chia part 50 trang thông thường, script phải hỗ trợ overlap để tránh case/answer bị cắt ở ranh giới part.

Quy tắc mặc định mới: chia part 50 trang nhưng thêm overlap 2 trang theo dạng cửa sổ 51 trang, để ranh giới luôn được bù bởi part sau.

Ví dụ:

```text
part_001_pages_001_051_ov002.pdf
part_002_pages_050_101_ov002.pdf
part_003_pages_100_151_ov002.pdf
```

Nghĩa là part sau lùi lại 2 trang so với ranh giới cũ. Cách này giúp giảm lỗi case/answer bị cắt mất ở cuối part, ví dụ case bắt đầu page 50 nhưng answer hoặc câu 4-5 nằm page 51.

Khi ghép cuối:

- So sánh cuối part trước với đầu part sau.
- Nếu trùng do overlap, giữ bản đầy đủ hơn.
- Bản dư/cắt cụt đánh dấu `Rejected: duplicate from overlap`.

### 11.3. Lọc footer/header và nội dung ngoài bảng

Extractor phải loại bỏ footer/header không thuộc bảng câu hỏi/đáp án, bao gồm:

```text
1. Tiêu hóa Page 5
1. Tiêu hóa
2. Chấn thương chỉnh hình
3. Thận tiết niệu
4. Tim mạch lồng ngực
5. Thần kinh
6. Nhi
1. Đại cương
```

Nội dung ngoài bảng như tiêu đề, tóm tắt đầu trang, chapter title không được đi vào `CASE`, `ANSWER BLOCK`, `clean.md`, hoặc CSV.

### 11.4. Kiểm tra lệch case-answer

Không chỉ ghép theo thứ tự. Phải kiểm tra thêm:

- Số câu hỏi so với số đáp án.
- Trang nguồn của case và answer.
- Độ khớp từ khóa/ngữ nghĩa giữa case và answer.
- Vùng ranh giới part và vùng overlap.

Nếu nghi ngờ, chuyển sang `Needs review`.

### 11.5. Dùng Antigravity/AI Agent

AI Agent không nên đọc toàn bộ PDF 500-800 trang một lần. Thay vào đó tạo batch nhỏ cho các record `Needs review` hoặc `Pending` rủi ro cao:

```text
CASE
CURRENT ANSWER
CANDIDATE ANSWER -2
CANDIDATE ANSWER -1
CANDIDATE ANSWER 0
CANDIDATE ANSWER +1
CANDIDATE ANSWER +2
```

AI trả JSON:

```json
{
  "match_id": "...",
  "best_candidate": "-2|-1|0|+1|+2|none",
  "confidence": "high|medium|low",
  "reason": "..."
}
```

Chỉ tự động sửa khi confidence cao. Nếu không chắc, giữ `Needs review`.

### 11.6. Lỗi dính chữ

Cần thêm bước normalize text có kiểm soát cho lỗi mất khoảng trắng như:

```text
tiền sửmổviêm
thểtrạng
hạsườn
ổbụng
tếbào
```

Không thêm khoảng trắng bừa để tránh làm hỏng `SpO2`, `mmHg`, `H2O`, `CO2`, `Beta-hCG`.

### 11.7. Anki template va APKG

Thu muc `Anki_template/` la nguon chinh cho note type:

- `MCQ-Case`: front/back/style cho case 5 cau.
- `MCQ-NonCase`: front/back/style cho cau hoi don.

Template phai ho tro render link anh tho thanh anh khi review card, toi thieu:

```text
https://drive.google.com/uc?id=FILE_ID
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/open?id=FILE_ID
https://.../image.png
FILE_ID
```

APKG duoc tao bang:

```powershell
python scripts\build_apkg.py --type case --deck "Nhi::Case" --input <csv> --out <file.apkg>
python scripts\build_apkg.py --type normal --deck "Nhi::MCQ" --input <csv> --out <file.apkg>
```

`build_apkg.py` phai:

- Doc CSV UTF-8/UTF-8-SIG.
- Tu detect `case`/`normal` neu `--type auto`.
- Neu co cot `Status`, loc `Approved` roi xoa hoan toan cot `Status`.
- Dung CardUID nhung trong `Source` lam GUID on dinh; khong dung noi dung cau hoi lam danh tinh lau dai.
- Giu link anh Drive/ShareX trong field; template chiu trach nhiem render thumbnail.

### 11.8. Cong thuc y khoa va hoa hoc

Template hien hanh la V10 HTMLChem. Khong yeu cau MathJax hoac `mhchem`.

- Chi so duoi dung `<sub>`.
- So mu dung `<sup>`.
- Bao toan/chuan hoa an toan cac mui ten `->` thanh `→`, `=>` thanh `⇒`,
  `<->` thanh `↔`, va phan ung thuan nghich `⇌`.
- Khong chuan hoa ben trong URL hoac the HTML.
## Authoritative data-source and deck contract - 2026-07-01

The authoritative rules for Status filtering, schema-based MCQ/Case detection,
sheet-to-deck mapping, single-answer policy, HTMLChem, CardUID-in-Source and
duplicate/update safety are in:

```text
docs/DATA_SOURCE_AND_DECK_RULES.md
```

The sections above have been updated to match this contract. MathJax/mhchem is
not required and `Status` must never be exported into Anki.

### 11.9. Spreadsheet-first local web app

- Primary input is a normal private Google Spreadsheet URL.
- The local Python app uses installed-app OAuth with read-only Sheets permission.
- It scans every tab, filters Approved when Status exists, removes Status,
  detects MCQ/Case from schema, and maps tab names to deck paths. Use ` > ` in
  Sheet/XLSX tab names for Anki subdecks, for example
  `0 Nhi > Ho hap` -> `0 Nhi::Ho hap`.
- Selected tabs are fetched into one immutable snapshot before validation/build.
- CSV/XLSX and published links are fallbacks, not the primary workflow.
