# run-nginx.ps1 - start / reload / stop an nginx instance for this clone.
#
# Works from any clone on any machine: the repo root is derived from this
# script's own location, so there is nothing to edit after a git pull.
# Config routing is shared via deploy/nginx-common.conf.
#
#   powershell -File deploy/run-nginx.ps1 -Port 8080
#   powershell -File deploy/run-nginx.ps1 -Port 8080 -Action reload
#   powershell -File deploy/run-nginx.ps1 -Port 8080 -Action stop
#   powershell -File deploy/run-nginx.ps1 -Port 8080 -Action test

param(
    [int]$Port = 8080,
    [ValidateSet("start", "reload", "stop", "test")] [string]$Action = "start",
    [string]$NginxExe = "C:\nginx-1.28.3\nginx.exe"
)

$ErrorActionPreference = "Stop"

$deploy = $PSScriptRoot
$repo = Split-Path -Parent $deploy

# config filename is not always nginx-<port>.conf (historical names).
# Keep this in step with CONFIGS in quant/gen_nginx_configs.py — the generator
# writes the files, this map is what lets you start them by port.
$map = @{ 80   = "nginx-80.conf";
          8080 = "nginx-8080.conf"; 8000 = "nginx-8000.conf"; 8081 = "nginx-pyportfolios.conf";
          5000 = "nginx-5000.conf"; 5500 = "nginx-local-5500.conf"; 5501 = "nginx-local-5501.conf";
          1133 = "nginx-1133.conf" }
if (-not $map.ContainsKey($Port)) { throw "No config for port $Port. Known: $($map.Keys -join ', ')" }

$conf = Join-Path $deploy $map[$Port]
$prefix = Join-Path $deploy "nginx-runtime-$Port"
if (-not (Test-Path $NginxExe)) { throw "nginx not found at $NginxExe - pass -NginxExe <path>" }
if (-not (Test-Path $conf))     { throw "config not found: $conf (run: python quant/gen_nginx_configs.py)" }

# nginx creates temp dirs but not logs
foreach ($d in @("logs", "temp")) { New-Item -ItemType Directory -Force (Join-Path $prefix $d) | Out-Null }

# nginx wants forward slashes
$p = ($prefix -replace '\\', '/') + '/'
$c = $conf -replace '\\', '/'

switch ($Action) {
    "test"   { & $NginxExe -t -p $p -c $c }
    "start"  { & $NginxExe    -p $p -c $c; Write-Host "nginx started on :$Port  (root $repo\site\out)" }
    "reload" { & $NginxExe -p $p -c $c -s reload; Write-Host "nginx reloaded on :$Port" }
    "stop"   { & $NginxExe -p $p -c $c -s stop;   Write-Host "nginx stopped on :$Port" }
}
