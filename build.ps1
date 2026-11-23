$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SrcDir = Join-Path $ScriptDir 'src'
$DistDir = Join-Path $ScriptDir 'dist'
$OutputJar = Join-Path $DistDir 'guacamole-disable-host-ime.jar'

if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir | Out-Null
}

if (Test-Path $OutputJar) {
    Remove-Item $OutputJar -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($SrcDir, $OutputJar, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Write-Host "Built: $OutputJar"
