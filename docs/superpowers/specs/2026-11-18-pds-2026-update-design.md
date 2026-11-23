# PDS update: CS Form 212 Revised 2025 → Revised 2026 — Design

Status: **implemented on branch feature/pds-2026-update, not committed** (see the implementation notes at the end) · Date: 2026-11-18 · Requested by: the ICT head (see `docs/modules/_template.md`)
Chosen approach: **Option 3, match the official 2026 sheet** (picked by the requester).

## 1. Intent

The office must print the Personal Data Sheet on the current CSC form, CS Form No. 212 Revised 2026. Today the PDF says "Revised 2026" but only the labels were changed. The page grid, row counts, paper size, numbering and several fields are still the older layout, and long records are cut off in print. After this work the PDS in the app (entry pages, database, PDF) matches the 2026 workbook, and nothing an employee entered is silently dropped from the printout.

## 2. Sources

| Source | Used for |
|---|---|
| `Files/CS Form No. 212 Revised 2026 Personal Data Sheet PDS.xlsx` (11 sheets, C1–C11) | **Authoritative** for layout, labels, numbering, row counts, paper size (A4 portrait, `paperSize=9`), checkbox sets |
| Guide to Filling Up the PDS, Revised 2026 | Field rules (formats, examples). Text was extracted before the file in `Files/` was overwritten with a printout of the workbook. |
| `Files/…PDS.pdf` | One page only (page 3). Used to cross-check, not as a full reference. |

Where the Guide and the workbook disagree, **the workbook wins** (the Guide lists Voluntary Work before L&D and names different continuation sheets than the workbook).

## 3. Goals, non-goals, anti-goals

**Goals**
- The PDF follows the 2026 workbook: A4, section numbering and order, captions, row counts, continuation sheets C5–C11.
- Every 2026 field can be entered and stored.
- Rows beyond a page's capacity print on continuation sheets instead of disappearing.

**Non-goals**
- Excel export of the PDS (the Guide says CSC expects the Excel format; we assume HR keeps accepting our PDF).
- The Work Experience Sheet (WES). No 2026 WES template was supplied, so it stays as is, still on Legal. The workbook's C6 sheet is the PDS work-experience *continuation*, not the WES.
- Migrating existing PDS data (the requester said to ignore it).
- Changing the e-PDS consent text on the register page (it cites CSC Resolution No. 2500358). Left untouched unless the requester supplies new wording.

- Removing the Tailwind CDN from the PDF view. The requester asked to keep it as it is for now. The new and changed views keep using Tailwind utility classes. Note for later: printing needs internet while the CDN is used, and the project's official-form rule asks for inline CSS only.

**Anti-goals** (a failure even if it "works")
- A PDF labelled "Revised 2026" that differs from the official layout. That is today's state.

## 4. Approaches considered

1. **Fix in place:** items 1–6 and 9 below only. Smallest change, but the PDF stays Legal with 28 work rows and still drops overflow rows.
2. **Fix in place plus overflow sheets on the current Legal grid.** Nothing dropped, but the layout still differs from the official sheet.
3. **Official A4 grid plus continuation sheets C5–C11. Chosen.** The official form has fewer rows per page than ours (24 vs 28 work rows), so overflow sheets are needed anyway, and the result matches what the office compares against.

## 5. What changes

| # | Change | Where |
|---|---|---|
| 1 | Page 3 order and numbering: VI L&D (29), VII Voluntary Work (30), VIII Other Information (31–33) | PDF view; `SECTIONS` in `pages/pds/Index.tsx`; section order in `lib/pds-completion.ts` |
| 2 | Signature caption "(e-signature/digital certificate)"; notary caption "(e-signature/digital certificate except for notary public)" | PDF view (5 places) |
| 3 | Dates printed dd/mm/yyyy (signature dates currently print "November 18, 2026") | PDF view |
| 4 | Monthly Salary: new column, entry field, validation, printed as "P21,877.00" or "N/A" | migration, `PdsWorkExperience`, `PdsController`, `WorkExperienceSection.tsx`, `types/pds.ts`, PDF |
| 5 | Salary/Job/Pay Grade and Step in "00-0" format (e.g. 24-2) | validation, `WorkExperienceSection.tsx` (grade and step inputs), PDF |
| 6 | "PhilSys Card Number (PCN)" wording | `PersonalInfoSection.tsx`, error message in `PdsController` |
| 7 | A4 grid with official row counts (section 6) | PDF view and service |
| 8 | Continuation sheets C5–C11 | PDF view and service |
| 9 | "Revised 2026" on the PDS page | `pages/pds/Index.tsx` |

