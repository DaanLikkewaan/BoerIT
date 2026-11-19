<#
.SYNOPSIS
    Creates the Azure resources for the BoerIT beta and production environments.

.DESCRIPTION
    Run once, after signing in with `az login`. Creates:

      Resource group        rg-<Prefix>
      App Service plan      plan-<Prefix>            Linux, Basic B1 - shared by all four apps
      Web apps              <Prefix>-api-beta        .NET 10   (beta API)
                            <Prefix>-ui-beta         Node 22   (beta website)
                            <Prefix>-api             .NET 10   (production API)
                            <Prefix>-ui              Node 22   (production website)
      PostgreSQL server     <Prefix>-db              Flexible Server, Burstable B1ms, 32 GB
                            databases boerit_beta and boerit_prod are created by the
                            API itself on first start (DbUp)
      Deployment identity   <Prefix>-github-deploy   lets GitHub Actions deploy, with no
                            stored password, only from the `beta` and `production`
                            GitHub environments, and only into this resource group

    Beta and production share one App Service plan and one database server to
    keep the cost of a two-environment demo close to that of one. They are kept
    apart by separate apps, separate databases and separate secrets.

    At the end it prints every value GitHub needs and saves them to a file in
    your user folder (NOT in the repository - it contains secrets).

    Safe to re-run: existing resources are left alone, but NEW secrets (database
    password, JWT secrets) are only generated for resources it creates.

.PARAMETER Prefix
    Short, lowercase, globally unique name stem, e.g. "boerit-daan". Letters,
    digits and hyphens only. Becomes part of every resource name and URL.

.PARAMETER Location
    Azure region. Defaults to South Africa North (Johannesburg).

.PARAMETER GitHubRepo
    owner/name of the GitHub repository allowed to deploy.

.EXAMPLE
    az login
    ./deploy/azure-setup.ps1 -Prefix boerit-daan
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-z][a-z0-9-]{2,20}[a-z0-9]$')]
    [string]$Prefix,

    [string]$Location = 'southafricanorth',

    [string]$GitHubRepo = 'DaanLikkewaan/BoerIT'
)

$ErrorActionPreference = 'Stop'

# -- Helpers -------------------------------------------------------------------

# az is a native command: a failure sets $LASTEXITCODE but does not throw.
function Invoke-Az {
    $output = & az @args
    if ($LASTEXITCODE -ne 0) { throw "az $($args -join ' ') failed (exit code $LASTEXITCODE)." }
    return $output
}

# Windows PowerShell turns redirected stderr from a native command into an
# error record, which 'Stop' would make fatal - so relax it just for the probe.
function Test-AzResource {
    $ErrorActionPreference = 'Continue'
    & az @args --output none 2>$null
    return $LASTEXITCODE -eq 0
}

# Letters and digits only, so it can go into a connection string without escaping.
function New-Secret([int]$Length = 32) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'.ToCharArray()
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
    # Postgres requires upper, lower and digit; guarantee all three.
    return "Bt7$secret"
}

function Write-Step([string]$Text) { Write-Host "`n> $Text" -ForegroundColor Cyan }

# -- Preconditions -------------------------------------------------------------

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'The Azure CLI (az) is not installed. See docs/deployment.md, step 2.'
}

$account = Invoke-Az account show --output json | ConvertFrom-Json
Write-Host "Subscription: $($account.name) ($($account.id))" -ForegroundColor Yellow
Write-Host "Region:       $Location"
Write-Host "Prefix:       $Prefix"
$answer = Read-Host 'Create the BoerIT resources in this subscription? (y/n)'
if ($answer -ne 'y') { Write-Host 'Stopped - nothing was created.'; return }

$resourceGroup = "rg-$Prefix"
$plan          = "plan-$Prefix"
$dbServer      = "$Prefix-db"
$dbAdmin       = 'boeritadmin'
$apps = [ordered]@{
    beta       = @{ Api = "$Prefix-api-beta"; Ui = "$Prefix-ui-beta"; Database = 'boerit_beta' }
    production = @{ Api = "$Prefix-api";      Ui = "$Prefix-ui";      Database = 'boerit_prod' }
}

# New subscriptions often have these switched off, which makes the first create fail.
Write-Step 'Registering resource providers'
foreach ($provider in 'Microsoft.Web', 'Microsoft.DBforPostgreSQL') {
    Invoke-Az provider register --namespace $provider --wait --output none
}

# -- Resource group & App Service plan -----------------------------------------

Write-Step "Resource group $resourceGroup"
Invoke-Az group create --name $resourceGroup --location $Location --output none
$resourceGroupId = Invoke-Az group show --name $resourceGroup --query id --output tsv

