---
name: official-form-pdf
description: Builds or changes an official government form PDF in DARFO5 HRMS (CSC forms, certificates, IDs, records) with the project's Blade + Browsershot pattern — a Blade view, a PDF service with buildHtml/buildPdf, preview and download routes, a local HTML preview route, and archiving of final copies. Use when asked to add a new printable form or certificate, generate a PDF, or fix the layout of an existing one (PDS, WES, Service Record, CSC Form 6, ARTA ID).
---

# official-form-pdf

Official forms in this project are HTML/CSS rendered to PDF by headless Chrome (`spatie/browsershot`). The browser preview and the PDF come from **the same Blade view**, so they never drift apart. Follow the existing forms:

| Form | Service | Blade view |
|---|---|---|
| Service Record | `app/Services/ServiceRecordPdfService.php` | `resources/views/service-records/pdf.blade.php` |
| CSC Form 6 (leave) | `app/Services/LeaveApplicationPdfService.php` | `resources/views/leave/csc-form-6.blade.php` |
| PDS / WES | `PdsPdfController`, `WesController` + `Concerns/BuildsPdsData` | `resources/views/pds/pdf.blade.php`, `wes.blade.php` |

The Service Record is the cleanest model for a new form. CSC Form 6 is the model when the form has a draft, a filed copy and an archive.

## 1. Before building

- **Get the official form** (PDF or scan) from the user, with the current revision. Use the `pdf` skill to read it. Match it exactly: field order, labels, box sizes, form number and revision line in the footer.
- **Paper size and orientation**: A4, Legal (8.5×13 in or 8.5×14 in) or Letter. Ask if the form doesn't say. Philippine CSC forms often use Legal or A4.
- **Where each value comes from**: list every field and its source column. Values that must not change after filing (name, position, salary at the time) are saved as a snapshot, like `leave_requests.applicant_snapshot`.

## 2. Files

1. **Blade view** — `resources/views/{domain}/{form-name}.blade.php`
   - A full HTML document with all CSS inline in `<style>`. No Vite, Tailwind or external URLs: Chrome renders it offline.
   - Sizes in `mm` or `pt`, not `px`, so print matches the paper. Use `table-layout: fixed` tables for boxed grids.
   - Fonts: Arial Narrow and others are in `public/fonts/`. Embed them as base64 `@font-face` the way `pds/pdf.blade.php` does.
   - Images (agency logo, signature, photo) as data URIs through the service's `fileToDataUri()`, never as file paths or URLs.
   - Page breaks with `page-break-before` / `page-break-inside: avoid` on rows that must stay whole.
   - A `$preview` (or `$screen`) flag adds an on-screen page outline for the HTML preview only. It must not change the PDF.
   - Escape all user data with `{{ }}`. Use `{!! !!}` only for HTML the service built itself.
2. **Service** — `app/Services/{Form}PdfService.php` with:
   - `buildHtml($model, bool $preview = false): string` — gathers data and returns `view(...)->render()`
   - `buildPdf($model): string` — `PdfBrowsershot::make($html)->format('A4')->margins(...)->showBackground()->pdf()`
   - `filenameFor($model): string` — a safe, readable filename (employee name + form + date or id)
   - Always build through `App\Support\PdfBrowsershot::make()`, never `Browsershot::html()` directly: `make()` adds `noSandbox()` and the configured node, npm and Chrome paths that production needs. `ArtaIdController` breaks this rule; don't copy it.
3. **Controller** — `preview()` returns the PDF `inline`; `download()` returns it as `attachment`. Both resolve the target record and run the ownership check first (see `hrms-authz-check`). Put it under `Admin/` if only HR uses it.
4. **Routes** — in the right role group, named `{domain}.pdf.preview` and `{domain}.pdf.download`.
5. **Local HTML preview** — inside the `if (app()->environment('local'))` block in `routes/web.php`, add `/{domain}/html-preview/{id}` that returns `buildHtml(..., preview: true)`. Include the ownership check: the existing PDS and Service Record previews lack it, which is a known gap. Reloading this tab after a Blade edit is the fast way to iterate on layout.

## 3. Drafts and final copies

When the form is filed and later approved (like CSC Form 6):
- **Draft preview** of unsaved input shows a **DRAFT** watermark, so a printed preview can't pass as a filed form.
- **Final copy**: on approval, save the PDF once to the **private** disk (`Storage::disk('local')`, e.g. `storage/app/private/{domain}-forms/{id}.pdf`) and store the path in a `final_pdf_path` column. Later requests serve the archived copy, so the signed document never changes even if data or layout changes later (`LeaveApplicationPdfService::pdfFor` / `storeFinal`).
- Never put generated forms on the `public` disk.
- Signatory names, titles and the form timezone come from `config/` (like `config/leave.php` with `LEAVE_*` env keys), not hardcoded in the view. Dates on the form use `Asia/Manila`; the app timezone is UTC.

## 4. Bulk output

For many employees at once (like `ServiceRecordBulkPdfController`), build each PDF in a loop and return a ZIP. Past a few dozen employees, move it to a queued job and notify the user when the ZIP is ready, instead of making the request wait.

## 5. Tests

Headless Chrome doesn't run in tests. Follow `LeaveApplicationHttpTest`: mock the PDF service (`$this->mock({Form}PdfService::class)`) and assert that:
- the owner and admins get a `application/pdf` response; another employee gets 403
- `buildHtml()` contains the key values (name, dates, form number). Test the HTML directly; it needs no Chrome.

## 6. Verify the layout

1. Open the local HTML preview and compare it side by side with the official form.
2. Download the real PDF and check the paper size, margins, page breaks, fonts and that nothing is cut off at the page edge.
3. Try the longest realistic data (long names, many rows) to see overflow.
4. If Browsershot fails, check the `BROWSERSHOT_*` keys and that Chrome is installed for Puppeteer; the error is usually a missing binary path, not the view.
