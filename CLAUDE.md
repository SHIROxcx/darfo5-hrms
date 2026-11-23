# CLAUDE.md

DARFO5 HRMS: an HR information system. Laravel 12, React 19 + TypeScript, Inertia.js (no separate JSON API for pages), Tailwind v4, shadcn/radix-ui, Pest. Domains: employees, Personal Data Sheet (PDS), service records, leave, reference data, announcements, notifications, official-form PDFs.

## Commands
- `composer dev` — server, queue, Vite, Reverb and scheduler together (use this to run the app)
- `composer test` — Pint check + Pest; single test: `php artisan test --filter=Name`
- `composer lint` — format PHP (Pint)
- `npm run lint` / `npm run format` / `npm run types` — ESLint, Prettier, `tsc --noEmit`
- `php artisan migrate:fresh --seed` — seeds roles, default users, reference data, PH locations

## Rules that apply to every task
- `Inertia::render('pds/Index')` maps to `resources/js/pages/pds/Index.tsx`. Page folders mirror controller namespaces (`Admin/`, `SuperAdmin/`, `Employee/`, …).
- **Never edit** `resources/js/routes/**`, `resources/js/actions/**` or `resources/js/wayfinder/`. Wayfinder generates them from `routes/*.php`. Import URLs from them instead of hardcoding.
- Roles (spatie/laravel-permission): `superadmin`, `admin` (HR), and employee (any authenticated, verified, approved user). Enforce access with `role:` middleware on the server, never only in the frontend.
- A fully onboarded account has both `email_verified_at` and `is_approved` (set by an admin). Verification uses OTP (`OtpController`); `User::sendEmailVerificationNotification()` is a no-op on purpose.
- PDS data is one table per section, keyed by `user_id`. List sections are ordered by `sort_order`.

## Use the project skills
| Task | Skill |
|---|---|
| Creating, moving or naming files | `architecture-guard` |
| New admin or superadmin module | `admin-module` |
| Routes, controller actions, exposed data | `hrms-authz-check` |
| Leave, credits, CSC rules | `csc-hr-rules` |
| PDF forms (PDS, WES, Service Record, CSC Form 6, ARTA ID) | `official-form-pdf` |
| Notifications, Reverb, email | `notify-employee` |
| App won't start or env errors | `dev-doctor` |
| Security audit | `security-hardening` |
| Removing unused code | `dead-code-cleanup` |
