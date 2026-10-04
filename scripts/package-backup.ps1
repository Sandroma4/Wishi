param([string]$BackupPath)
$ErrorActionPreference = 'Stop'
$scriptDirectory = $env:WISHI_BACKUP_SCRIPT_DIRECTORY
if (-not $scriptDirectory) { $scriptDirectory = $PSScriptRoot }
$project = Split-Path -Parent $scriptDirectory
if (-not $BackupPath) {
  $status = Get-Content -LiteralPath (Join-Path $project '.local/backup-status.json') -Raw | ConvertFrom-Json
  if (-not $status.success -or -not $status.restorationVerified) { throw 'Sauvegarde quotidienne non vérifiée.' }
  $BackupPath = $status.backup
}
$source = (Resolve-Path -LiteralPath $BackupPath).Path
& node (Join-Path $scriptDirectory 'backup.cjs') verify $source
if ($LASTEXITCODE -ne 0) { throw 'Sauvegarde invalide.' }
$archive = $source + '.zip'
if (Test-Path -LiteralPath $archive) { throw 'Archive existante : aucun écrasement autorisé.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($source, $archive)
$probe = Join-Path (Join-Path $project '.local') ('archive-check-' + [guid]::NewGuid().ToString())
[System.IO.Compression.ZipFile]::ExtractToDirectory($archive, $probe)
& node (Join-Path $scriptDirectory 'backup.cjs') verify $probe
if ($LASTEXITCODE -ne 0) { throw 'Archive non vérifiée : conserver les fichiers pour diagnostic.' }
$resolvedProbe = (Resolve-Path -LiteralPath $probe).Path
$expectedParent = (Resolve-Path -LiteralPath (Join-Path $project '.local')).Path
if ((Split-Path -Parent $resolvedProbe) -ne $expectedParent -or (Split-Path -Leaf $resolvedProbe) -notlike 'archive-check-*') { throw 'Chemin de contrôle inattendu.' }
Remove-Item -LiteralPath $resolvedProbe -Recurse
Write-Output ('Archive vérifiée : ' + $archive)
