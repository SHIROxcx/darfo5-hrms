---
name: dead-code-cleanup
description: Finds and safely removes unused code in DARFO5 HRMS — files, classes, controller methods, routes, React pages and components, models, columns, packages and duplicated logic — with every candidate verified before deletion and the app tested afterward. Use when asked to clean up, remove unused or dead code, delete files that aren't needed, reduce duplication, or tidy the codebase once modules are stable.
---

# dead-code-cleanup

Removes code that nothing uses, without breaking anything. In a Laravel + Inertia app much code is reached **by name, not by import** (route strings, view names, auto-discovered classes), so "no import found" does not mean "unused". Every candidate is proved unused before it goes.

## Ground rules

- **Branch first.** Run `git status`; if there are uncommitted changes, ask the user to commit or stash them. Then work on a new branch (`cleanup/<date>`). Never clean up on `main`.
- **List, then confirm, then delete.** Show the full candidate list with evidence and let the user choose what goes. Delete nothing that wasn't confirmed.
- **Small batches.** Delete one group at a time (for example "unused models"), run the checks, then commit that batch alone, so any breakage is easy to find and revert.
- **Never touch:** generated Wayfinder output (`resources/js/routes`, `actions`, `wayfinder`), `vendor/`, `node_modules/`, `public/build`, and migrations that have already run.
- **Don't refactor while deleting.** Merging duplicated logic is a separate, later step (see "Duplicates").

## 1. Find candidates

Check each category. For each candidate, record **why** it looks unused.

| Category | How to find it |
|---|---|
| Routes pointing to missing methods | Compare `php artisan route:list --except-vendor` with the controller methods. These are bugs, not dead code: report them, don't delete the route without asking (7 profile routes in `UserProfileController` are known). |
| Controller methods with no route | Public methods not in `route:list` and not called from other code |
| Models with no table or use | No migration creates their table and nothing references the class (`EmployeeDegree`, `EmployeeEligibility`, `EmployeeGraduateStudy` are known) |
| Services, Concerns, Support classes | No reference anywhere in `app/`, `routes/`, `database/`, `tests/` |
| React pages | No `Inertia::render('…')` or `inertia('…')` uses their path (`pages/dashboard.tsx` is known) |
| React components, hooks, lib, types | No import anywhere in `resources/js` (search the file name without extension) |
| Blade views | No `view('…')`, `@include`, `@extends`, or `markdown('…')` uses them |
| Columns | No read or write in the code (`leave_types.requires_approval`, `leave_requests.attachment_path` are known) |
| Packages | Composer or npm packages never imported (`barryvdh/laravel-dompdf` is known) |
| Fillable entries | `$fillable` keys with no matching column (`EmployeeProfile` lists nine) |
| Commented-out code blocks | Large commented sections in PHP and TSX |
| Config and env keys | Keys never read with `config('…')` or `env('…')` |

Optional tools need the user's approval to install: `npx knip` for unused TS files and exports, and Larastan (`phpstan`) for unused PHP code. Searching by hand is enough without them.

## 2. Prove each candidate unused

Before a candidate goes on the delete list, search for **all** the ways this project reaches code by name:

- **Inertia page:** the page path as a string in PHP: `Inertia::render('Admin/Leave/Index'` and `inertia('…')`
- **Blade view:** the dotted name (`leave.csc-form-6`) in `view(`, `@include`, `@extends`, `markdown(`
- **Events and listeners:** auto-discovered from `app/Listeners`; check `php artisan event:list` and every `::dispatch(` / `event(`
- **Commands:** auto-registered from `app/Console/Commands`; check `routes/console.php` schedules and docs
- **Notifications and mail:** `->notify(new …)`, `Notification::send`, `Mail::to(…)->send`
- **Fortify actions and providers:** registered in `FortifyServiceProvider` / `bootstrap/app.php`
- **Seeders and factories:** `DatabaseSeeder`, tests (`$this->seed(…)`), and `Model::factory()`
- **Broadcast event names:** `broadcastAs()` strings used in `.listen('.name'` in the frontend
- **Routes:** route names used through `route('…')` in PHP and Wayfinder imports (`@/routes/...`, `@/actions/...`) in TSX
- **Dynamic strings:** `PdsController::saveSection` dispatches by section name; check `match`/`switch` blocks and string-built class or method names
- **Tests:** a class used only by tests is still used, unless the test is for dead code too

If any search hits, it isn't dead. If a candidate is reached only through something itself dead, list them together.

## 3. Show the list

Present a table and wait for the user's choice:

| # | Item | Type | Evidence it's unused | Risk | Delete? |
|---|---|---|---|---|---|

Risk is **low** (no references at all), **medium** (referenced only by other dead code or docs), or **high** (reached dynamically, or a column with data). Mark high-risk items "keep for now" unless the user insists.

## 4. Delete safely

- **Files and classes:** delete the file, then remove leftover imports.
- **Columns:** never edit an old migration. Create a new migration that drops the column (`php artisan make:migration drop_{column}_from_{table}_table`), with a `down()` that restores it. Check the column holds no data first (`SELECT COUNT(*) … WHERE col IS NOT NULL`), and ask before running it.
- **Packages:** `composer remove <package>` / `npm uninstall <package>`, so the lock file updates.
- **Fillable and config keys:** remove the entry; leave real columns and used keys alone.
- **Documentation:** update `DOCUMENTATION.md` and `CLAUDE.md` where they mention removed items (for example §10.6 of the docs lists the known dead code).

## 5. Verify after each batch

Run all of these and report the results honestly. If anything fails, restore the batch (`git checkout -- <files>` for that batch only, after `git status`) and investigate:

1. `composer test` (Pint check + Pest)
2. `npm run types`
3. `npm run lint`
4. `npm run build` (catches missing imports in pages)
5. `php artisan route:list` (fails loudly if a route points to a deleted controller)
6. Open the main pages in the running app: dashboard, PDS, profile, my leave, admin employees, admin leave

Then commit the batch with a message that lists what was removed and why.

## Duplicates (separate step)

Duplicated logic isn't dead code; merging it is a refactor. List the duplicates, propose one home for each (following `architecture-guard`), and do them only after the user agrees, one at a time, with tests. Known duplicates:
- PDS data assembly in `BuildsPdsData`, `PdsController::getPdsData`, `PdsPdfController::resolveData` and the `/pds/html-preview` closure (they differ slightly; compare before merging)
- `formatUser` in `EmployeeController` and `UserProfileController`
- `resolveOfficeAbbreviation` and `fileToDataUri` in several controllers and services

## Report

End with what was removed per batch, what was kept and why, the check results, and the branch name for the user to review and merge.
