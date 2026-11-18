---
name: hrms-authz-check
description: Authorization checklist for DARFO5 HRMS routes and controller actions. Use when adding or changing a route, a controller method, a broadcast channel or an Inertia prop that exposes employee data, and when asked whether a route is protected. Covers role middleware, ownership checks on id and token parameters, approval and active status, and data exposure.
---

# hrms-authz-check

Every new or changed route must pass this checklist before the work is done. HR data (PDS, service records, leave, government IDs, signatures) is personal data under RA 10173, so a missing check is a data leak, not a cosmetic bug.

## Roles in this project

| Role | Who | How it is checked |
|---|---|---|
| `superadmin` | System owner | `role:superadmin` |
| `admin` | HR staff | `role:admin`, or `role:admin\|superadmin` when both need it |
| employee | Every other approved user | No role check: `auth` + `verified` only |

There is **no `hr` role**. Some controllers check `hasAnyRole([... 'hr'])`; that entry never matches. Don't add it to new code.

## Checklist

Go through every item for each route you add or change. Report each as pass, fail or not applicable.

### 1. Route group
- [ ] The route sits inside a group with `auth` and `verified`, unless it is public by design (see item 6).
- [ ] Admin or superadmin features sit in a group with the right `role:` middleware. **The route middleware is the gate**; a check inside the controller is a second layer, not a replacement.
- [ ] The role matches who uses it. Leave, reference data and service records are `role:admin|superadmin`. Employee management and ARTA ID are `role:admin` only. If superadmins see a button for the feature, the route must allow them too, or the button must be hidden.

### 2. Ownership (IDOR)
Any route parameter that picks a record (`{id}`, `{userId}`, `{user}`, `{userToken}`, `{leaveRequest}`, `{serviceRecord}`) must be checked against the logged-in user.
- [ ] An employee can reach **only their own** records. Use the existing pattern:
  ```php
  if ($leaveRequest->user_id !== Auth::id()) {
      abort(403);
  }
  ```
- [ ] Where admins may view other users' records, the check allows the owner or an admin, nothing else:
  ```php
  if ($user->id !== Auth::id() && ! Auth::user()->hasAnyRole(['admin', 'superadmin'])) {
      abort(403);
  }
  ```
- [ ] **A `{userToken}` (`users.public_token`) is an identifier, not a permission.** Knowing a token must not grant access; ownership or role is still checked after the lookup. The token also appears in the public QR page.
- [ ] Lists filter by the user in the query (`->where('user_id', $user->id)`) rather than loading everything and filtering in React.
- [ ] Ids inside the request body (arrays of ids, `existing_attachments[]` file paths, `user_tokens[]`) are checked too, not only the URL parameter. A posted file path must belong to the same user and record; never trust a path from the request.

### 3. Account status
- [ ] The action respects `is_approved`, `access_revoked_at` and `employee_profiles.is_active`. These are currently checked **only at login**, so a deactivated employee's open session still works. For sensitive actions (filing leave, editing PDS, downloads), check the status in the controller, or add a middleware for it and apply it to the group.
- [ ] Actions that change a user's status (approve, revoke, deactivate) end that user's sessions when access is removed.

### 4. Validation and authorization order
- [ ] Authorization runs **before** validation, so an unauthorized user gets 403, not validation errors that reveal the form's fields. Use a Form Request's `authorize()` or check at the top of the method.
- [ ] Mass assignment is safe: use `$request->validated()` or explicit fields, never `$request->all()`. Role, approval and status columns can't be set from an employee's form.

### 5. Data exposure
- [ ] Inertia props and JSON responses send only the fields the page needs. Don't pass whole models that carry `password`, `two_factor_secret`, `public_token` or government ID numbers unless the page shows them.
- [ ] Files: personal documents go on a private disk and are served through a controller that runs the ownership check. The existing PDS attachments on the `public` disk are a known gap; don't add more there.
- [ ] Broadcast channels in `routes/channels.php` check that the user may listen. Private user channels match the user id, and admin channels check the role.

### 6. Public and throttled routes
- [ ] A route without `auth` is public **on purpose**, and the reason is in a code comment. Current public routes: `/employee/{employeeNumber}` (QR verification), `/pending-approval`, `/divisions` and `/positions` (registration form).
- [ ] Public pages show the minimum: name, position, office, photo. Never government IDs, contact details, birth date or salary.
- [ ] Public routes and anything guessable have a throttle (`throttle:30,1` on the QR page). Code and password checks (login, OTP verify, 2FA) must be throttled too. `POST /otp/verify` currently has none.

### 7. Local-only routes
- [ ] Debug and preview routes are inside `if (app()->environment('local'))` and still check ownership. The `/pds/html-preview` and `/service-records/html-preview` routes don't, which is a known gap.

### 8. Test it
For each new route, write a Pest feature test that proves:
- [ ] a guest is redirected to login
- [ ] an employee gets 403 on another employee's record
- [ ] the wrong role gets 403
- [ ] the right user or role succeeds

## Useful commands

- `php artisan route:list --path=admin -v` shows each route's middleware.
- `php artisan route:list --except-vendor` lists the app's routes, to spot any outside a protected group.

## Report

End with the checklist results per route. List each failure with the file and line, what an attacker could do, and the fix. Don't change unrelated routes without asking; list their problems separately.
