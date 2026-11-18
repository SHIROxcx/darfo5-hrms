---
name: admin-module
description: Scaffolds a new admin (HR) or superadmin feature in DARFO5 HRMS end to end — migration, model, factory, Form Requests, controller, routes, Inertia page, sidebar link and Pest tests — following the project's existing patterns. Use when asked to add a new admin module, management page, CRUD screen or reference-data table (e.g. DTR, plantilla, trainings, reports).
---

# admin-module

Builds a new admin feature the way this project already builds them. It depends on three other skills; load them as you reach their step:

- `architecture-guard` — where each file goes and what it is called
- `hrms-authz-check` — the route and ownership checklist
- `ui-consistency` — how the page is built so it matches the other pages

## 1. Pin down the scope first

Before writing code, settle these with the user. Ask only what the request leaves open; don't ask about what it already says.

| Question | Why it matters |
|---|---|
| What is the record, and what are its fields (type, required, unique)? | Migration and validation |
| Who uses it: `admin`, `superadmin`, or both? Can employees see their own rows? | Route group and ownership checks |
| Does it belong to an employee (`user_id`)? To other tables? | Foreign keys and cascade rules |
| Simple lookup list, or a full feature with its own screens? | Pattern A or B below |
| How many rows over time? | Hundreds or more need server-side pagination |
| Is anything deleted while in use elsewhere? | A delete guard, like `PositionController::destroy` |

Then state the plan as a file list (step 3) before creating anything.

## 2. Pick the pattern

**Pattern A — reference/lookup list** (a few fields, one table, add/edit/delete in place). Follow `Admin/ReferenceData/PositionController` and `pages/Admin/ReferenceData/Positions/Index.tsx`, which renders the shared `LookupCrudTable`. Routes go in the existing `admin/reference-data` group, and the link goes under the Settings menu in the sidebar.

**Pattern B — full feature** (several screens, filters, workflow, employee-owned rows). Its own controller folder under `Admin/{Feature}/`, its own pages under `pages/Admin/{Feature}/`, business logic in `app/Services/{Feature}Service.php`, and validation in Form Requests.

## 3. Files to create, in this order

Use the `php artisan make:*` generators so namespaces start right.

1. **Migration** — `php artisan make:migration create_{things}_table`
   - `foreignId('user_id')->constrained()` for employee-owned rows. Choose `cascadeOnDelete()` or `restrictOnDelete()` deliberately and say which.
   - Indexes on columns you filter or sort by; `unique()` where the domain needs it.
   - A column that is `nullable` in validation must be `nullable()` in the migration.
   - Reference other tables by foreign key, not by copying a name string. Text copies like `employee_profiles.position` are a known problem: renames don't cascade.
2. **Model** — `php artisan make:model {Thing} -f` (with factory). Explicit `$fillable` with only real columns, `casts()` for dates, booleans and decimals, and relationships.
3. **Form Requests** (Pattern B) — `php artisan make:request Admin/Store{Thing}Request` and `Update{Thing}Request`. `authorize()` checks the role; `rules()` holds the validation. Pattern A may validate inline like `PositionController`.
4. **Service** (Pattern B, when there is logic) — `app/Services/{Thing}Service.php`. Multi-step writes go in `DB::transaction()`; writes that check and change a balance lock the row (`lockForUpdate()`).
5. **Controller** — `php artisan make:controller Admin/{Feature}/{Thing}Controller`. Methods return `Inertia::render('Admin/{Feature}/Index', [...])` for pages and `back()` or `redirect()->route(...)` after writes. Pass only the fields the page needs. Use `->paginate()` for growing lists.
6. **Routes** — in `routes/web.php`, inside the group with the right `role:` middleware. Named `admin.{things}.{action}`. Run the `hrms-authz-check` checklist on every route now.
7. **Page** — `resources/js/pages/Admin/{Feature}/Index.tsx`, matching the `Inertia::render` string exactly. Run the `ui-consistency` phases for the page. Call the backend through the Wayfinder helpers (`@/routes/admin/...`), which Vite regenerates once the routes exist.
8. **Sidebar link** — `resources/js/components/app-sidebar.tsx` keeps separate nav arrays per role (`superAdminNavItems`, the admin items, the employee items). Add the link to every role that may open the route, and only those.
9. **Seeder** (only if the table needs starting data) — `database/seeders/{Thing}Seeder.php`, idempotent with `updateOrCreate`, registered in `DatabaseSeeder`.
10. **Tests** — `tests/Feature/Admin/{Thing}Test.php` in Pest. Follow `tests/Feature/LeaveApplicationHttpTest.php`: create roles with `Role::findOrCreate(...)` in `beforeEach`, users with `User::factory()`, and fake notifications and mock PDF services. Cover at least:
    - guest redirected to login; employee gets 403; wrong admin role gets 403
    - list page renders with the expected props (`AssertableInertia`)
    - create, update and delete work, with validation errors for bad input
    - delete is blocked while the record is in use, if there is a guard

## 4. Known gaps to work around

- **Flash messages are not shared with Inertia yet**, so `back()->with('success', ...)` shows nothing. Pages currently show their own toast in `onSuccess`. Do the same, and keep `->with()` on the server so it works once flash sharing is fixed.
- **No policies exist yet.** If the feature needs per-record rules beyond role and owner, create `app/Policies/{Model}Policy.php` and say so.
- Don't copy the route closures in `routes/web.php` or the `hr` role checks; both are known deviations.

## 5. Verify before calling it done

Run each, and report the result honestly:

1. `php artisan migrate` (ask first if the database holds data you care about)
2. `php artisan route:list --path={prefix} -v` — middleware is as planned
3. `php artisan test --filter={Thing}`
4. `composer test:lint` (or `composer lint` to fix formatting)
5. `npm run types` and `npm run lint`
6. Open the page in the running app and try add, edit and delete once

## Report

List the files created, the routes with their middleware, the test results, and anything left for the user to decide.
