# Source Filtering Decision Table

Version: `v2.0.0`
Checkpoint: `CP12`

This table defines CP13 validation behavior. It is logic/core work, not UI
layout work.

| Source kind | Condition | Decision | Severity | Buildable? | Audit output |
| --- | --- | --- | --- | --- | --- |
| Google Sheet tab | Full MCQ schema, `Status` present, at least one real data row | visible | none | yes | `sources[]` |
| Google Sheet tab | Full Case schema, `Status` present, at least one real data row | visible | none | yes | `sources[]` |
| Google Sheet tab | Exact ignored name such as `README` or `CONFIG` | ignored | none | no | `ignoredSources[]` |
| Google Sheet tab | Blank tab or no real data rows | ignored | none | no | `ignoredSources[]` |
| Google Sheet tab | Draft/unknown headers, including `Sheet2`-style tabs | ignored | none | no | `ignoredSources[]` |
| Google Sheet tab | Full MCQ/Case schema but missing `Status` | blocker | blocker | no | `ignoredSources[]` plus blocker |
| Google Sheet tab | Partial MCQ/Case schema with data rows | blocker | blocker | no | `ignoredSources[]` plus blocker |
| CSV/XLSX file | Full MCQ/Case schema with `Status` | visible | none | yes | `sources[]` |
| CSV/XLSX file | Full MCQ/Case schema without `Status` | warning-only | warning | yes, after confirmation | `sources[]` plus warning |
| CSV/XLSX file | Headerless 12-column MCQ or 41-column Case fixture format | warning-only | warning | yes, after schema inference | `sources[]` plus warning |
| Any source | Approved rows normalize to zero eligible rows | ignored | warning | no | `ignoredSources[]` |
| Any source | Duplicate CardUID across visible sources | blocker | blocker | no | `blockers[]` |
| Any source | Loose medical comparison signs such as `<2cm` or `INR > 1.5` | warning-only | warning | yes, after escaping/safety pass | `warnings[]` |

## Public Report Rule

The UI should receive:

- `sources[]`: only visible, buildable sources.
- `ignoredSources[]`: skipped sources and the reason they were skipped.
- `warnings[]`: non-blocking issues that need user awareness.
- `blockers[]`: issues that prevent build.

Unknown or draft tabs must never appear in `sources[]`.
