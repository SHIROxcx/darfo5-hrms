#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Deploys the HRIS app on the production IIS server.

.DESCRIPTION
    Puts the app in maintenance mode, installs dependencies, builds the frontend,
    runs migrations, rebuilds Laravel caches, restarts the queue worker and Reverb
    services, brings the app back up, and smoke-tests the live URL.

    If any step fails the app is left in maintenance mode on purpose, so users
    never see a half-deployed build. Fix the problem, then re-run this script
    (or run `php artisan up`).

.PARAMETER Pull
    Run `git pull --ff-only` first.

.PARAMETER SkipFrontend
    Skip `npm ci` / `npm run build` (backend-only changes).

.EXAMPLE
    .\deploy.ps1 -Pull
#>
param(
    [switch]$Pull,
    [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$Services = 'LaravelQueueWorker', 'LaravelReverb'

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "`n==> $Name" -ForegroundColor Cyan
    # Native tools (composer, npm) write progress to stderr; in Windows PowerShell
    # that must not abort the deploy. Failures are detected by exit code instead.
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = 0
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Step '$Name' failed with exit code $LASTEXITCODE."
    }
}

function Get-EnvValue([string]$Key) {
    $line = Get-Content .env | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if ($line) { return ($line -replace "^$Key=", '').Trim('"') }
}

# --- Pre-flight checks -------------------------------------------------------

if (-not (Test-Path .env)) { throw '.env is missing.' }
if ((Get-EnvValue 'APP_ENV') -ne 'production') { throw 'APP_ENV must be "production" in .env.' }
if ((Get-EnvValue 'APP_DEBUG') -ne 'false') { throw 'APP_DEBUG must be "false" in .env.' }

$AppUrl = (Get-EnvValue 'APP_URL').TrimEnd('/')
if (-not $AppUrl) { throw 'APP_URL is not set in .env.' }

# --- Deploy ------------------------------------------------------------------

if ($Pull) {
    Invoke-Step 'Pulling latest code' { git pull --ff-only }
}

# Without index.php as a default document, IIS answers "/" with 403.14.
if (-not (Select-String -Path public\web.config -Pattern 'value="index.php"' -Quiet)) {
    throw 'public\web.config does not list index.php as a default document.'
}

Invoke-Step 'Entering maintenance mode' { php artisan down --retry=60 }

try {
    Invoke-Step 'Installing PHP dependencies' {
        composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
    }

    if (-not $SkipFrontend) {
        Invoke-Step 'Installing JS dependencies' { npm ci --no-audit --no-fund }
        Invoke-Step 'Building frontend' { npm run build }
    }

    Invoke-Step 'Running migrations' { php artisan migrate --force }

    Invoke-Step 'Rebuilding caches' {
        php artisan optimize:clear
        if ($LASTEXITCODE -ne 0) { return }
        php artisan optimize
    }

    Invoke-Step 'Restarting background services' {
        Restart-Service -Name $Services -ErrorAction Stop
    }
}
catch {
    Write-Host "`nDEPLOY FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'The app is still in maintenance mode. Fix the error, then re-run .\deploy.ps1 or run "php artisan up".' -ForegroundColor Yellow
    exit 1
}

Invoke-Step 'Leaving maintenance mode' { php artisan up }

# --- Smoke test --------------------------------------------------------------

Write-Host "`n==> Smoke test" -ForegroundColor Cyan
$failed = $false

foreach ($service in Get-Service -Name $Services) {
    $ok = $service.Status -eq 'Running'
    Write-Host ("  {0,-20} {1}" -f $service.Name, $service.Status) -ForegroundColor $(if ($ok) { 'Green' } else { 'Red' })
    if (-not $ok) { $failed = $true }
}

# -k: the server certificate is self-signed until a public CA cert is installed.
foreach ($path in '/', '/login') {
    $code = & curl.exe -sk -o NUL -w '%{http_code}' --max-time 15 "$AppUrl$path"
    $ok = $code -eq '200'
    Write-Host ("  {0,-20} HTTP {1}" -f $path, $code) -ForegroundColor $(if ($ok) { 'Green' } else { 'Red' })
    if (-not $ok) { $failed = $true }
}

if ($failed) {
    Write-Host "`nDeployed, but the smoke test failed. Check storage\logs\laravel.log." -ForegroundColor Red
    exit 1
}

Write-Host "`nDeploy complete." -ForegroundColor Green
