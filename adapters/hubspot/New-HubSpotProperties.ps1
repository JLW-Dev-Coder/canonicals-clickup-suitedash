<#
.SYNOPSIS
  Provision HubSpot custom properties + groups from fields.registry.json using a Service Key.
.DESCRIPTION
  Property definitions come from two places, in this order of authority:

    fields.registry.json     the original hand-authored registry, still the source for
                             every form that has no generated file.
    fields.<form>.json       GENERATED FROM THAT FORM'S CLOSED MAP by
                             adapters/hubspot/gen-fields-from-map.mjs. When one exists it is
                             AUTHORITATIVE for its form and the registry's rows for that form
                             are dropped, loudly. A closed map knows which keys the fill
                             engine actually consumes; the pre-map registry rows were authored
                             before there was a map to read, so keeping both would provision
                             two competing naming schemes for one form.

  Dropping the registry rows does NOT remove anything already live in the portal. Properties
  that were provisioned from a superseded scheme stay where they are and stay populated;
  retiring them is a separate, destructive decision that this script does not make.
.NOTES
  Credential: HubSpot Service Key (Bearer). Set it in the environment, never in the repo:
      $env:HUBSPOT_SERVICE_KEY = "pat-... or service-key-..."
  Required scopes on the key: crm.schemas.<object>.read  and  crm.schemas.<object>.write
.EXAMPLE
  # Dry run the 433-F pilot (plus routing fields) on Contacts:
  .\New-HubSpotProperties.ps1 -Forms 433f,vlp -DryRun
.EXAMPLE
  # Create them for real:
  .\New-HubSpotProperties.ps1 -Forms 433f,vlp
