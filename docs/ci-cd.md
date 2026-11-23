# CI/CD for the HRIS

CI = GitHub checks every change automatically. CD = a button that puts a checked version on the office server.

```
You push a branch / open a pull request
        |
        v
 CI runs on GitHub: tests, type check, production build
        |   red = do not merge        green = safe to merge
        v
 Merge into main  ->  CI runs again on main
        |
        v
 You click "Deploy to production"  (GitHub > Actions tab)
        |
        v
 The runner on the office server:
   1. checks that exact commit passed CI
   2. moves the app folder to exactly that commit
   3. backs up the database
   4. runs deploy.ps1 (maintenance mode, install, build, migrate, restart services, smoke test)
```

Files: `.github/workflows/ci.yml` (checks), `.github/workflows/deploy.yml` (the button), `.github/scripts/` (the two helper scripts the button uses), `backup-database.ps1`, and the existing `deploy.ps1`.

## What CI checks

| Check | If it fails |
|---|---|
| All tests (`vendor/bin/pest`) | the run is **red**: do not merge, do not deploy |
| Type check (`npm run types`) | red |
| Production build (`npm run build`) | red |
| PHP code style (Pint), only the files you changed | yellow **warning**, run goes on |
| TypeScript lint (ESLint), only the files you changed | yellow warning |
| Security advisories (`composer audit`, `npm audit`) | yellow warning |

Style and advisories only warn because about 90 older PHP files and some older TypeScript files do not pass yet. Checking only the files a change touches keeps new work clean without a giant reformat. When the old files are cleaned up, remove the `|| echo "::warning ..."` part of those steps in `ci.yml` to make them block too.

Five tests are marked **skipped** (starter-kit email-verification and registration tests, in `tests/Feature/Auth/`). The app verifies email with an OTP and HR approves accounts, so those tests describe behaviour that no longer exists. They should be rewritten for the OTP flow, then the `->skip(...)` removed.

## One-time setup

### 1. Get the files onto GitHub
Commit and push the `.github/` folder, `backup-database.ps1` and this file. The Deploy button only appears once `deploy.yml` is on the `main` branch.

### 2. GitHub settings (repo > Settings)
- **Secrets and variables > Actions > Variables > New repository variable**
  - `APP_DIR` (required): the folder IIS serves the app from, for example `C:\inetpub\hrms`.
  - `BACKUP_DIR` (recommended): where database copies go, for example `D:\hrms-backups`. Pick a folder outside any web root that only the server administrators can open. The copies contain personal data.
- **Branches > Add rule for `main`**: require a pull request and require the check **Tests, types and build**. (GitHub only offers branch rules on private repos with a paid plan. Without it, simply merge only green pull requests.)

### 3. Install the runner on the production server
GitHub cannot reach a server inside the office network, so a small program on the server connects *out* to GitHub and waits for work. Nothing is opened inbound.

1. Repo > Settings > Actions > Runners > **New self-hosted runner** > Windows x64. GitHub shows the download and the commands with a one-time token.
2. Follow them in an administrator PowerShell, but configure it like this:
   ```
   .\config.cmd --url https://github.com/darfo5ict/darfo5-hrms --token <TOKEN FROM GITHUB> --labels darfo5-prod --runasservice --windowslogonaccount <ADMIN ACCOUNT>
   ```
   The label must be exactly `darfo5-prod` (the workflow asks for `self-hosted`, `windows` and `darfo5-prod`).
3. The account the service runs as must have:
   - **administrator rights** (`deploy.ps1` requires them and restarts the `LaravelQueueWorker` and `LaravelReverb` services),
   - `git`, `php`, `composer`, `node`, `npm` and `mysqldump` on the **system** PATH (a service does not see a user's own PATH; or set `MYSQLDUMP_PATH` for mysqldump),
   - write access to `APP_DIR` and `BACKUP_DIR`.
4. The runner should show as **Idle** in GitHub.

Keep the repository private. Only people with write access to it can start the Deploy workflow, and it has no pull-request trigger, so outside contributors can never run anything on the server.

### 4. Check the app folder
`APP_DIR` must be a git clone of this repository (remote `origin`), on the branch `main`, with no uncommitted changes to tracked files. The deploy refuses to continue, before touching the site, if any of that is wrong. `.env`, `storage/` and other untracked files are never touched.

### 5. First deploy
Do it at a quiet hour. GitHub > Actions > **Deploy to production** > Run workflow > branch `main` > Run. Watch the steps. The site is in maintenance mode for the part inside `deploy.ps1`, usually a minute or two.

## Day to day
1. Work on a branch, open a pull request, wait for CI to go green, merge.
2. Open Actions > Deploy to production > Run workflow when you want it live.
3. The option *Skip the frontend build* is only for a change that touched nothing in `resources/` and no package files.

## If something goes wrong
- **CI is red:** open the run, open the failing step. For a failing test, reproduce it with `vendor/bin/pest`.
- **Deploy stops at "Make sure this commit passed CI":** CI has not finished, or failed, for that commit. Wait or fix it.
- **Deploy stops at "Update the app folder":** the message says why (not on main, local changes, a commit on the server that GitHub does not have). Nothing was changed and the site is still up.
- **Deploy stops at "Back up the database":** usually mysqldump was not found or the database refused. The site is still up. Set `MYSQLDUMP_PATH` or fix the credentials in `.env`.
- **Deploy fails inside `deploy.ps1`:** the site stays in maintenance mode on purpose. Fix the cause and run the deploy again, or run `php artisan up` in `APP_DIR` to bring the old version back.

### Rolling back
1. On the server, in `APP_DIR`: `git log --oneline`, pick the last good commit, then `git reset --hard <that commit>` and `.\deploy.ps1`.
2. Database changes are not undone by that. If a migration changed data or structure and you must go back, put the site in maintenance mode (`php artisan down`) and restore the newest copy from `BACKUP_DIR`: `mysql -u root -p darfo5_hrms < darfo5_hrms-<date>.sql`. Anything entered after that copy was made is lost.
3. The next normal deploy works again: the folder is then *behind* `main`, which is fine.

## Good to know
- CI runs on Linux; the office server is Windows. Linux is stricter about upper and lower case in file names, so a first run can show a problem that never appears on Windows. It is still a real mistake worth fixing.
- Private repositories on GitHub's free plan include 2,000 minutes a month on GitHub's own machines. CI uses them; the runner on your server is free and uses none.
- The last 14 database copies are kept (`-Keep` in `backup-database.ps1`).
- Paid GitHub plans can add "environments" with required reviewers, an extra approval step before a deploy. The workflow works without it.
- To change the PHP or Node version CI uses, edit `php-version` and `node-version` in `ci.yml`.