Already matching, no change: citizenship, sex at birth, civil status set (Single/Married/Widowed/Separated/Other/s), questions 34–40 including RA 11861, reference columns, "Date of Validity", photo box, oath block.

## 6. Design

### 6.1 Data
- New migration (via `make:migration`): `add_monthly_salary_to_pds_work_experience_table`, `decimal(12,2)` nullable. Cast in the model and add to `$fillable`. Validation: `nullable|numeric|min:0`. Printed with a "P" prefix and thousands separators, per the Guide's example.
- `salary_grade` stays one string column holding the "grade-step" value the form prints. The entry form shows two inputs (grade, step) and composes the value; validation `nullable|regex:/^\d{1,2}-\d$/`. Choosing a position still pre-fills the grade.
- No other schema change. `philsys_number` and `telephone` (reference contact) keep their column names; only labels change.
- Existing rows are not converted.

### 6.2 PDF
- New `app/Services/PdsPdfService.php` with `dataFor(User)`, `buildHtml(User, bool $preview = false)`, `buildPdf(User)`, `filenameFor(User)`, built through `App\Support\PdfBrowsershot::make()` with `format('A4')`. This gives the PDS PDF one home for its data assembly (architecture-guard lists three duplicates). `PdsPdfController` shrinks to authorize + call the service + respond. The `BuildsPdsData` trait and the WES are left alone.
- Views under `resources/views/pds/`: `pdf.blade.php` (document shell and CSS), `pdf/page-1` … `page-4`, `pdf/continuation/{learning-development,work-experience,family-background,education,eligibility,voluntary-work,other-information}`.
- Styling stays as it is today: Tailwind utility classes through the CDN script, with the Arial Narrow fonts embedded as base64. New partials and continuation sheets use the same classes. Sizes that define the page (page width and height, margins) are set in `mm`.
- Paper: **A4 portrait, the same size as the official workbook and its PDF.** The requester wants the page size to match the official file, so the office can rescale when printing.
- Row capacities (from merged ranges in the workbook; the builder verifies each against a print preview):

| Section | Official main page | Ours today | Continuation sheet |
|---|---|---|---|
| Children | 13 (C1 rows 37–49) | 13 slots (one repeated child, a bug) | C7: 20 |
| Education | 5 levels | 5 | C8: 38 |
| Eligibility | 7 | 8 | C9: 24 |
| Work experience | 24 | 28 | C6: 34 |
| L&D | 17 | 21 | C5: 44 |
| Voluntary work | 9 | 7 | C10: 29 |
| Other info (three columns) | 7 | 7 | C11: 32 |
| References | 3 | 3 | none |

- Overflow: the main page prints the first N rows. The rest are split into chunks of the continuation capacity, one sheet per chunk, in order. No overflow means no continuation sheets (the Guide: "print only the extra sheets where additional information were entered"). The "(Continue on sheet Cx if necessary)" lines stay printed on the main pages, as on the form.
- Every page, including continuation sheets, carries the signature box, dd/mm/yyyy date and the footer "CS FORM 212 (Revised 2026)". "Page x of 4" appears only on the four main pages.
- Education: rows are matched per level today (`firstWhere`). If the entry form allows several rows per level, extra rows go to C8. The builder checks this.
- C7's spouse columns (a second spouse) have no data behind them and print blank.
- The local HTML preview moves from a closure in `routes/web.php` into `PdsPdfController::htmlPreview` (local environment only) and gains an ownership check.

