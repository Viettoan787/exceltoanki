
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
