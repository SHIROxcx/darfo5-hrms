<#
.SYNOPSIS
    Saves a copy of the HRIS database, and keeps only the newest copies.

.DESCRIPTION
    Run by the deploy workflow just before a deploy (which runs migrations), so there is always a copy to go back to.
    It reads the connection from .env, writes a plain .sql file with mysqldump, checks that the file really finished, then
    deletes the oldest copies beyond -Keep. It stops with an error if anything is wrong, and the deploy stops with it.

    The copies hold personal data: keep the folder outside any web root and readable only by the people who run the server.

.PARAMETER Directory  where copies go. Default: the BACKUP_DIR environment variable, else a "hrms-backups" folder next to the app folder.
.PARAMETER Keep       how many copies to keep (default 14).
.PARAMETER MysqlDump  full path to mysqldump.exe when it is not found automatically (or set the MYSQLDUMP_PATH environment variable).

.EXAMPLE
    .\backup-database.ps1 -Directory D:\hrms-backups
#>
param(
    [string]$Directory = '',
    [int]$Keep = 14,
    [string]$MysqlDump = ''
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Get-EnvValue([string]$Key) {
    $line = Get-Content .env | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if ($line) { return ($line -replace "^$Key=", '').Trim().Trim('"') }
}

if (-not (Test-Path .env)) { throw '.env is missing.' }
if ((Get-EnvValue 'DB_CONNECTION') -ne 'mysql') { throw 'This backup script only knows MySQL (DB_CONNECTION=mysql).' }

$dbHost = Get-EnvValue 'DB_HOST'
$dbPort = Get-EnvValue 'DB_PORT'
$dbName = Get-EnvValue 'DB_DATABASE'
$dbUser = Get-EnvValue 'DB_USERNAME'
$dbPassword = Get-EnvValue 'DB_PASSWORD'
if (-not $dbHost) { $dbHost = '127.0.0.1' }
if (-not $dbPort) { $dbPort = '3306' }
if (-not $dbName -or -not $dbUser) { throw 'DB_DATABASE and DB_USERNAME must be set in .env.' }

# --- Find mysqldump ----------------------------------------------------------

$candidates = @()
if ($MysqlDump) { $candidates += $MysqlDump }
if ($env:MYSQLDUMP_PATH) { $candidates += $env:MYSQLDUMP_PATH }
$onPath = Get-Command mysqldump.exe -ErrorAction SilentlyContinue
if ($onPath) { $candidates += $onPath.Source }
foreach ($pattern in 'C:\wamp64\bin\mysql\*\bin\mysqldump.exe', 'C:\wamp64\bin\mariadb\*\bin\mysqldump.exe',
    'C:\Program Files\MySQL\*\bin\mysqldump.exe', 'C:\Program Files\MariaDB*\bin\mysqldump.exe', 'C:\xampp\mysql\bin\mysqldump.exe') {
    $candidates += Get-ChildItem $pattern -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | ForEach-Object FullName
}
$dump = $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $dump) {
    throw 'mysqldump.exe was not found. Pass -MysqlDump <path>, or set the MYSQLDUMP_PATH variable to its full path.'
}

# --- Where to write ----------------------------------------------------------

if (-not $Directory) { $Directory = $env:BACKUP_DIR }
if (-not $Directory) { $Directory = Join-Path (Split-Path $PSScriptRoot -Parent) 'hrms-backups' }
New-Item -ItemType Directory -Force -Path $Directory | Out-Null

$file = Join-Path $Directory ('{0}-{1}.sql' -f $dbName, (Get-Date -Format 'yyyyMMdd-HHmmss'))

# --- Dump --------------------------------------------------------------------

$arguments = @("--host=$dbHost", "--port=$dbPort", "--user=$dbUser", '--single-transaction', '--routines', '--triggers',
    '--default-character-set=utf8mb4', "--result-file=$file")
# MySQL 8 wants PROCESS permission for tablespace information unless told not to; MariaDB's mysqldump does not know the option.
if ((& $dump --version) -notmatch 'MariaDB') { $arguments += '--no-tablespaces' }
$arguments += $dbName

Write-Host "Backing up '$dbName' to $file" -ForegroundColor Cyan

# The password goes in through the environment, so it never appears in a command line or in the log.
$env:MYSQL_PWD = $dbPassword
$previous = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $messages = & $dump @arguments 2>&1 | ForEach-Object { "$_" }
    $code = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $previous
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

if ($code -ne 0) {
    Remove-Item $file -ErrorAction SilentlyContinue
    throw "mysqldump failed (exit code $code): $($messages -join ' ')"
}

# A dump that was cut short has no closing line; do not trust it.
if (-not (Test-Path $file) -or (Get-Item $file).Length -lt 1024) { throw "The backup file is missing or too small: $file" }
if (-not ((Get-Content $file -Tail 5) -match 'Dump completed')) { throw "The backup did not finish (no 'Dump completed' line): $file" }

$megabytes = [Math]::Round((Get-Item $file).Length / 1MB, 2)
Write-Host "Backup saved ($megabytes MB)." -ForegroundColor Green

# --- Keep only the newest copies --------------------------------------------

$old = Get-ChildItem $Directory -Filter "$dbName-*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -Skip $Keep
foreach ($item in $old) {
    Remove-Item $item.FullName
    Write-Host "Removed old backup $($item.Name)"
}