### 6.3 Entry page
- Section order and labels follow the official numbering (item 1). `PDS_SECTION_IDS` order changes with it.
- UI changes follow the project's UI process (finding-patterns, planning, implementing, verifying) before any UI code is handed over.

### 6.4 Tests (Pest; none exist for the PDS today)
- `tests/Feature/Pds/` follows `LeaveApplicationHttpTest`: mock the PDF service for the HTTP checks (owner and admin get `application/pdf`; another employee gets 403).
- `buildHtml()` tests need no Chrome: "Revised 2026" and the new captions present, dd/mm/yyyy dates, official row counts, no continuation sheet at capacity, one extra sheet at capacity + 1, several sheets at larger sizes.
- Validation tests for `monthly_salary` and the "00-0" grade-step format.

### 6.5 Verification before calling it done
Compare the local HTML preview with the workbook; download the real PDF and check A4 size, margins, page breaks and fonts; try the longest realistic data; run `composer test`, `npm run types` and `npm run lint`.

## 7. Constraints
- Never edit `resources/js/routes/**`, `actions/**` or `wayfinder/`. Wayfinder regenerates them.
- Access control stays on the server. The PDF routes keep the owner-or-admin/superadmin check.
- Headless Chrome does not run in tests.
- Dates on the form use `Asia/Manila`; the app timezone is UTC.

## 8. Decisions
Confirmed by the requester (2026-11-18):
- **Paper size matches the official file (A4).** The office can rescale when printing.
- **Tailwind CDN stays** in the PDF view for now.
- **WES stays as it is.**
- **Consent text on the register page stays as it is** for now.

My calls, not objected to when the requester reviewed the list:
- Monthly Salary is optional and prints "N/A" when empty.
- Grade and step are stored as one string; no new column.
- The workbook wins over the Guide on order and sheet names.

## 9. Left to the builder
Exact margins and column widths; verifying capacities (children rows, L&D rows) against a print preview; whether a second row per education level is possible; exact wording of validation messages.

## 10. Deferred
- 2026 WES template: not supplied; WES unchanged.
- Register-page consent text: unchanged.
- Removing the Tailwind CDN from the PDF view.

## 11. Implementation notes (2026-11-18)
What differs from the sections above, and why:
- **Layout:** the pages keep their existing table structure (it already has the official arrangement) instead of being rebuilt on the workbook's 14-column Excel grid. A4 comes from `.page { width: 218.6mm; zoom: 0.86 }` (188 mm printed, like the workbook's fit-to-page scaling) with `@page { size: A4 }` and Browsershot `format('A4')`. A small script in the view shrinks any page that long text makes taller than 277 mm, so a signature row never lands alone on a second sheet.
- **Children:** 13 rows on the main page (C1 rows 37-49), not 12. The old view also fixed a repeated-child bug on the "(Continue on sheet C7)" row.
- **Salary grade:** the server accepts a bare grade ("24") so rows saved before this update do not block saving the section; the form requires the step on any row being added or edited.
- **Continuation capacities:** C6, C8 and C11 are one row above the workbook (33, 37 and 31 data rows); left as is, noted for a later fix.
- **Dates:** only a real calendar date is reformatted to dd/mm/yyyy; free text (the date of issuance) prints as typed.
- **Deploy:** run the migration before the new frontend ships; confirm the Chrome version Browsershot uses where the app is deployed (CSS `zoom` behaviour changed in Chrome 128).

