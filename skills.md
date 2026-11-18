# Claude Skills Plan: DARFO5 HRMS

This is the plan for the custom Claude Code skills on this project: what each one does and when to build or run it.

For how to use them day to day, see [skills-guide.md](skills-guide.md).

A skill is an instruction file that teaches Claude how this project does a recurring task. Each skill goes in `.claude/skills/<skill-name>/SKILL.md`, so everyone who works on the repo gets it.

## Build order

| # | Skill | When | Status |
|---|---|---|---|
| 1 | `dev-doctor` | Build first. The other skills need a working app. | Created |
| 2 | `architecture-guard` | Build second. | Created |
| 3 | `hrms-authz-check` | Build third. | Created |
| 4 | `admin-module` | Build after 1–3. It depends on them. | Created |
| 5 | `official-form-pdf` | Build when a new government form PDF is needed. | Created |
| 6 | `notify-employee` | Build when a new notification or email is needed. | Created |
| 7 | `security-hardening` | Run before every deployment. | Created |
| 8 | `dead-code-cleanup` | Run once the modules are stable. | Created |
| 9 | `csc-hr-rules` | Build only after HR confirms the leave and SPMS rules. | Created (confirmed rules only); pending rules wait on HR's answers in `hr-policy-questions.md` |

## Skills

### 1. `dev-doctor`
Fixes `.env` and starts the app.
- Checks `APP_KEY`, `DB_CONNECTION=mysql` and its DB settings, the `REVERB_APP_*` / `VITE_REVERB_*` keys, and `BROADCAST_CONNECTION=reverb`.
- Checks that MySQL is running.
- Fixes what's missing, clears the config cache, and starts `composer dev`.
- Confirms Vite wrote `public/hot`. If it didn't, falls back to `npm run build`.

### 2. `architecture-guard`
Sets file placement and naming rules.
- Controllers go under role namespaces (`Admin/`, `SuperAdmin/`). Business logic goes in `app/Services/`, validation in Form Requests, and authorization in Policies.
- Page paths under `resources/js/pages/` mirror the `Inertia::render('…')` name.
- No business logic inside `routes/web.php`.
- Never edit the generated Wayfinder files (`resources/js/routes`, `actions`, `wayfinder`).
- Claude checks these rules before creating any new file.

### 3. `hrms-authz-check`
Checks that each new route restricts access properly.
- The route sits in the right `role:` middleware group.
- Routes with `{id}`, `{userId}` or `{userToken}` check ownership, so employee A can't open employee B's records.
- No access control that exists only in the frontend.
- Approval and active status are respected.

### 4. `admin-module`
Scaffolds new admin features in this order: migration → model → controller in `Admin/` → route in the right `role:` group → Inertia page → Pest test.
- Follows `architecture-guard` and `hrms-authz-check`.
- Reuses the existing reference-data CRUD pattern (`LookupCrudTable`) where it fits.
- Used for new modules such as DTR, plantilla and reports.

### 5. `official-form-pdf`
Builds government form PDFs in the existing pattern:
- a Blade view under `resources/views/`
- a service with `buildHtml($model, preview: bool)`
- a local-only HTML preview route for layout work
- PDF output through `PdfBrowsershot`

This is the same approach as the PDS, Service Record and CSC Form 6.

### 6. `notify-employee`
Handles notifications and emails:
- a notification class under `app/Notifications/`
- a broadcast event and Reverb channel for live delivery
- an optional `mail` channel with `toMail()`, once real SMTP is configured

### 7. `security-hardening`
A whole-app audit, run before deployment. It covers the whole app, unlike `/security-review`, which only checks pending changes.
- **Routes:** every route is checked against its middleware and ownership checks.
- **IDOR:** probes on ID and token parameters.
- **Uploads:** files on the public disk and path-manipulation bugs.
- **Throttles:** login, OTP verify and the public QR page.
- **Configuration:** `APP_DEBUG`, secure cookies, security headers and default seeded passwords.
- **Dependencies:** `composer audit` and `npm audit`.
- **Data exposure:** fields exposed by the public employee page and Inertia props.

It runs probes against the local instance only. The output is a findings report with severities, and it makes no fixes without approval.

### 8. `dead-code-cleanup`
Removes unused code once the modules are stable.
- **Finds:** routes pointing to missing methods, methods with no route, models with no table or usage, unused pages, components, columns and packages, and duplicated logic.
- **Checks indirect usage before deleting anything:** `Inertia::render` strings, Blade views, auto-discovered events and listeners.
- **Protects generated files:** never touches Wayfinder output.
- **Deletes only with confirmation:** works on a git branch, shows the list first, and deletes only what is confirmed.
- **Verifies afterward:** runs `composer test`, `npm run types` and `npm run build`.

### 9. `csc-hr-rules`
A reference for CSC rules: leave accrual (1.25 days a month for VL/SL), carry-over and caps, monetization, the leave types in CSC Form 6, the PDS, and SPMS/IPCR.
- **Blocked:** build only after HR confirms the rules. The current leave code marks them "pending HR policy input".

## Built-in skills (already available)

| Skill | Use |
|---|---|
| `ui-consistency` | Keeps new and changed pages consistent. It runs automatically. |
| `frontend-design` | Designing new screens |
| `/code-review` | Checks changes for bugs before committing |
| `/security-review` | Security check of pending changes |
| `/simplify` | Cleans up recently changed code |
| `run` | Starts the app and checks a change works |
| `xlsx` / `docx` / `pdf` | Excel, Word and PDF files |
| `skill-creator` | Creates and tests the custom skills above |
