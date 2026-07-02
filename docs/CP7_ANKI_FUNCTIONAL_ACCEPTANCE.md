# CP7 Anki Functional Acceptance

Purpose: verify that the generated APKG works inside real Anki, not only that
the APKG file is structurally valid.

Do not use the user's main production deck for this checkpoint. Use a clean test
profile or a disposable test deck.

## Test APKG

Use the latest web-built APKG, or this fixture if a stable reference is needed:

```text
output/apkg/CP5_fixture_all_sources.apkg
```

Expected fixture content:

```text
9 notes / 9 cards
4 MCQ
5 MCQ Case
Decks:
- 0 Nhi::Hô hấp
- 0 Nội::Tim mạch::Ôn tập
- 0 Nhi::Case cấp cứu
```

## Result Format

For each section, mark:

```text
PASS / FAIL / SKIP
```

If a section fails, record:

- Screenshot.
- Deck name.
- CardUID if visible in Source.
- Whether the failure is on Front, Back, Browse, Preview or Edit Current.

## A. Import and Deck Tree

- [ ] Import APKG into a clean/test profile.
- [ ] No import error dialog appears.
- [ ] Deck tree contains `0 Nhi::Hô hấp`.
- [ ] Deck tree contains `0 Nội::Tim mạch::Ôn tập`.
- [ ] Deck tree contains `0 Nhi::Case cấp cứu`.
- [ ] Fixture count is 9 cards total.
- [ ] No unexpected production deck receives fixture cards.

Result:

```text
A Import and Deck Tree:
```

## B. MCQ Front

Open at least two MCQ cards.

- [ ] Question text displays clearly.
- [ ] A/B/C/D and optional E display clearly.
- [ ] Checkbox/option rows are clickable.
- [ ] Vietnamese text is readable.
- [ ] Long lines wrap without overlapping controls.
- [ ] Tags/source footer do not cover content.

Result:

```text
B MCQ Front:
```

## C. MCQ Back

For at least one MCQ, intentionally choose the wrong answer before pressing
`Show answer`. For another MCQ, choose the correct answer.

- [ ] Correct answer is highlighted green.
- [ ] Wrong selected answer is highlighted red.
- [ ] Explanation (`Ex`) is visible.
- [ ] Note (`Note`) section is visible when populated and hidden/quiet when empty.
- [ ] Source link is visible and clickable if present.
- [ ] Tags display without layout break.

Result:

```text
C MCQ Back:
```

## D. MCQ Case Front

Open Case cards that cover one question and multiple questions.

- [ ] `CaseTitle` and `CaseStem` are separated from subquestions.
- [ ] One-question Case displays one subquestion only.
- [ ] Multi-question Case displays all populated questions.
- [ ] Empty question slots are not shown.
- [ ] A/B/C/D options display under the correct question.
- [ ] Selecting answers on multiple subquestions works.

Result:

```text
D MCQ Case Front:
```

## E. MCQ Case Back

For Case cards, choose at least one correct and one incorrect answer before
pressing `Show answer`.

- [ ] Per-question answer checking works.
- [ ] Correct options are green.
- [ ] Incorrect selected options are red.
- [ ] Each explanation (`Ex1`..`Ex5`) appears under the matching question.
- [ ] `case-result` summary does not hide content.
- [ ] Case cards with fewer than five questions do not show blank question blocks.

Result:

```text
E MCQ Case Back:
```

## F. Images and Links

The current fixture contains both real Drive image links and one intentionally
fake `<img>` fixture. A broken image from `https://example.org/...` is acceptable
only for that fake fixture.

- [ ] Real Drive image renders as an image, not as raw URL text.
- [ ] Image does not stretch the card layout.
- [ ] Image zoom/open behavior works if available.
- [ ] Source link opens or copies correctly.
- [ ] Fake image fixture is understood as fixture-only, not production failure.

Result:

```text
F Images and Links:
```

## G. Display Controls

Test both MCQ and Case cards.

- [ ] Font size increase works.
- [ ] Font size decrease works.
- [ ] Font reset works.
- [ ] Dark/light mode toggles correctly.
- [ ] Display settings persist across Front and Back.
- [ ] Display settings do not hide the answer button or options.

Result:

```text
G Display Controls:
```

## H. HTMLChem and Text Rendering

Find cards containing chemistry/html samples in the fixture.

- [ ] `<sub>` renders as subscript.
- [ ] `<sup>` renders as superscript.
- [ ] Reaction arrow `->` or `→` displays correctly.
- [ ] Equilibrium arrow `<=>`, `⇌` or HTML entity displays correctly.
- [ ] Vietnamese accents do not corrupt.
- [ ] Multiline text preserves readable paragraph breaks.

Result:

```text
H HTMLChem and Text Rendering:
```

## I. Browse, Preview and Edit Current

Check at least one MCQ and one Case in Anki Browse/Card Preview/Edit Current.

- [ ] MCQ note type contains exactly:
  `Ques, A, B, C, D, E, Ans, Ex, Source, Note, Image, Tags`.
- [ ] Case note type contains exactly:
  `CaseTitle, CaseStem, Ques1..Ex5, Source, Note, Image, Tags`.
- [ ] `Status` field is absent.
- [ ] Card Preview renders Front and Back.
- [ ] Edit Current does not make the card blank after switching front/back.

Result:

```text
I Browse Preview Edit:
```

## J. Light Re-import Check

This is only a light sanity check. Full identity/update behavior belongs to CP8.

- [ ] Re-import the same APKG into the same test profile.
- [ ] No obvious import crash.
- [ ] No obvious deck routing error.
- [ ] If Anki creates duplicates or asks about updates, record the exact dialog.

Result:

```text
J Light Re-import:
```

## CP7 Pass Rule

CP7 passes when:

- Sections A through I are `PASS`.
- Section J is recorded, even if deeper duplicate/update behavior is deferred to
  CP8.
- Any broken image is confirmed to be only the intentionally fake fixture image.
- No BLOCKER or MAJOR template/rendering issue remains.

Final result:

```text
CP7:
Tester:
Date:
APKG:
Overall: PASS / FAIL
Notes:
```
