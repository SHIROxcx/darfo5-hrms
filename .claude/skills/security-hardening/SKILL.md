---
name: security-hardening
description: Whole-application security audit of DARFO5 HRMS, run like a penetration test against the local instance — routes and middleware, IDOR on id/token parameters, file uploads, brute-force limits, session and cookie settings, security headers, production configuration, dependencies and data exposure. Use before a deployment, when asked for a security audit, pentest, hardening pass or "is the system secure", and after large features. For a review of only the pending diff, use /security-review instead.
---

# security-hardening

Audits the whole app the way an attacker would approach it, then reports findings with a severity and a fix. The system holds personal data under RA 10173 (PDS, government IDs, signatures, salaries), so treat every leak of another employee's data as serious.

## Ground rules

- **Local instance only.** Probe `http://127.0.0.1:8000` (start it with the `dev-doctor` skill). Never send probes to a production, staging or any other host, even if the user gives a URL; tell them a test of a live system needs written authorization and its own plan.
- **No destructive payloads.** No data deletion on records you didn't create, no denial of service, no load tests. For state-changing probes (delete, approve, upload), first create throwaway test users and records, and remove them afterward.
- **Ask before** creating test accounts, running `migrate`, or editing anything. The audit itself is read-only.
- **No new tools** installed for attacking (scanners, exploit kits). Use `php artisan`, `curl` / `Invoke-WebRequest`, `composer audit`, `npm audit` and reading the code.
- **Report first, fix later.** Don't change code during the audit. Fixes are proposed and made only after the user approves them.
- **Don't print secrets** found in `.env` or code; name the key and where it is.

## Phase 1 — Map the attack surface

1. `php artisan route:list --except-vendor -v` — every route with its middleware. Sort them into: public, `auth` only, `auth`+`verified`, and each `role:` group.
2. List every route parameter that selects a record: `{id}`, `{userId}`, `{user}`, `{userToken}`, `{employeeNumber}`, `{leaveRequest}`, `{serviceRecord}`, `{announcement}`.
3. List every endpoint that accepts files, every endpoint that returns files or PDFs, and every broadcast channel in `routes/channels.php`.
4. Note the known public routes (by design): `/`, `/employee/{employeeNumber}`, `/pending-approval`, `/divisions`, `/positions`, login, register, password reset, `/up`.

## Phase 2 — Access control (highest priority)

Run the `hrms-authz-check` checklist on **every** route, not only new ones. Then probe the important ones with real requests, using three test users: employee A, employee B, and an admin.

- **Horizontal IDOR:** logged in as A, request B's records: profile (`/profile/{id}`), PDS (`/pds/{userId}`, `/pds/preview/{userToken}`, `/pds/download/{userToken}`), WES, service-record PDF, leave PDF, leave edit/cancel. Expect 403 or 404 every time.
- **Vertical escalation:** as an employee, call every `admin/*` and `superadmin/*` route, including POST/PUT/DELETE ones. Expect 403.
- **Body parameters:** ids and paths inside the request body, e.g. `existing_attachments[]` on PDS saves (known file-deletion bug), `user_tokens[]` on bulk PDF, role or approval fields in profile forms (mass assignment).
- **Account status:** log in, then have an admin deactivate or revoke the account in another session. Does the first session keep working? (Known gap: status is checked only at login.)
- **Local-only routes:** confirm `/pds/html-preview` and `/service-records/html-preview` are not registered when `APP_ENV` is not `local`, since they skip ownership checks.
- **Broadcast channels:** an employee must not be able to authorize `admin.notifications` or another user's `user.{id}` (`POST /broadcasting/auth`).

## Phase 3 — Authentication and brute force

- Login throttle: 5 attempts a minute per email + IP. Confirm the 6th fails.
- `POST /otp/verify`: known to have **no throttle**, and it trusts the posted email. Confirm and record.
- 2FA challenge throttle; password reset throttle.
- Password rules: registration accepts only `required|confirmed` (known); compare with reset and change-password.
- Default seeded accounts (`superadmin@darfo5.hris.com`, `admin@darfo5.hris.com`, password `password`): flag if `DatabaseSeeder` could run in production, and check the deploy steps.
- Admin and superadmin accounts without 2FA.
- User enumeration through different login, registration or reset messages.
- Session fixation and logout: the session id changes at login; logout invalidates it.