Write-Step "App Service plan $plan (Linux, B1)"
if (-not (Test-AzResource appservice plan show --name $plan --resource-group $resourceGroup)) {
    Invoke-Az appservice plan create --name $plan --resource-group $resourceGroup `
        --location $Location --is-linux --sku B1 --output none
}

# -- Web apps ------------------------------------------------------------------

function New-WebApp([string]$Name, [string]$Runtime) {
    Write-Step "Web app $Name ($Runtime)"
    if (-not (Test-AzResource webapp show --name $Name --resource-group $resourceGroup)) {
        Invoke-Az webapp create --name $Name --resource-group $resourceGroup `
            --plan $plan --runtime $Runtime --output none
    }
    # Always on: no slow first page after the app has been idle.
    # HTTPS only: plain HTTP is redirected.
    Invoke-Az webapp config set --name $Name --resource-group $resourceGroup `
        --always-on true --min-tls-version 1.2 --ftps-state Disabled --output none
    Invoke-Az webapp update --name $Name --resource-group $resourceGroup --https-only true --output none
    return "https://" + (Invoke-Az webapp show --name $Name --resource-group $resourceGroup --query defaultHostName --output tsv)
}

foreach ($stage in $apps.Keys) {
    $apps[$stage].ApiUrl = New-WebApp $apps[$stage].Api 'DOTNETCORE:10.0'
    $apps[$stage].UiUrl  = New-WebApp $apps[$stage].Ui  'NODE:22-lts'
}

# -- PostgreSQL ----------------------------------------------------------------

Write-Step "PostgreSQL Flexible Server $dbServer (Burstable B1ms, 32 GB) - takes a few minutes"
$dbPassword = $null
if (-not (Test-AzResource postgres flexible-server show --name $dbServer --resource-group $resourceGroup)) {
    $dbPassword = New-Secret 28
    # --public-access 0.0.0.0 admits Azure services only (the web apps), not the internet.
    Invoke-Az postgres flexible-server create --name $dbServer --resource-group $resourceGroup `
        --location $Location --tier Burstable --sku-name Standard_B1ms --storage-size 32 `
        --version 17 --admin-user $dbAdmin --admin-password $dbPassword `
        --public-access 0.0.0.0 --high-availability Disabled --yes --output none
} else {
    Write-Host '  Already exists - keeping its current admin password (not shown).' -ForegroundColor Yellow
}
$dbHost = Invoke-Az postgres flexible-server show --name $dbServer --resource-group $resourceGroup `
    --query fullyQualifiedDomainName --output tsv

# -- Deployment identity for GitHub Actions (OpenID Connect) -------------------

$identityName = "$Prefix-github-deploy"
Write-Step "Deployment identity $identityName"

$appId = Invoke-Az ad app list --display-name $identityName --query '[0].appId' --output tsv
if (-not $appId) {
    $appId = Invoke-Az ad app create --display-name $identityName --query appId --output tsv
}
if (-not (Test-AzResource ad sp show --id $appId)) {
    Invoke-Az ad sp create --id $appId --output none
}

# Trust GitHub's tokens, but only for runs in the beta or production environment of this repo.
$existingCredentials = Invoke-Az ad app federated-credential list --id $appId --query '[].name' --output tsv
foreach ($stage in $apps.Keys) {
    $credentialName = "github-$stage"
    if ($existingCredentials -contains $credentialName) { continue }
    $file = New-TemporaryFile
    @{
        name      = $credentialName
        issuer    = 'https://token.actions.githubusercontent.com'
        subject   = "repo:${GitHubRepo}:environment:$stage"
        audiences = @('api://AzureADTokenExchange')
    } | ConvertTo-Json | Set-Content -Path $file -Encoding ascii
    Invoke-Az ad app federated-credential create --id $appId --parameters "@$file" --output none
    Remove-Item $file
}

# Contributor on this resource group only - it cannot touch anything else in the subscription.
# A brand-new identity can take a moment to become visible, so retry briefly.
$ErrorActionPreference = 'Continue'
for ($attempt = 1; $attempt -le 6; $attempt++) {
    & az role assignment create --assignee $appId --role Contributor --scope $resourceGroupId --output none 2>$null
    if ($LASTEXITCODE -eq 0) { break }
    if ($attempt -eq 6) { throw 'Could not grant the deployment identity access to the resource group.' }
    Start-Sleep -Seconds 10
}
$ErrorActionPreference = 'Stop'

# -- Report --------------------------------------------------------------------

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("BoerIT Azure setup - $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
$lines.Add('KEEP THIS FILE PRIVATE. Delete it once the values are stored in GitHub and your password manager.')
$lines.Add('')
$lines.Add('== GitHub: Settings > Secrets and variables > Actions > Repository secrets ==')
$lines.Add("AZURE_CLIENT_ID        = $appId")
$lines.Add("AZURE_TENANT_ID        = $($account.tenantId)")
$lines.Add("AZURE_SUBSCRIPTION_ID  = $($account.id)")

foreach ($stage in $apps.Keys) {
    $a = $apps[$stage]
    $lines.Add('')
    $lines.Add("== GitHub: Settings > Environments > $stage ==")
    $lines.Add('-- Environment variables --')
    $lines.Add("AZURE_RESOURCE_GROUP   = $resourceGroup")
    $lines.Add("API_APP_NAME           = $($a.Api)")
    $lines.Add("UI_APP_NAME            = $($a.Ui)")
    $lines.Add("API_URL                = $($a.ApiUrl)")
    $lines.Add("UI_URL                 = $($a.UiUrl)")
    $lines.Add('-- Environment secrets --')
    $lines.Add("JWT_SECRET             = $(New-Secret 48)")
    if ($dbPassword) {
        $lines.Add("DB_CONNECTION_STRING   = Host=$dbHost;Port=5432;Database=$($a.Database);Username=$dbAdmin;Password=$dbPassword;SSL Mode=Require")
    } else {
        $lines.Add("DB_CONNECTION_STRING   = Host=$dbHost;Port=5432;Database=$($a.Database);Username=$dbAdmin;Password=<existing admin password>;SSL Mode=Require")
    }
    $lines.Add('DEMO_USERS             = (you write this - see docs/deployment.md, step 6)')
}

if ($dbPassword) {
    $lines.Add('')
    $lines.Add("Database admin: $dbAdmin / $dbPassword  - also save this in your password manager.")
}

$reportPath = Join-Path $HOME "boerit-azure-setup-$Prefix.txt"
$lines | Set-Content -Path $reportPath -Encoding utf8

Write-Host ''
$lines | ForEach-Object { Write-Host $_ }
Write-Host ''
Write-Host "Saved to $reportPath" -ForegroundColor Green
Write-Host 'Next: docs/deployment.md, step 5 (put these values into GitHub).' -ForegroundColor Green
