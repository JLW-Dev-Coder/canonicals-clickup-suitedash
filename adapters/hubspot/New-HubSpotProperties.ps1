<#
.SYNOPSIS
  Provision HubSpot custom properties + groups from fields.registry.json using a Service Key.
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
  [string]$RegistryPath = ".\fields.registry.json",
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

$reg = Get-Content $RegistryPath -Raw | ConvertFrom-Json
Write-Host "Registry: $($reg.properties.Count) properties, $($reg.groups.Count) groups. Object: $ObjectType" -ForegroundColor Cyan

# ---- filter by -Forms ----
$props  = $reg.properties
$groups = $reg.groups
if ($Forms.Count -gt 0) {
  $props  = $props  | Where-Object { $Forms -contains $_.form }
  $keep   = ($props | Select-Object -ExpandProperty group -Unique)
  $groups = $groups | Where-Object { $keep -contains $_.name }
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
  if ($p.pii) { $prop.description = "PII - handle per VLP PII rule" }
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