## Phase 4 — Input, files and output

- **Uploads:** for each upload endpoint, check the server-side `mimes`/`max` rules, that the stored name is generated (never the client name alone), and the disk. Files on the `public` disk are reachable without login through `public/storage`; personal documents belong on a private disk served by a controller with an ownership check.
- **Path traversal:** any parameter that becomes a file path or a `Storage` call.
- **XSS:** search Blade for `{!! !!}` and React for `dangerouslySetInnerHTML`; each must render only trusted HTML. Announcement bodies and PDS text fields are user input.
- **SQL injection:** search for `DB::raw`, `whereRaw`, `selectRaw`, `orderByRaw` and string-built queries with request data.
- **PDF rendering:** Blade views for Browsershot escape user data; no user-controlled URLs or `<script>` reach headless Chrome.
- **CSRF:** all state-changing routes are POST/PUT/PATCH/DELETE inside the `web` group; none are GET.

## Phase 5 — Data exposure

- Inertia props on each page: look for whole models with `password`, `two_factor_secret`, `two_factor_recovery_codes`, `public_token`, government ID numbers, salary, or other employees' data that the page doesn't show. Check the shared props in `HandleInertiaRequests`.
- The public QR page `/employee/{employeeNumber}` shows the minimum (name, position, office, photo). Check whether employee numbers are sequential and so easy to enumerate, and whether the throttle (`30,1`) holds.
- JSON endpoints (`/divisions`, `/positions`, `/api/*`, notification and leave JSON) return only what their page needs.
- Error pages don't show stack traces (depends on `APP_DEBUG`, Phase 6).
- Logs: OTP codes and mail bodies are written to `laravel.log` when `MAIL_MAILER=log`; logs must not be web-reachable.

## Phase 6 — Configuration and deployment

Check `.env` (report key names only), `config/`, `bootstrap/app.php`, `public/web.config` and `deploy.ps1`:

| Setting | Production value |
|---|---|
| `APP_ENV` / `APP_DEBUG` | `production` / `false` (`deploy.ps1` checks both) |
| `APP_URL` | the real `https://` URL |
| `SESSION_SECURE_COOKIE` | `true` |
| `SESSION_ENCRYPT` | `true` recommended |
| `SESSION_SAME_SITE` | `lax` or `strict` |
| `MAIL_MAILER` | a real mailer, not `log` |
| `REVERB_SCHEME` / TLS | `https`/`wss` in production |
| `.env` | not web-reachable; IIS serves only `public/` |

- **Security headers:** none are set today (no middleware, nothing in `web.config`). Expected: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` or CSP `frame-ancestors`, `Referrer-Policy`, a `Content-Security-Policy` that allows Vite in local and the Reverb host. Check the live response headers with `curl -I`.
- Backups: a database backup before migrations in `deploy.ps1` and on a schedule (none today).
- Audit trail: whether approvals, role changes and record edits are logged (none today).

## Phase 7 — Dependencies and secrets

- `composer audit` and `npm audit --omit=dev`. Report each advisory with the package, severity and fixed version. Don't run `npm audit fix --force`.
- Packages pinned to `*` in `composer.json` (`laravel/reverb`, `spatie/browsershot`, `spatie/laravel-permission`, `barryvdh/laravel-dompdf`): flag that updates are unbounded.
- Secrets committed to git: search tracked files for keys, passwords and tokens (`git grep -nE "(password|secret|api_key|token)\s*=\s*\S+"`), and check `git log` for an `.env` ever committed.

## Report

Write the findings as a table, most severe first:

| # | Severity | Finding | Where | How it can be exploited | Fix |
|---|---|---|---|---|---|

Severity:
- **Critical** — another user's personal data, account takeover, or file deletion is reachable by a normal employee or a guest
- **High** — privilege escalation, missing brute-force limit, sensitive data on public storage, production misconfiguration
- **Medium** — defence in depth missing (headers, session flags, audit trail), information leaks
- **Low** — hygiene, unbounded versions, dead code with a security angle

For each finding, say whether it was **confirmed by a probe** or **found by reading the code only**. End with a short "fix first" list of the top five. If the user wants a document, use the `docx` skill and follow the existing gap-analysis report's layout.

After the user approves fixes, make them one finding at a time, add a Pest test that proves the hole is closed, and re-run the probe that found it.
