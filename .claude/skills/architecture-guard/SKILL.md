---
name: architecture-guard
description: File placement and naming rules for DARFO5 HRMS (Laravel 12 + Inertia + React). Use before creating, moving or renaming any file in app/, routes/, resources/js/, resources/views/, database/ or tests/, when asked where something belongs, or when reviewing whether code follows the project's structure.
---

# architecture-guard

Decides where a new file goes and what it is called, so the codebase stays consistent. Check this before creating or moving any file.

## How to use

1. Find the kind of file in the tables below and use that location and naming.
2. Open the nearest existing sibling (the same kind of file in the same area) and follow its style.
3. If no row fits, don't invent a new top-level folder. Say which rule is missing and propose a location for the user to confirm.
4. Before finishing, check the hard rules at the end.

## Backend (`app/`)

| What | Where | Naming |
|---|---|---|
| Controller for admin (HR) features | `app/Http/Controllers/Admin/` (subfolder per area, e.g. `Admin/ReferenceData/`) | `{Thing}Controller` |
| Controller for superadmin features | `app/Http/Controllers/SuperAdmin/` | `{Thing}Controller` |
| Controller for every employee | `app/Http/Controllers/` | `{Thing}Controller` |
| Settings pages | `app/Http/Controllers/Settings/` | `{Thing}Controller` |
| Code shared by several controllers | `app/Http/Controllers/Concerns/` | trait, verb-first (`BuildsPdsData`) |
| Business logic (credits, calculations, PDF building) | `app/Services/` | `{Domain}Service` (`LeaveService`, `ServiceRecordPdfService`) |
| Validation for a form with real rules | `app/Http/Requests/` (subfolder when grouped, e.g. `Settings/`) | `{Verb}{Thing}Request` (`StoreLeaveApplicationRequest`) |
| Validation rules reused across requests | `app/Concerns/` | trait, `{Thing}ValidationRules` |
| Authorization for a model | `app/Policies/` (not created yet; create it when first needed) | `{Model}Policy` |
| Model | `app/Models/` | singular PascalCase (`LeaveRequest`) |
| Broadcast and domain events | `app/Events/` | past tense (`LeaveRequestReviewed`) |
| Listeners | `app/Listeners/` | `{Action}On{Event}` (`NotifyAdminsOnVerification`) |
| Notifications | `app/Notifications/` | `{Event}Notification` |
| Mailables | `app/Mail/` | `{Thing}Mail` |
| Artisan commands | `app/Console/Commands/` | `{Verb}{Thing}` class; command name `domain:action` (`notifications:prune`) |
| Small framework helpers | `app/Support/` | `{Thing}` (`PdfBrowsershot`) |
| Fortify hooks | `app/Actions/Fortify/` | only Fortify's own action classes |

**Controller size:** controllers validate, authorize, call a service and return a response. Logic longer than a few lines, or used in two places, belongs in a service.

## Routes (`routes/`)

| What | Where |
|---|---|
| Pages and form posts | `routes/web.php`, inside the role group that matches the controller namespace (`role:admin`, `role:superadmin`, `role:admin\|superadmin`, or plain `auth`+`verified`) |
| Settings | `routes/settings.php` |
| Broadcast channel authorization | `routes/channels.php` |
| Schedules | `routes/console.php` |

- Every route points to a controller method. **No closures with logic.** The existing `/pds/html-preview`, `/service-records/html-preview`, `/api/eligibilities`, `/divisions` and `/positions` closures are known deviations; don't copy them.
- Name every route: `area.thing.action` (`admin.leave.review`).

## Frontend (`resources/js/`)

| What | Where | Naming |
|---|---|---|
| Page for a new feature | `resources/js/pages/{Area}/{Feature}/` mirroring the controller namespace: `Admin/`, `SuperAdmin/`, `Employee/` | PascalCase folders, files `Index.tsx`, `Show.tsx`, `Create.tsx`, `Edit.tsx`, `Review.tsx` |
| Page-only parts (sections, modals) | next to the page, e.g. `pages/pds/sections/`, `pages/Admin/Employees/EmployeeFilters.tsx` | PascalCase |
| Component shared by several pages | `resources/js/components/`, in a feature subfolder when it belongs to one domain (`components/leave/`) | kebab-case file (`searchable-select.tsx`) |
| shadcn/radix primitives | `resources/js/components/ui/` | kebab-case; add with the shadcn CLI, don't hand-write |
| Layouts | `resources/js/layouts/` | kebab-case |
| Hooks | `resources/js/hooks/` | `use-{thing}.ts` |
| Plain helpers | `resources/js/lib/` | kebab-case (`employment-type.ts`) |
| Shared TypeScript types | `resources/js/types/` | kebab-case per domain (`pds.ts`) |

- The string in `Inertia::render('Admin/Leave/Review')` must equal the page path `pages/Admin/Leave/Review.tsx`.
- Starter-kit pages stay lowercase (`auth/`, `settings/`, `welcome.tsx`). Don't rename them, and don't add new features there.
- Known deviations, don't copy: `pds/Index.tsx` (lowercase folder), and the hooks `useDebouncedValue.ts`, `usePhLocations.ts`, `useUnsavedChanges.ts` (camelCase).
- Call the backend through the generated Wayfinder helpers (`@/routes/...`, `@/actions/...`), not hardcoded URLs.

## Views, database and tests

| What | Where | Naming |
|---|---|---|
| PDF / print Blade view | `resources/views/{domain}/` | kebab-case form name (`leave/csc-form-6.blade.php`) |
| Email Blade view | `resources/views/emails/` | kebab-case |
| Migration | `database/migrations/` via `php artisan make:migration` | `create_{table}_table` / `add_{columns}_to_{table}_table`, one `.php` extension |
| Seeder | `database/seeders/`, registered in `DatabaseSeeder` | `{Thing}Seeder` |
| Factory | `database/factories/` | `{Model}Factory` |
| Feature test | `tests/Feature/` (subfolder per area, like `Auth/`, `Settings/`) | `{Thing}Test.php`, Pest syntax |
| Unit test | `tests/Unit/` | `{Thing}Test.php` |

Use `php artisan make:*` generators where they exist, so the file starts in the right place with the right namespace.

## Hard rules

- **Never edit generated Wayfinder files:** `resources/js/routes/`, `resources/js/actions/`, `resources/js/wayfinder/`. Change the PHP route or controller and let Vite regenerate them.
- **Never edit `vendor/` or `node_modules/`.**
- **Authorization lives on the server,** in route middleware and the controller or policy. Frontend checks are for display only.
- **No new top-level folders** in `app/` or `resources/js/` without the user's agreement.
- **One home per piece of logic.** Before writing a helper, search for an existing one. Known duplicates to consolidate rather than copy: PDS data assembly (`BuildsPdsData`, `PdsController::getPdsData`, `PdsPdfController::resolveData`), and `resolveOfficeAbbreviation` / `fileToDataUri` in several controllers.

## When reviewing

List each file that breaks a rule above, with the rule and the location it should have. Don't move existing files unless asked: moving a page or controller also changes Inertia names, routes and Wayfinder output.