#>
[CmdletBinding()]
param(
  # Resolved against the SCRIPT's directory, not the caller's. The whole point of this file
  # is to be run from the repo root as .\adapters\hubspot\New-HubSpotProperties.ps1, and a
  # cwd-relative default silently fails to find its own registry when you do that.
  [string]$RegistryPath = (Join-Path $PSScriptRoot "fields.registry.json"),
  [string]$ObjectType   = "contacts",              # contacts | companies | deals | <custom object id>
  [string[]]$Forms      = @(),                      # e.g. 433f,vlp  (empty = all forms in the registry)
  [string]$ServiceKeyEnv= "HUBSPOT_SERVICE_KEY",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$token = [Environment]::GetEnvironmentVariable($ServiceKeyEnv)
if (-not $token) { throw "No token in `$env:$ServiceKeyEnv. Set it first: `$env:$ServiceKeyEnv = '<service key>'" }
$base    = "https://api.hubapi.com"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# PowerShell 5.1 still negotiates from its .NET default, which on this box does not include
# TLS 1.2. HubSpot requires it, and the failure surfaces as a bare "underlying connection was
# closed" that reads like a network problem rather than a protocol one.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$reg = Get-Content $RegistryPath -Raw | ConvertFrom-Json
Write-Host "Registry: $($reg.properties.Count) properties, $($reg.groups.Count) groups. Object: $ObjectType" -ForegroundColor Cyan

$props  = @($reg.properties)
$groups = @($reg.groups)

# ---- generated per-form definitions supersede the registry for their own form ----
$generated = Get-ChildItem -Path $PSScriptRoot -Filter "fields.*.json" |
             Where-Object { $_.Name -ne "fields.registry.json" }
foreach ($g in $generated) {
  $doc = Get-Content $g.FullName -Raw | ConvertFrom-Json
  $formName = $doc.meta.form
  if (-not $formName) { Write-Host "  ! $($g.Name) declares no meta.form - ignored" -ForegroundColor Red; continue }
  $superseded = @($props | Where-Object { $_.form -eq $formName })
  $props  = @($props  | Where-Object { $_.form -ne $formName })
  $groups = @($groups | Where-Object { $_.name -notin @($doc.groups | ForEach-Object { $_.name }) })
  $props  += @($doc.properties)
  $groups += @($doc.groups)
  Write-Host "  $($g.Name): $($doc.properties.Count) generated properties for form '$formName' (from $($doc.meta.generated_from), map v$($doc.meta.map_version))" -ForegroundColor Cyan
  if ($superseded.Count -gt 0) {
    Write-Host "    supersedes $($superseded.Count) registry row(s) for '$formName' - they are NOT provisioned from here." -ForegroundColor Yellow
    Write-Host "    Any of those already live in the portal stay live and stay populated; retiring them is a separate decision." -ForegroundColor Yellow
  }
}

# ---- filter by -Forms ----
if ($Forms.Count -gt 0) {
  # @() around every result: PowerShell 5.1 unwraps a one-element pipeline to a scalar, and a
  # scalar has no .Count — so a filter that legitimately matched ONE group printed "" groups
  # on the line below, which reads exactly like a filter that matched none.
  $props  = @($props  | Where-Object { $Forms -contains $_.form })
  $keep   = @($props | Select-Object -ExpandProperty group -Unique)
  $groups = @($groups | Where-Object { $keep -contains $_.name })
  Write-Host "Filtered to forms [$($Forms -join ', ')]: $($props.Count) properties, $($groups.Count) groups." -ForegroundColor Cyan
}

# ---- existing groups / properties (idempotency) ----
$existingGroups = @{}
(Invoke-RestMethod -Uri "$base/crm/v3/properties/$ObjectType/groups" -Headers $headers -Method Get).results |
  ForEach-Object { $existingGroups[$_.name] = $true }
$existingProps = @{}
(Invoke-RestMethod -Uri "$base/crm/v3/properties/$ObjectType" -Headers $headers -Method Get).results |
  ForEach-Object { $existingProps[$_.name] = $true }

# ---- create missing groups ----
foreach ($g in $groups) {
  if ($existingGroups[$g.name]) { Write-Host "  group exists: $($g.name)"; continue }
  $body = @{ name=$g.name; label=$g.label; displayOrder=$g.displayOrder } | ConvertTo-Json
  if ($DryRun) { Write-Host "  [dry] create group $($g.name) ($($g.label))" -ForegroundColor Yellow; continue }
  Invoke-RestMethod -Uri "$base/crm/v3/properties/$ObjectType/groups" -Headers $headers -Method Post -Body $body | Out-Null
  Write-Host "  + group $($g.name)" -ForegroundColor Green
}

# ---- build property inputs for those not already present ----
$toCreate = @()
foreach ($p in $props) {
  if ($existingProps[$p.hs_name]) { continue }
  $prop = [ordered]@{ name=$p.hs_name; label=$p.label; type=$p.type; fieldType=$p.fieldType; groupName=$p.group }
  if ($p.options) {
    $prop.options = @($p.options | ForEach-Object { @{ label=$_.label; value=$_.value; displayOrder=$_.displayOrder } })
  }
  # The generated definitions carry a provenance description -- which form and printed line
  # feeds the property, and whether the name is shared across the series. That matters more
  # once the name no longer says which form it belongs to: without it, `irs433_full_name` in
  # the CRM has nothing pointing back at 433-A line 1a. The PII sentence is folded into that
  # string by the generator, so the older PII-only fallback applies only to registry rows.
  if ($p.description)  { $prop.description = $p.description }
  elseif ($p.pii)      { $prop.description = "PII - handle per VLP PII rule" }
  $toCreate += $prop
}
Write-Host "New properties to create: $($toCreate.Count) (skipping $($props.Count - $toCreate.Count) already present)" -ForegroundColor Cyan

if ($toCreate.Count -eq 0) { Write-Host "Nothing to do." -ForegroundColor Green; return }
if ($DryRun) {
  $toCreate | ForEach-Object { [pscustomobject]$_ } | Select-Object name,label,type,fieldType,groupName | Format-Table -AutoSize
  Write-Host "[dry run] would create $($toCreate.Count) properties." -ForegroundColor Yellow
  return
}

# ---- batch create (chunks of 100) ----
$created = 0
for ($i = 0; $i -lt $toCreate.Count; $i += 100) {
  $chunk = $toCreate[$i..([Math]::Min($i+99, $toCreate.Count-1))]
  $body  = @{ inputs = $chunk } | ConvertTo-Json -Depth 6
  try {
    $resp = Invoke-RestMethod -Uri "$base/crm/v3/properties/$ObjectType/batch/create" -Headers $headers -Method Post -Body $body
    $created += $chunk.Count
    Write-Host "  + created $($chunk.Count) (total $created)" -ForegroundColor Green
  } catch {
    Write-Host "  ! batch $i failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
  }
}
Write-Host "Done. Created $created properties on $ObjectType." -ForegroundColor Cyan
