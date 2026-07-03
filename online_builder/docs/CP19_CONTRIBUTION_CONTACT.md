# CP19 Contribution And Contact Page

Checkpoint: `CP19`
Status: accepted and deployed

CP19 adds a transparent contribution/contact page to SheetToAnki. It does not
change validation, APKG build logic, source filtering, OAuth or any data
collection behavior.

Added UI:

- Sidebar item: `Đóng góp`.
- Contribution section with:
  - Google Form link for feedback, bug reports and workflow suggestions;
  - Facebook contact link;
  - optional coffee-support QR.
- Brand display updated from `Sheet-to-Anki` to `SheetToAnki`.

Links:

- Google Form:
  `https://docs.google.com/forms/d/e/1FAIpQLScB0jYl3RleT-mzcaOmddFXKglE6_A-uS4eYUJxZ2O0J1ntbQ/viewform?usp=publish-editor`
- Facebook:
  `https://www.facebook.com/nvtylnbt`
- Coffee support QR asset:
  `online_builder/public/support-qr.png`

Privacy rule:

- The app remains browser-only.
- No hidden telemetry or workbook collection is added.
- Feedback/contact is user-initiated through external links.
- Coffee support is optional and user-initiated through the displayed QR.

Released metadata:

- `v2.4.0 / CP19`
- status: `contribution-contact-page`

Manual tester gate:

- Open local preview and confirm version shows `2.4.0 / CP19`.
- Confirm the sidebar `Đóng góp` link scrolls to the contribution section.
- Confirm Google Form and Facebook buttons open the intended pages.
- Confirm the coffee-support QR is visible and scannable.
- Run one quick validate/build smoke path if CP19 is promoted for deploy.

Deployment evidence:

- GitHub: `https://github.com/Viettoan787/exceltoanki`
- Primary Cloudflare Pages project: `sheettoanki`
- Primary production URL: `https://sheettoanki.pages.dev`
- Primary deployment URL: `https://0a067a6c.sheettoanki.pages.dev`
- Legacy backup project: `sheet-to-anki-online-builder`
- Legacy backup URL: `https://sheet-to-anki-online-builder.pages.dev`
- Primary production alias and deployment URL smoke checks returned HTTP 200.
