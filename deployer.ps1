<#
.SYNOPSIS
  Déploie le site statique VTC Liberty sur l'hébergement Web Infomaniak par SFTP.

.DESCRIPTION
  1. Lance la garde outils/verifier-avant-mise-en-ligne.mjs : refus tant qu'un « À compléter » ou « à confirmer » reste.
  2. Liste les fichiers publiés (les dossiers internes, CNAME et les fichiers cachés sauf .htaccess sont exclus).
  3. Sans -Essai : envoie les fichiers par sftp (OpenSSH, clé SSH) dans le dossier du site.

  Accès lus dans l'environnement, jamais dans le dépôt :
    INFOMANIAK_SFTP_HOTE         ex. xxxx.ftp.infomaniak.com (Manager > hébergement > FTP / SSH)
    INFOMANIAK_SFTP_UTILISATEUR  compte « FTP + SSH »
    INFOMANIAK_SFTP_DOSSIER      dossier du site sur le serveur, ex. sites/vtc-liberty.fr
    INFOMANIAK_SFTP_CLE          (facultatif) chemin de la clé privée SSH
    INFOMANIAK_SFTP_PORT         (facultatif) défaut 22

.PARAMETER Essai
  Liste les fichiers et le lot sftp sans rien envoyer, sans connexion. La garde est jouée et son verdict affiché.

.EXAMPLE
  pwsh ./deployer.ps1 -Essai
#>
[CmdletBinding()]
param([switch]$Essai)

$ErrorActionPreference = 'Stop'
$racine = $PSScriptRoot
$exclus = @('.git', '.github', '.palier', 'node_modules', 'outils', 'tests', 'preuves', 'docs')
$fichiersExclus = @('CNAME', '_config.yml', 'deployer.ps1', 'DEPLOIEMENT.md', 'GESTES-PILOTE.md', 'CREDITS.md', 'README.md', 'package.json')
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

function Write-Journal([string]$texte) { Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $texte) }

# 1. Garde
Write-Journal 'Garde : verifier-avant-mise-en-ligne'
& node (Join-Path $racine 'outils/verifier-avant-mise-en-ligne.mjs') $racine
$garde = $LASTEXITCODE
if ($garde -ne 0) {
  if ($Essai) { Write-Journal "Garde : REFUS (code $garde). En essai on continue la liste ; un vrai envoi serait bloqué ici." }
  else { Write-Journal "Garde : REFUS (code $garde). Rien n'est envoyé."; exit 1 }
} else { Write-Journal 'Garde : OK' }

# 2. Liste des fichiers publiés
$fichiers = Get-ChildItem -LiteralPath $racine -Recurse -File -Force | Where-Object {
  $rel = [IO.Path]::GetRelativePath($racine, $_.FullName)
  $parts = $rel -split '[\\/]'
  if ($parts | Where-Object { $exclus -contains $_ }) { return $false }
  if ($parts.Count -eq 1 -and $fichiersExclus -contains $parts[0]) { return $false }
  if (($parts | Where-Object { $_.StartsWith('.') }) -and $_.Name -ne '.htaccess') { return $false }
  return $true
} | Sort-Object FullName

$total = 0
$lignes = foreach ($f in $fichiers) {
  $rel = [IO.Path]::GetRelativePath($racine, $f.FullName).Replace('\', '/')
  $total += $f.Length
  [pscustomobject]@{ Chemin = $rel; Octets = $f.Length }
}
Write-Journal ("{0} fichiers, {1:N0} Ko" -f $lignes.Count, ($total / 1KB))
$lignes | ForEach-Object { Write-Host ("  {0,10:N0}  {1}" -f $_.Octets, $_.Chemin) }

# 3. Lot sftp
$dossierDistant = if ($env:INFOMANIAK_SFTP_DOSSIER) { $env:INFOMANIAK_SFTP_DOSSIER.TrimEnd('/') } else { '<INFOMANIAK_SFTP_DOSSIER>' }
$dossiers = $lignes | ForEach-Object { $d = [IO.Path]::GetDirectoryName($_.Chemin); if ($d) { $d.Replace('\', '/') } } | Sort-Object -Unique
$lot = @()
foreach ($d in $dossiers) {
  # -mkdir : le « - » fait ignorer l'erreur si le dossier existe déjà ; parents d'abord grâce au tri.
  $acc = ''
  foreach ($p in $d.Split('/')) { $acc = if ($acc) { "$acc/$p" } else { $p }; $lot += "-mkdir `"$dossierDistant/$acc`"" }
}
$lot = $lot | Select-Object -Unique
foreach ($l in $lignes) { $lot += "put `"$((Join-Path $racine $l.Chemin).Replace('\', '/'))`" `"$dossierDistant/$($l.Chemin)`"" }
$lot += 'bye'

if ($Essai) {
  Write-Journal ("Essai : lot sftp de {0} commandes (non envoyé, aucune connexion) :" -f $lot.Count)
  $lot | ForEach-Object { Write-Host "  $_" }
  Write-Journal 'Essai terminé. Rien n''a été envoyé.'
  exit 0
}

foreach ($v in 'INFOMANIAK_SFTP_HOTE', 'INFOMANIAK_SFTP_UTILISATEUR', 'INFOMANIAK_SFTP_DOSSIER') {
  if (-not [Environment]::GetEnvironmentVariable($v)) { Write-Journal "Variable manquante : $v. Rien n'est envoyé."; exit 2 }
}
$port = if ($env:INFOMANIAK_SFTP_PORT) { $env:INFOMANIAK_SFTP_PORT } else { '22' }
$fichierLot = New-TemporaryFile
try {
  Set-Content -LiteralPath $fichierLot -Value $lot -Encoding utf8NoBOM
  $sftpArgs = @('-b', $fichierLot.FullName, '-P', $port, '-o', 'StrictHostKeyChecking=accept-new')
  if ($env:INFOMANIAK_SFTP_CLE) { $sftpArgs += @('-i', $env:INFOMANIAK_SFTP_CLE) }
  $sftpArgs += "$($env:INFOMANIAK_SFTP_UTILISATEUR)@$($env:INFOMANIAK_SFTP_HOTE)"
  Write-Journal "Envoi vers $($env:INFOMANIAK_SFTP_HOTE):$dossierDistant"
  & sftp @sftpArgs
  if ($LASTEXITCODE -ne 0) { Write-Journal "sftp : échec (code $LASTEXITCODE)"; exit $LASTEXITCODE }
  Write-Journal 'Envoi terminé. Vérifier https://vtc-liberty.fr/ puis /404-test (page 404).'
} finally { Remove-Item -LiteralPath $fichierLot -Force -ErrorAction SilentlyContinue }