## 12. Input limits and attachment ownership (2026-11-20, security-hardening pass on the PDS save endpoints)
- **Why:** most PDS fields had no `max:` rule and the columns are `varchar(255)`, so a long value was accepted (under 255) or crashed the save with a database error (over 255). The limits live in `PdsController` and are pinned field by field in `tests/Feature/Pds/PdsInputLimitsTest.php`.
- **Limits (final, sized to what each box really holds):** person names 100 (same as registration), name extensions 10; family-member names 60; birth place, streets, barangay, city, province 60 (subdivision/village and house no. 30); schools, courses, organizations, offices, locations, employers 100; ID numbers 25-30; phones 20-30; question details 255; work duties and accomplishments 2000; position and eligibility titles 255 (HR can create titles that long in the reference lists, so the PDS must accept them). Row caps: children 30, education 15, eligibilities 30, work experience 60, voluntary work 40, trainings 100; other-information lists 50 items of at most 100 characters. Height 0-3 m, weight 0-500 kg, hours 0-9999. Work and volunteer dates are `YYYY-MM-DD`; birth dates cannot be in the future; the education level must be one of the five enum values. The browser copy is `resources/js/lib/pds-limits.ts`; `PdsLimitsParityTest` fails if it differs from the server.
- **Left as before:** training title (255, long titles are legitimate).
- **Attachments:** a row may keep an `existing_attachments[i]` path only if it exactly matches an attachment already on one of that employee's own rows in the same section (`assertOwnAttachments`, run before anything is deleted). Before this, eligibility, work experience and voluntary work trusted the posted path, so one employee could point a row at another's file and the old-file cleanup would delete it; trainings only checked a `pds/{id}/` prefix, which `..` segments defeat, and it deleted the employee's rows before reporting the error. Pinned in `tests/Feature/Pds/PdsAttachmentOwnershipTest.php`.
- **Deploy:** before shipping, count stored values that exceed the new limits on production (an employee with an older, longer value gets an error dialog naming the field until they shorten it). `phpunit.xml` now sets `memory_limit` to 512M for tests (the suite peaks near 110 MB; the stock CLI limit is 128M).
- **Not done:** `maxLength` on the form inputs; GSIS and SSS numbers are validated but have no column and are never saved; PDS attachments are stored on the `public` disk (readable by URL without logging in).

### 12.1 Private uploads, and what the independent review changed (2026-11-20)
- PDS uploads (certificates, ID photo, e-signature) now live on the private `local` disk (`App\Support\PdsFiles`). `GET /pds/file?path=pds/{userId}/...` (`PdsFileController`) serves them to the owner and to admin/superadmin only; the migration `move_pds_files_to_private_disk` moves existing files (deploy runs it in maintenance mode). Profile photos stay public on purpose (the public QR page shows them).
- The 2026 form has no GSIS or SSS number, so those two stale validation rules were removed (there was never a column for them).
- Review fixes: (1) the duties/accomplishments box refuses an edit that would exceed its limit and clips a paste to the room left, instead of cutting text off the end; (2) test runs fake the `local` and `public` disks before migrating (`tests/Concerns/RefreshesDatabaseWithFakeDisks.php`), because the data migration used to move real files on every `php artisan test`; (3) over-limit errors are rewritten in plain words that name the row ("Work experience #4: accomplishments is too long (maximum 2000 characters)."); (4) position and eligibility titles accept 255, the length HR can create.
- **Declined:** `Content-Security-Policy: sandbox` on served files. It can stop Chrome from showing PDFs, and uploads are already limited to jpg/png/pdf with `nosniff` set.
- **Known, not done:** an employee whose saved value is longer than a new limit must shorten it before that section saves again (the message names the row and box); the WES, ARTA ID and leave-form signature readers have no test of their own (the shared `PdsFiles::dataUri` is tested); the parity test compares the browser list with the server list, not with the individual inputs; some older code checks a role named `hr` that the seeder never creates (CLAUDE.md names only superadmin, admin, employee).
- **Counter:** every PDS text box has one, shown only for the box being typed in: once the text reaches 60% of the limit (never more than 20 characters away: 18 of 30, 40 of 60, 235 of 255) it shows e.g. "18/30", red with "limit reached" at the limit. It hides when the cursor leaves the box, so the page loads clean and every box behaves the same. A saved value already over the limit keeps a red "too long, please shorten" even unfocused, because the server will refuse to save it. Hidden for read-only boxes. One shared piece: `resources/js/components/limited-input.tsx` (`LimitedInput`, `CharCounter`, `useFocusTracking`).

