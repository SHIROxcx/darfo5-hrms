<#
.SYNOPSIS
    Moves the production app folder to exactly one commit (the one that passed CI) and touches nothing else.

.DESCRIPTION
    The app folder is a normal git clone that IIS serves. This fetches from GitHub and fast-forwards that clone to $Sha.
    It refuses to continue (before the site goes into maintenance mode) when:
      - the folder is not on the expected branch,
      - it has uncommitted changes to tracked files,
      - the folder already holds commits that $Sha does not have (for example after a manual hotfix).
    Files that are not tracked by git (.env, storage, the build output) are never touched.

.PARAMETER AppDir  the production app folder (the one with deploy.ps1)
.PARAMETER Sha     the commit to deploy
.PARAMETER Branch  the branch the folder must be on (default main)
.PARAMETER Token   the workflow's GITHUB_TOKEN, used to log in to GitHub for the fetch. Leave empty when the remote needs no login.
#>
param(
    [Parameter(Mandatory)] [string]$AppDir,
    [Parameter(Mandatory)] [string]$Sha,
    [string]$Branch = 'main',
    [string]$Token = ''
)

$ErrorActionPreference = 'Stop'

# git writes its progress to stderr, which Windows PowerShell treats as an error. Run it so only the exit code decides.
function Invoke-Git {
    # Plain function reading $args: an advanced function would read a git flag such as -e as one of its own parameters.
    $GitArguments = [string[]]$args
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & git @GitArguments 2>&1 | ForEach-Object { "$_" }
        $code = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previous
    }
    if ($code -ne 0) {
        throw "git $($GitArguments[0]) failed (exit code $code): $($output -join ' ')"
    }
    return $output
}

# For yes/no questions to git ("does this commit exist?"): returns the exit code and swallows git's own message.
function Test-Git {
    # Plain function reading $args: an advanced function would read a git flag such as -e as one of its own parameters.
    $GitArguments = [string[]]$args
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & git @GitArguments *> $null
        return $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previous
    }
}

if (-not (Test-Path (Join-Path $AppDir '.git'))) {
    throw "$AppDir is not a git clone. Check the APP_DIR variable in GitHub (Settings > Secrets and variables > Actions > Variables)."
}

Set-Location $AppDir

# The service account that runs this is not the account that owns the folder; git refuses that unless told it is fine.
# (Exit code 1 here only means "nothing listed yet", so this one lookup is not run through Invoke-Git.)
$trusted = @(& git config --global --get-all safe.directory 2>$null)
$normalized = $AppDir.Replace('\', '/')
if ($trusted -notcontains $normalized) {
    Invoke-Git config --global --add safe.directory $normalized | Out-Null
}

$onBranch = (Invoke-Git rev-parse --abbrev-ref HEAD | Select-Object -First 1).Trim()
if ($onBranch -ne $Branch) {
    throw "The app folder is on '$onBranch', not '$Branch'. Switch it back with: git checkout $Branch"
}

$dirty = Invoke-Git status --porcelain --untracked-files=no
if ($dirty) {
    throw "The app folder has uncommitted changes to tracked files, so nothing was changed:`n$($dirty -join "`n")"
}

if ($Token) {
    # The same login actions/checkout uses; passed for this one command only, never stored.
    $basic = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("x-access-token:$Token"))
    Write-Host "::add-mask::$basic"
    Invoke-Git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $basic" fetch origin $Branch | Out-Null
}
else {
    Invoke-Git fetch origin $Branch | Out-Null
}

if ((Test-Git cat-file -e "$Sha^{commit}") -ne 0) {
    throw "Commit $Sha is not on '$Branch' at GitHub. Run the deploy from the main branch."
}

$head = (Invoke-Git rev-parse HEAD | Select-Object -First 1).Trim()
if ($head -eq $Sha) {
    Write-Host "The app folder is already at $Sha."
}
else {
    if ((Test-Git merge-base --is-ancestor $head $Sha) -ne 0) {
        throw "The app folder has commits that $Sha does not contain (it is at $head). Nothing was changed. See 'Rolling back' in docs/ci-cd.md."
    }
    Invoke-Git merge --ff-only $Sha | Out-Null
}

Write-Host ("App folder is now at: " + (Invoke-Git log -1 --oneline | Select-Object -First 1)) -ForegroundColor Green
