# AGENTS.md

DARFO5 HRMS: Laravel 12 + Inertia + React 19 + TypeScript. `CLAUDE.md` holds the core project rules; `DOCUMENTATION.md` is a long generated reference (dated 2026-09-30, stale in places — verify against code). Task playbooks live in `.claude/skills/*/SKILL.md` and are exposed as OpenCode skills.

## Commands
- `composer dev` — server, queue worker, Vite, Reverb and scheduler together. Use this instead of starting pieces by hand. `composer dev:ssr` skips Reverb and the scheduler; `npm run start` skips the queue worker.
- `composer test` — clears config, runs Pint in check mode, then Pest. Single test: `php artisan test --filter=Name`.
- `composer lint` — Pint fix. `npm run lint` — ESLint with `--fix` (there is no check-only script). `npm run types` — `tsc --noEmit`.
- `npm run format` — Prettier over `resources/`; it also sorts Tailwind classes.
- Before finishing: `composer test` and `npm run types`.

## Setup and environment
- The dev database is MySQL (`darfo5_hrms`), not SQLite. Some code is MySQL-only (`TIMESTAMPDIFF`/`CURDATE` in `DashboardController`, `SET FOREIGN_KEY_CHECKS` in the PH location seeders).
- `composer setup` does not create the MySQL database and does not seed. Use `php artisan migrate:fresh --seed` after creating it; seeds roles, admin accounts, reference data, locations, leave types and 10 demo employees (all passwords `password`).
- Run `php artisan storage:link`; uploads are served from `/storage/...`.
- Tests do not need MySQL: `phpunit.xml` forces SQLite `:memory:`, sync queue, array mail and null broadcasts. Feature tests use `RefreshDatabase` (`tests/Pest.php`).
- PDF tests mock the PDF service because there is no headless Chrome in CI. Do the same; don't render real PDFs in tests.
- PDFs need Node + Puppeteer's Chrome. `.env.example` omits the optional `BROWSERSHOT_NODE_BINARY` / `_NPM_BINARY` / `_CHROME_PATH` keys.
- Vite is pinned to `127.0.0.1:5173` with `strictPort`; `composer dev` fails if that port is taken.
- Never run `deploy.ps1`: it targets production IIS, requires `APP_ENV=production`, and restarts the `LaravelQueueWorker` / `LaravelReverb` services.

## Architecture
- `Inertia::render('x/y')` maps exactly to `resources/js/pages/x/y.tsx`. Casing is inconsistent on purpose: `pds/`, `auth/`, `settings/` are lowercase; new feature pages use `Admin/…`, `SuperAdmin/…`, `Employee/…` with `Index.tsx`/`Show.tsx`. Don't "fix" it.
- All routes, including JSON endpoints, are in `routes/web.php`. There is no `routes/api.php` and no Sanctum; "API" means session-authenticated web routes.
- Spatie roles are separate: `role:admin` does not admit a superadmin. Use `role:admin|superadmin` when both should pass.
- PDS is one table per section (`pds_personal_info`, `pds_education`, …), keyed by `user_id`; list sections order by `sort_order`.
- New business logic goes in `app/Services/` or `app/Actions/`, not route closures/controllers. Existing route closures are known deviations; don't copy them. Reuse `BuildsPdsData` and existing services instead of re-assembling PDS data.
- Approval uses two fields: `is_approved` and `access_revoked_at`. Use `User::isPendingApproval()`, `isRevoked()` and `scopePendingApproval()`; a revoked user is not pending. The login gate is in `FortifyServiceProvider`.
- Broadcasts are `ShouldBroadcastNow` events, channels in `routes/channels.php`, client config from `VITE_REVERB_*` in `resources/js/echo.ts`.
- PDF HTML is built in Blade/services and rendered through `App\Support\PdfBrowsershot::make()` — it adds no-sandbox and binary paths. `ArtaIdController` bypasses it (known gap, don't copy).
- In `local`, the `/{pds,service-records,leave}/html-preview/...` routes return the same HTML as the PDF; use them to iterate on layout instead of generating a PDF each time.

## Frontend
- Never edit `resources/js/routes/**`, `resources/js/actions/**` or `resources/js/wayfinder/**`. Wayfinder generates them from `routes/*.php` during Vite dev/build and they are gitignored. Missing imports → `npm run dev`/`npm run build` or `php artisan wayfinder:generate`.
- `@/` resolves to `resources/js/`. TypeScript is strict.
- Tailwind is v4 CSS-first: theme tokens and `@source` are in `resources/css/app.css`; there is no `tailwind.config.js`.
- ESLint enforces `import/order` and type-only imports; Prettier owns formatting. Use `resources/js/components/ui` primitives and the existing `cn()`/`cva` pattern; don't add another UI kit.

## HR rules and docs
- Never invent leave, credit, attendance or SPMS rules. Confirmed vs pending rules are in `.claude/skills/csc-hr-rules/SKILL.md`; undecided items are questions in `hr-policy-questions.md`.
- Task playbooks: `.claude/skills/{admin-module,architecture-guard,hrms-authz-check,official-form-pdf,notify-employee,dev-doctor,security-hardening,dead-code-cleanup}/SKILL.md`. New module specs go in `docs/modules/<name>.md` (template: `docs/modules/_template.md`).
