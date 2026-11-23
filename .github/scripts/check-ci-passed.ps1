<#
.SYNOPSIS
    Stops the deploy unless the CI workflow passed for exactly this commit.

.DESCRIPTION
    The deploy is started by hand, so this is what stops someone from deploying a commit whose tests failed or never ran.
    It asks GitHub for the successful runs of the CI workflow (ci.yml) on this commit and fails when there is none.

.PARAMETER Repository  "owner/name", for example darfo5ict/darfo5-hrms
.PARAMETER Sha         the commit to deploy
.PARAMETER Token       the workflow's GITHUB_TOKEN (needs "actions: read")
#>
param(
    [Parameter(Mandatory)] [string]$Repository,
    [Parameter(Mandatory)] [string]$Sha,
    [Parameter(Mandatory)] [string]$Token,
    [string]$Workflow = 'ci.yml'
)

$ErrorActionPreference = 'Stop'

# Windows PowerShell 5.1 starts with old TLS versions; GitHub only accepts 1.2 and newer.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$uri = "https://api.github.com/repos/$Repository/actions/workflows/$Workflow/runs?head_sha=$Sha&status=success&per_page=1"
$headers = @{
    Authorization          = "Bearer $Token"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}

$result = Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 30

if ($result.total_count -lt 1) {
    throw "Commit $Sha has no passing '$Workflow' run. Wait for the CI run on main to finish (or fix what it found), then start the deploy again."
}

Write-Host "CI passed for $Sha ($($result.workflow_runs[0].html_url))." -ForegroundColor Green