### 12.2 Format checks (2026-11-20)
- **What is checked:** government IDs (PhilSys 16 digits, TIN 9, 12 or 14, PhilHealth, PAG-IBIG and UMID 12; dashes and spaces optional, stored as typed, "N/A" accepted); mobile (09xxxxxxxxx, +639xxxxxxxxx or 639xxxxxxxxx, with spaces, dashes, dots and parentheses ignored); telephone (digits, spaces and `( ) + - . /`, at least 5 digits, optional leading "Tel.", optional endings such as "loc. 101", "local 101/102", "ext 101", "x101", "to 36"); person names (start with a letter, then letters, spaces and `. - ' , ( )`, no digits; "N/A" allowed where optional, including a child's name because the form tells people to write N/A); and a reference's contact (a phone number or an email address; the box is labelled "Contact No. / Email", so its messages say "contact"; N/A not accepted).
- **Where:** server rules in `app/Support/PdsRules.php` (applied in `PdsController`); the same table, patterns and wording in `resources/js/lib/pds-formats.ts`, shown under the box when Save is pressed (Personal, Family, References forms) plus an example hint in the ID, mobile and telephone boxes. `PdsFormatsParityTest` fails if the table or patterns differ; the examples and message sentences are shared in `tests/Fixtures/pds-formats.json`.
- **ZIP code: no format check, on purpose.** The ZIP is copied from the chosen city into a read-only box (all 1,620 cities have 4-digit zips). A server check could only lock out an employee whose record holds a value from the older free-text ZIP box ("N/A", a 5-digit code) that they cannot edit, so it stays a plain length limit.
- **Not checked on purpose:** the Name Extension box (a dropdown); "ID / License / Passport No." (the format depends on the ID type); the agency employee number; years in the education rows.
- **Boxes that had no place to show a message** (middle name, telephone, UMID, the spouse and father name-extension boxes) now have one; without it Save would have refused silently.
- **Review fixes:** (1) the References form never saved valid input (a row with an `undefined` key was counted as an error); fixed and covered by a real-browser check that a complete record saves, for Personal, Family and References alike; (2) the ZIP check above; (3) rules loosened where real values were refused (TIN 14 digits, more mobile and telephone styles, parentheses in names); (4) the server's ID and mobile patterns now run in unicode mode like the browser's, so a pasted non-breaking space is treated the same on both sides; (5) the spouse telephone message names the spouse.
- **Known:** the browser-side `validate()` functions have no automated test in the repo (there is no JS test runner); they were checked in real Chrome with throwaway scripts, and the shared examples are run through the real `pds-formats.ts` the same way. A change there should be re-checked by hand.

### 12.3 Login and sign-up (2026-11-20)
- **Why:** the sign-up server rules were `required` plus `max:255` (no format, password only `required|confirmed`) while the page checked more in the browser, so anyone skipping the page could register with a one-letter password; names allowed up to 255 characters with digits, which the PDS then refused; and the login crashed (HTTP 500) when it received a list instead of an email, and took in a 200,000-character password.
- **Sign-up (`App\Actions\Fortify\CreateNewUser`):** names, mobile number and employee number follow the PDS limits and formats exactly (a new account must never hold a value the PDS would refuse): names 100 (letters, spaces and `. - ' , ( )`, N/A allowed for the middle name), mobile in the PDS format, employee number 30. Email: at most 255 characters, `something@something.something`. Agency, division, section and position: at most 255. Salary grade: a whole number from 0 to 33 (0 is what the page sends when a position was typed instead of picked from the list, as before). Employment type and name extension must be one of the choices on the page (`EmployeeProfile::EMPLOYMENT_TYPES` mirrors `resources/js/lib/employment-type.ts`, with a test that they match). Messages are in plain words.
- **Password:** the project's shared rule (`PasswordValidationRules`, the same one used for reset and settings: 8+ characters here, and on the real site 12+ with upper and lower case, a number, a symbol and not found in known leaks) plus a 64-character maximum, enforced by the server. The page's checklist now shows the real-site rule (12+, upper, lower, number, symbol). The 64 cap also applies to reset and settings, because it lives in the shared rule.
- **Login:** the email and password must be text of at most 255 characters, and the email must look like an email; the throttle key no longer breaks on non-text input. Existing accounts are not affected (checked against all local accounts; run the same check on the real site before deploying).
- **Page:** names, mobile, employee number and email use the shared counter (`resources/js/components/limited-input.tsx`, moved there from the PDS folder so both areas import it); the password and the division/section/position search boxes stop at their limits without a counter. The page now also shows the server's message under the names, mobile, employment type and work boxes (it used to show only its own, so a server refusal sent the person back to the form with nothing to read). The login page boxes stop at 255; the browser's own `type="email"` check does the shape check.
- **Not covered:** the forgot-password and reset-password pages and the Settings profile form (they share the password rule, but their other boxes were not changed).
- **Known:** the browser sides have no automated test in the repo (no JS test runner); they were checked in real Chrome with throwaway scripts that replace Inertia with a small stand-in, and the server side is covered by `LoginInputTest` and `RegistrationInputTest`.
- **Review fixes:** (1) the page counted any non-ASCII letter (for example "ñ") as a "special character", which the real-site server does not, so a password could show a full green checklist and still be refused; the page now counts punctuation, symbols and spaces only; (2) typing a position after picking one from the list kept the picked position's salary grade (a stale grade was saved); it now goes back to 0; (3) a server refusal on the mobile box now turns it red like the page's own check. Tests were added for a reused employee number and for a malformed email still counting toward the login throttle.
- **Deploy note:** on the real site the shared password rule includes the "not found in known leaks" check, which calls an outside service. Sign-up now uses it too (password reset already did). If the office network silently drops outbound calls, a sign-up can wait up to about 30 seconds for that call to time out; the password is then accepted. Not changed.
- **Left as is (cosmetic):** the Agency and Name Extension boxes and the salary grade have no spot for a server message (the server can only refuse them if the request is tampered with); the page says "Last name" where the server says "Surname".

### 12.4 Draw-your-signature pad (2026-11-20)
- **What:** the References form's Signature box now has **"Or draw your signature"** (and **"Draw again"** once there is a signature) next to the upload. It opens a window, styled like the photo cropper, with a drawing area: draw with a mouse, finger or pen; **Undo** removes the last stroke, **Clear** wipes it, **Cancel** or the Escape key closes without changing anything, **Use Signature** accepts it.
- **How it works:** the drawing is turned into a PNG with a transparent background, cropped to the ink with a small margin, made 3x the on-screen size so it prints sharp, and handed to the form as an ordinary file called `signature.png`, exactly like an uploaded image. So the server (`image|max:2048`), the private storage, the PDF, the WES, the ARTA ID and the leave form needed no change; a server test proves a transparent PNG is accepted and keeps its transparency.
- **Where:** `SignaturePadModal` in `resources/js/pages/pds/sections/ReferencesSection.tsx`, beside the photo cropper and the upload boxes it matches (no new shared file). Ink is black. A single tap makes a dot. Points are stored as fractions of the pad width, so resizing the window keeps the drawing.
- **Checked:** in real Chrome with the app's real stylesheet (34 checks: mouse and touch drawing, undo, clear, cancel, Escape, a dot, "Use Signature", that the form receives a real `signature.png` with a transparent background cropped to the ink, "Draw again" replacing it, and "Signature is required." clearing). Throwaway scripts only; there is no JS test runner in the repo.
- **Not covered:** keyboard-only users cannot draw (they still have the upload); drawing does not use pen pressure.
- **Review fixes:** (1) only the first finger or pen draws, so a palm or second finger on a phone no longer adds a zig-zag or ends the drawing (the pad remembers the pointer that started the stroke); (2) a drawn or uploaded signature, a new photo, and the date now mark the form as having unsaved changes (they did not, so leaving the section lost them without a warning); (3) a stroke dragged past the pad edge is held at the edge, so the saved picture matches what is drawn; (4) the old browser-made picture link is released when a signature is replaced or removed; (5) no text-selection loupe on a long press on iPhone/iPad; (6) the window now takes focus when it opens, keeps Tab inside, announces itself as a dialog, returns focus to its button when closed, and says keyboard users can upload instead; (7) server tests now fail if the signature (image, max 2 MB) or passport-photo (image, max 4 MB) rules are loosened.
- **Left as is:** every pointer move repaints all strokes (fine for a normal signature, slower for a very long scribble); the pad window is a little wider than the photo cropper on purpose (more room to draw); the other windows' lack of a focus trap and the red X's small, unlabeled target are older issues.

### 12.5 Review fixes: failed saves, upload messages, printed wording (2026-11-21)
- **Why:** an end-to-end review (a real browser against a throwaway copy of the app, every section saved, the PDF produced, the official workbook's labels compared with the printed form) found three problems.
- **A failed save was silent.** `PdsIndex.handleSave` only handled a form refusal (HTTP 422); any other failure was rethrown and the employee saw nothing. It now shows a plain pop-up for a server error (5xx: "may not be saved, try again, tell HR"), files too big to send (413), a dropped connection and a 401. An expired login (419) is left to the rule that already exists in `app.tsx`, which sends the browser to the login page. `PdsSaveCallback` now resolves to `false` when the save did not go through, and the two sections that mark the form saved afterwards (References, Other Information) do so only on success, so a failed save keeps the "unsaved changes" warning.
- **Uploads PHP refuses.** PHP's `upload_max_filesize` (2 MB on this WAMP install) stops a file before Laravel sees it, although the forms say "Max 5 MB". The message was "The Attachment #1 failed to upload."; it is now "The Attachment #1 could not be uploaded. This server accepts files up to 2 MB each. Attach a smaller file." (the number is the real limit, capped at the form's own limit), for the four certificate sections, the photo and the signature. A refused photo or signature also used to be reported as "the references must be an array" (the reference list is posted as JSON text and was only decoded when a valid file was present); it is now decoded from its own type. `PdsUploadMessagesTest`.
- **Printed wording** (`PdsPrintedWordingTest`): the page 2 Eligibility heading is the one on the 2026 form (sheet C2: "CAREER SERVICE/ RA 1080 (BOARD/ BAR) UNDER SPECIAL LAWS/ CES/ CSEE, BARANGAY ELIGIBILITY / DRIVER'S LICENSE"; it still had the older "CATEGORY II/IV ... UNIFORMED PERSONNEL" wording); question 40 says "as amended" (it said "ammended") and its three prompts say "please specify". The same sentence on the screen form (`QuestionsSection`) had "(B)", "ra 7277" and "ammended". The continuation sheet C9 keeps the older heading on purpose: it is what the official workbook still prints on that sheet.
- **Checked:** `PdsUploadMessagesTest` and `PdsPrintedWordingTest` (RED before, GREEN after); in real Chrome, a server error, a 413 and a dropped connection each show their message and leave Save usable, a failed References save keeps the unsaved-changes warning and a good one clears it, a real 3 MB upload shows the new message, and an expired login lands on the login page.
- **Not done (needs a decision):** raising PHP's `upload_max_filesize` (to about 12M), `post_max_size` (about 64M) and `max_file_uploads` (the Work Experience form allows 60 files, PHP allows 20) in `php.ini` here and on the live server; adding "Barangay Eligibility" and "Driver's License" to the Eligibility pick-list (Reference Data); the `/pds/{userId}` page comment says admins may open another employee's page but the code refuses everyone except the owner (admins use the profile page and the PDF links, which work).
