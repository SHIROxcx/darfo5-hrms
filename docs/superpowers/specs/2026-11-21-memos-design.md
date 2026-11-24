# Memos module (official memos with signatories and history) — design

Status: built 2026-11-21, then **changed to upload-only on 2026-11-23** (section 13 says what changed; sections 1 to 12 describe the first version and are kept as the record of it).

## 1. Intent and why
HR (admin and superadmin) needs to issue **official memos** to employees from inside the HRMS, like the DA Memorandum Circular the requester had open (letterhead, number and series, subject, body, signatory). Today the only way to tell employees something is an *announcement*, which is a short notice, has no signatories, and is **deleted for good** when removed or expired, so there is no record of what was announced. Both memos and announcements should leave a **record with a history**, and every memo should carry its **signatories**.

In the requester's words: "add another tab in admin or super admin that has a memo tab and something like a subject, time and date, text box for writing context, signatories, or upload file for the users or employees to view"; "official memo as well as the announcement also have a record for it so it has history please also consider signatories".

## 2. Decisions the requester made (2026-11-21)
- **Approach:** a separate Memos module (not extra fields on announcements, not upload-only).
- **Signatories:** names and positions, plus an *optional signature picture* (uploaded or drawn like the PDS signature pad). Saved with each memo so it never changes later.
- **Announcements:** keep a history. Deleting or auto-expiring an announcement hides it but keeps the record.
- **Notification:** when a memo is published, employees get a bell notification and an email (same as announcements today).

## 3. Goals
1. Admin/superadmin: a **Memos** tab to write a memo (type, subject, date, optional time, "to", body, signatories) **or** upload a ready-made file; save as draft, preview, publish, withdraw.
2. Employees: a read-only **Memos** tab listing published memos, opening one shows it with its signatories and a view/download.
3. A saved **list of signatories** (name, position, optional signature picture) HR picks from, so they are not retyped.
4. A **history** for every memo and announcement: who did what and when.
5. A published written memo is a **frozen PDF** in the DA format (letterhead on every page, number and series, subject, body, signatories, page x of y).

## 4. Non-goals (this version)
Per-division targeting (every approved employee sees every published memo); read receipts or "acknowledged" buttons; rich text, images or tables in the memo body; comments or replies; a multi-step sign-off workflow inside the system; digital certificates or legal e-signature validation; editing a published memo; importing old memos; QR codes or a tracking number like the DA's.

## 5. Anti-goals (a failure even if it technically works)
- A published memo changing afterwards (text, number, signatories).
- An employee seeing a draft or a withdrawn memo, or a draft's file.
- Memo files or signature pictures reachable by URL without a login (they live on the private disk).
- History that can be edited or deleted.
- Rules enforced only in the browser.

## 6. Constraints
Laravel 12, Inertia + React 19, Tailwind v4, Pest; follow the project skills (`architecture-guard`, `admin-module`, `hrms-authz-check`, `official-form-pdf`, `notify-employee`, `ui-consistency`). Never edit Wayfinder-generated files. **Ask before running `php artisan migrate`.** Roles are enforced on the server (`role:` middleware plus form-request `authorize()`). PDFs go through `App\Support\PdfBrowsershot::make()`; printed dates use `Asia/Manila` (the app runs in UTC). Tests must not touch real files (use the fake disks like `tests/Concerns/RefreshesDatabaseWithFakeDisks.php`). PHP now allows 12 MB per file, 64 MB per request, 60 files (set 2026-11-21 in WAMP; the live server needs the same). **Nothing is committed until the requester says so.**

## 7. Approaches considered
| | What | Trade-off |
|---|---|---|
| A | Add subject, time, signatories and a file to the existing announcement | Cheapest, but memos and announcements are mixed, there is no real history and no official PDF. |
| **B (chosen)** | A separate Memos module with its own tables, tab, PDF, history and notification | More to build, but each thing does one job, history is clean, and it follows the project's existing patterns. |
| C | Upload-only memos | Simplest, but nothing is written in the system and signatories are not saved. |

