---
name: dev-doctor
description: Checks and repairs the local environment of DARFO5 HRMS, then starts the app with `composer dev`. Use when asked to start, run or restart the project, or when the app fails with MissingAppKeyException, "Database file at path [...database.sqlite] does not exist", ViteManifestNotFoundException, "You must pass your app key when you instantiate Pusher", or similar startup and configuration errors.
---

# dev-doctor

Get the local app into a working state, then start it. Work through the checks in order. Each check says what to look for and how to fix it. Fix only what is broken, and never overwrite a value that is already set and valid.

The shell is Windows. Use the PowerShell tool for `php`, `composer` and `npm`, and use `Select-String` instead of `grep` there.

## Rules

- **Back up first.** Before editing `.env` the first time, copy it to `.env.backup`. That exact name is git-ignored, while other backup names are not. If `.env.backup` already exists, ask before overwriting it.
- **Don't print secrets.** When reporting, show key names and whether they are set, never `APP_KEY`, `REVERB_APP_SECRET` or `DB_PASSWORD` values.
- **Never edit `.env.example` here.** It is committed and holds placeholders only.
- **No commits.** This skill changes local files only.

## Checks

### 1. `.env` exists
If `.env` is missing, copy `.env.example` to `.env`. Then continue: the checks below fill in what the example leaves as placeholders.

### 2. `APP_KEY`
Look for `APP_KEY=` followed by a `base64:` value.
- If it is empty, run `php artisan key:generate`.
- If it is set, leave it. Regenerating it logs everyone out and breaks encrypted data.

Symptom when missing: `Illuminate\Encryption\MissingAppKeyException`.

### 3. Database: MySQL, not SQLite
The project uses MySQL through WAMP. `.env` must have these lines, uncommented:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=darfo5_hrms
DB_USERNAME=root
DB_PASSWORD=
```

If `DB_CONNECTION=sqlite` is set or the `DB_*` lines are commented out, restore them. Keep any `DB_PASSWORD` value that is already set.

Symptom when wrong: `Database file at path [...database.sqlite] does not exist`.

Then check that MySQL is running: `Get-Process mysqld`. If it isn't, ask the user to start WAMP. Don't try to start it yourself.

### 4. Broadcasting and Reverb keys
`.env` must have:

```
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=<number>
REVERB_APP_KEY=<random string>
REVERB_APP_SECRET=<random string>
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

- Generate values only for keys that are missing, empty, or still a placeholder (`your-app-id`, `your-app-key`, `your-app-secret`). Use a random 6-digit number for the ID, 20 lowercase letters and digits for the key, and 40 for the secret.
- Don't add a key that already exists. Edit it in place.
- Don't touch the `REVERB_TLS_*` / `REVERB_VERIFY_TLS` lines.

Symptom when missing: "You must pass your app key when you instantiate Pusher" in the browser console.

**Vite reads `VITE_*` values only at startup.** If you changed any of them, the app must be (re)started after this check.

### 5. Clear cached config
After any `.env` change, run `php artisan config:clear`. A cached config hides `.env` edits. Don't run `config:cache` in local development.

### 6. Dependencies
- If `vendor/` is missing, run `composer install`.
- If `node_modules/` is missing, run `npm install`.

### 7. Database is migrated
Run `php artisan migrate:status`.
- If migrations are pending, ask before running `php artisan migrate`.
- If the database is empty, `php artisan migrate:fresh --seed` creates the roles, default users and reference data. **Always ask first**: it deletes all data.

## Start the app

1. **Check that it isn't already running.** Look for listeners on ports 8000 (Laravel), 5173 (Vite) and 8080 (Reverb):
   `Get-NetTCPConnection -LocalPort 8000,5173,8080 -State Listen -ErrorAction SilentlyContinue`
   - Nothing listening: go to step 2.
   - Everything listening and no `.env` change was made: the app is already up. Report the URL and stop.
   - Running, but `.env` changed in this session: the app needs a restart. Ask the user to stop the running `composer dev` (Ctrl+C in its terminal), or, with their approval, stop the processes that own those ports. Don't kill every `node` or `php` process: other apps may be using them.
2. **Start it** with `composer dev` as a background command. It runs the Laravel server, queue listener, Vite, Reverb and the scheduler together.
3. **Wait for the ready lines** in the output: `Server running on [http://127.0.0.1:8000]` and `VITE ... ready`.
4. **Check that `public/hot` exists.** Laravel uses this file to tell that the Vite dev server is up.
   - If it is missing while Vite reports ready, Laravel looks for a production build instead and throws `ViteManifestNotFoundException`. Run `npm run build` as a fallback, then tell the user that hot reload is off until `public/hot` appears, and that `resources/js` changes need another `npm run build` meanwhile.

## Report

End with a short table:

| Check | Result |
|---|---|
| `.env` | OK / created from example |
| `APP_KEY` | OK / generated |
| Database | OK / fixed, MySQL running |
| Reverb keys | OK / generated |
| Migrations | OK / N pending |
| App | Running at http://127.0.0.1:8000 |

Say what you changed and what still needs the user, such as starting WAMP or approving a migration. If the browser still shows an old error, tell them to hard refresh with Ctrl+Shift+R.