## 8. What gets built (the design)

### 8.1 Data (new tables; a migration needs the requester's OK before it runs)
- `memos`: `type` (Memorandum, Memorandum Circular), `series_year`, `number` (nullable), `reference` (nullable text), `subject` (255), `addressed_to` (150, default "All DA RFO 5 Employees"), `memo_date` (date), `memo_time` (time, nullable), `mode` (`written` or `uploaded`), `body` (text, 20,000 max, plain text with line breaks), `file_path` and `file_name` (uploaded memos), `final_pdf_path` (written memos, set at publish), `status` (`draft`, `published`, `withdrawn`), `published_at`, `published_by`, `withdrawn_reason`, `created_by`, `updated_by`, `deleted_at` (drafts only).
- `memo_signatories`: one row per signatory on a memo, **copied** from the saved list at publish: `memo_id`, `sort_order`, `label` (optional, e.g. "Prepared by"), `name`, `position`, `signature_path` (a private copy inside the memo's own folder). 1 to 6 per memo.
- `signatories`: the saved list: `name`, `position`, `signature_path` (nullable), `is_active`.
- `record_events`: the history for memos **and** announcements: `subject_type`, `subject_id`, `user_id`, `action`, `details` (json: which fields changed, the withdraw reason), `created_at`. Append-only: no update or delete route exists.
- `announcements`: add `deleted_at` (soft delete).

### 8.2 Rules
- **Statuses:** draft → published → withdrawn (a withdrawn memo can be restored). A published memo is frozen. To correct one, withdraw it and publish a new memo. Only drafts can be deleted.
- **Numbering:** a written memo gets the next number for its type and series year **when published**, inside a transaction, with a unique index on (type, series_year, number). HR cannot edit it. An uploaded memo may carry an optional typed reference (the number on the file).
- **Publishing** (written): checks the required fields, copies the signatories and their pictures, builds the PDF, stores it privately, logs the event, then notifies employees. (Uploaded): the same minus the PDF.
- **Visibility:** employees (approved, verified) see only `published` memos. Admin and superadmin see all.
- **Limits and formats** are enforced on the server and mirrored in the form, in the same plain-word style as the PDS: subject 255, addressed-to 150, body 20,000, names 100 (the `PdsRules::personName` format), position 100, label 40, reference 50; an uploaded memo is pdf, jpg, png, doc or docx up to 10 MB; a signature picture is png or jpg up to 2 MB; a file PHP refuses gets the clear "could not be uploaded" message. Text boxes use the shared character counter.

### 8.3 Screens
- Sidebar: a **Memos** entry for admin, superadmin (manage) and employee (read-only).
- Admin: `Admin/Memos/Index` (list, status filter, search, "New memo"), `Create`/`Edit` (type, subject, date, time, to, "Write it here" or "Upload a file", body with counter, signatory picker with reorder, preview, Save draft, Publish), `Show` (the memo, its history, Withdraw/Restore), `Signatories` (the saved list: add, edit, deactivate, draw or upload a signature). The signature pad now inside `ReferencesSection.tsx` moves to a shared component so both use it.
- Admin: **Announcement history** (removed or expired announcements with who, when and why).
- Employee: `Memos/Index` (published memos, search, year filter, pagination) and `Memos/Show` (details, signatories, view/download).

### 8.4 The printed memo
`resources/views/memos/memo.blade.php` via `MemoPdfService` (`buildHtml`, `buildPdf`, `filenameFor`), A4. Letterhead on every page with the existing logos (`public/images/da-logo.png`, `bagong-pilipinas.png`) and the lines already used by the leave form ("Republic of the Philippines / DEPARTMENT OF AGRICULTURE / REGIONAL FIELD OFFICE 5"; address and phone from `config/memos.php`, to be supplied). Then the title (MEMORANDUM or MEMORANDUM CIRCULAR), "No. __ Series of YYYY", TO and SUBJECT and DATE (and time), the body, "Done this __ day of ___" (circular), the signatories (1 centered, 2 or more in a grid, picture above the name when there is one), "Page x of y". A draft preview is watermarked DRAFT. The published copy is frozen on the private disk.

### 8.5 Files and access
Everything under the private disk `memos/{id}/...`. A `MemoFileController` serves a memo's file or PDF after a check (employee: published only; admin: any); the path is built from the memo id, never taken from the request; `X-Content-Type-Options: nosniff`. Saved-list signature pictures are only reachable by admin/superadmin.

### 8.6 Notifications
On publish, to every approved, verified employee except the poster: a database notification `{message, url}` (not queued, so the bell row exists before any push) and a **separate** queued email class, in chunks of 100 like announcements. A live bell push goes on a **private** channel (authorized for approved, verified users), **not** the public `announcements` channel, because memo subjects are internal.

### 8.7 Announcements
Delete and the `announcements:delete-expired` command become soft deletes that keep the text and files, still remove the employees' bell rows, and write a `record_events` row (`deleted` or `expired`). Edits write an `updated` event naming the fields changed. Soft-deleted announcements stay out of every employee and dashboard list.

### 8.8 Tests and checks
Pest feature tests for: guest, employee and admin access on every route; employee cannot see a draft or withdrawn memo or its file; validation limits and messages; numbering (no duplicates, per type and year); the frozen copy (changing the saved signatory afterwards does not change a published memo); history written for each action and not editable; the notification and email fakes; the printed HTML contains the values (no Chrome in tests); announcement soft delete and expiry with history. Then the same real-browser check on a throwaway copy of the app used for the PDS review.

## 9. Left to the builder
The exact printed layout and page breaks for long bodies; component and file names (following `architecture-guard`); the signatory picker's look; how the history is shown; the channel name.

## 10. Calls I made (not the requester's, change any of them)
1. Two memo types: Memorandum and Memorandum Circular (the DA example is a circular). Easy to add more.
2. Number per type and year, assigned at publish, not editable.
3. Date required, time optional; an "addressed to" box with a default.
4. Plain-text body, 20,000 characters.
5. Withdrawn memos can be restored; only drafts can be deleted.
6. Everyone sees every published memo (no division targeting).
7. Uploaded memos may be pdf, jpg, png, doc or docx, up to 10 MB.
8. History is one shared `record_events` table instead of one per module.
9. Announcement files are kept with the archived record.

## 11. Questions only the requester can answer (defaults in brackets, the build does not wait for them)
1. Does the office already number its memos (for example "Memorandum Circular No. 25, Series of 2026")? [the system numbers them per type and year, starting at 1]
2. The letterhead's address, phone and email lines. [left blank until supplied in `config/memos.php`]
3. Who the regular signatories are (name and position), to enter in the saved list. [HR enters them after the build]
4. Do plain Memorandums need a "FROM" line as well as "TO"? [no; the signatory is the sender]

## 12. Built (2026-11-21)

**What shipped.** A **Memos** tab for HR (admin and superadmin) and a read-only **Memos** tab for every approved employee.
- HR: a list (status tabs, type filter, subject search); a form to write a memo (type, subject, "to", date, optional time, body, 1 to 6 signatories with labels and order) or upload a ready-made file (pdf, jpg, png, doc, docx up to 10 MB, optional typed reference); a **Signatories** page for the saved list (name, position, optional signature picture, uploaded or drawn, turn on/off); a page per memo with its details, signatories, history and the buttons for its status (draft: Edit, Preview PDF, Publish, Delete; published: View file, Withdraw; withdrawn: Restore, View file).
- Publishing a written memo numbers it (per type and per Manila year, retried on a collision), copies each signatory's name, position and picture into the memo, prints the final PDF once (`memos/{id}/final.pdf`) and tells every approved, verified employee except the publisher: a bell notice (stored at once), an email (queued) and a live push on the private channel `memos`.
- Employees: a list (subject search, year filter, 15 a page), a page per memo with its text and signatories, and **View / Download**. Drafts and withdrawn memos answer 404; an unapproved account gets 403.
- History: `record_events` (append-only; the model refuses update and delete) records memo created, edited, published, withdrawn, restored, deleted and announcement created, edited, deleted, expired. Announcements are now soft-deleted and their files kept; **Admin > Announcement history** lists them.
- All files are on the private disk. `MemoFileController` serves them; the path comes only from the memo row (`MemoFiles::fileOf`), so no request can name a path, a signature picture, or another memo's file.

**Where the build differs from this spec (each is a ruling in the build ledger).**
1. The employee pages show published memos to HR users too; HR sees drafts and withdrawn memos on its own tab. The file route lets HR open any memo's file.
2. A saved signatory who was turned off after the draft was saved blocks publishing, with a message naming them.
3. If the PDF cannot be made, nothing is published (the number is not used, copied pictures are removed) and the message says to try again.
4. If telling employees fails after a successful publish, the failure is logged and the publish stands.
5. After three number collisions in a row the publish stops with a plain message.
6. Added `MemoPolicy` (account check), a `ReadsQueryText` trait, `Memo::subjectContains` (portable LIKE with an explicit escape), a shared `PageLinks` component and `memo-format.ts`.
7. Found and fixed while building: the HR memo list answered 500 to `?search[]=x`.
8. Deleting a draft from its page returns to the list; publishing sends HR to the memo's page.
9. Added after the final review: saving or deleting a draft is refused (with a plain message) if the memo was published a moment earlier, because both now re-check the status under the same row lock that publishing takes; archived announcements keep their files, but the files are moved from the public disk to the private disk (`announcements/archive/{id}/`), since the public disk can be read by anyone with the address; the draft's edit page has a "Review and publish" link to the memo's page; the page buttons under the lists now also show when there are exactly two pages; and the search box no longer sends a request by itself when a list opens (it did, in development, which snapped page 2 back to page 1).

**Deploy notes.**
- Five migrations: `record_events`, `announcements.deleted_at`, `signatories`, `memos`, `memo_signatories`. They ran on the dev database on 2026-11-22 (with the owner's OK). On the live server run `php artisan migrate` after a database backup.
- The four new tables ask for InnoDB explicitly (`$table->engine = 'InnoDB'`; `MemoMigrationsTest` pins it). The dev MySQL (WAMP, 8.4) has `default_storage_engine = MyISAM`, which made the first run fail with "key too long, max 1000 bytes" and would have built tables with no transactions and no foreign keys. All the older tables are InnoDB. Check `select @@default_storage_engine` on the live server too: a MyISAM default there is harmless for these tables now, but the older ones would not be protected.
- Set `MEMO_LETTERHEAD_ADDRESS` and `MEMO_LETTERHEAD_CONTACT` in `.env` (printed under the letterhead; blank lines are left out).
- PHP on the live server needs the same limits as here: `upload_max_filesize` 12M, `post_max_size` 64M, `max_file_uploads` 60. `public/web.config` sets no request size, so IIS keeps its default of about 30 MB per request, which is enough for one 10 MB memo file.
- Publishing a written memo needs headless Chrome and Node on the server (as every other official PDF). Emails need the queue worker; the live push needs Reverb. If Reverb is down a publish still works.
- `storage/app/private/memos` is created on first use and must be in the backups with the rest of `storage/app/private`.

**Verified.**
- `vendor/bin/pest` (whole project, after the final-review fixes): 871 passed, 5 failed. The five are the known starter-kit auth tests (`EmailVerificationTest` x3, `RegistrationTest` "new users can register", `VerificationNotificationTest`). `tests/Feature/Memos`: 113 passed. `tsc`: 0 errors. ESLint: no new problems; Pint: clean on every new PHP file.
- Final-review fixes were each shown failing first (four backend tests, and a real-Chrome run on 18 memos: no page buttons, no way on from the edit page) and then passing; the search box was re-checked in Chrome on both lists.
- Real Chrome on a throwaway SQLite copy (63 checks passed, and the 2 that failed were script mistakes proved right by reading the database): two signatories (one drawn picture), write, preview, publish (final PDF holds both logos and the picture), employee list and page, View / Download, the bell notice, an uploaded 3 MB memo, withdraw (reason required; the employee loses it and its bell notice), restore (no second notice), an announcement deleted and shown in the history, a 13 MB file refused in the form and by the server with the "could not be uploaded" message, and no sideways scrolling at 390 px and 768 px.
- Not verified end to end: the live push through a real Reverb server (it would have reached the user's open dev tabs). It is covered by tests, and the browser was confirmed to be authorised onto the private `memos` channel.

**Still open (section 11):** numbering scheme, letterhead address lines, regular signatories, the "FROM" line.

## 13. Changed to upload-only (2026-11-23)

The requester asked: "make the memo to be something like upload only as well as the announcement remove the writing as well as the signatories".

**Memos.**
- A memo is now **only an uploaded file** (pdf, doc, docx, jpg, png, up to 10 MB) and nothing else is asked for (the requester, again, on 2026-11-23: when creating a memo or an announcement, "only upload the file"). The **subject is the file's name** (underscores become spaces, cut to 255), the **date is the day it is published** (it is set to today when the draft is saved, and again when it is published, in the office time zone), and the type, the "addressed to" line, the time and the typed reference are gone. Nothing is written in the system, and nothing is printed or numbered by it. A draft can only have its file replaced, which also renames it.
- Removed: the written mode and its body, the signatories (the saved list, the picker and the per-memo rows), the PDF (`MemoPdfService`, the Blade view, the draft preview and the final PDF) and the series-year/number numbering with its unique index.
- Kept: the draft, published and withdrawn states and the history; the rule that a published memo is frozen; the private disk and `MemoFileController`; the bell notice, the queued email and the private push channel; employee visibility rules. Publishing now needs only the file (`Upload the memo file before publishing.`); the email names the type and the reference instead of a number.
- Database: one forward-only migration (`2026_11_23_090000_make_memos_upload_only`) drops `memo_signatories` and `signatories` and the columns `type`, `reference`, `addressed_to`, `memo_time`, `mode`, `body`, `series_year`, `number` and `final_pdf_path` (and the numbering unique index). It **refuses to run** if any memo was written in the system, so no text is lost without notice; the dropped detail columns of uploaded memos are not kept. `down()` restores the structure, not the data.
- Limits left in `config/memos.php`: the withdraw reason (255) and the file (types and 10 MB). The memo types, the other text limits, and the signatory, signature, letterhead and body settings are gone, and `MEMO_LETTERHEAD_*` in `.env` is no longer used. The email says "A new memo, dated ..., was published." and names the subject.

**Announcements.**
- An announcement is now **only a file** (the types it accepted before, up to 10 MB, **one** file). HR picks the file; the **title is the file's name** (underscores become spaces, cut to 255), the **date is today** in the office time zone and the category is `General`. HR can still switch on auto-delete with a future date.
- Editing: a new file replaces the old one and the title follows it; the auto-delete choice can change. There is no text to edit.
- The stored file keeps a readable name in its own folder (`announcements/attachments/{uuid}/Name.pdf`), keeps only plain characters, and takes its extension from what the file really is, never from its name, so a PDF called `page.html` is not stored or served as a web page.
- Announcements written earlier are not changed: they keep their text, their category and all their files, and show them. Migration `2026_11_23_090100_make_announcement_body_optional` makes `announcements.body` nullable.
- The category chip is shown only on older announcements that had one chosen (anything but `General`).

**Calls made without asking.** The title comes from the file name rather than being typed; the date is automatic (a memo is dated the day it is published); one file per announcement; older announcements are kept as they are; the migration refuses to drop written memos.
