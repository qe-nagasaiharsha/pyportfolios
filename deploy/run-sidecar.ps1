# run-sidecar.ps1 - supervised runner for the platform API sidecar.
#
# The sidecar (FastAPI/uvicorn on 127.0.0.1:8799) is what nginx proxies /api
# to. If it dies, the whole paywall/auth surface 502s - this loop restarts it
# with backoff and appends to a local log.
#
# Run it in a PowerShell window:
#   powershell -ExecutionPolicy Bypass -File deploy\run-sidecar.ps1
#
# To survive reboots, register it yourself in Task Scheduler (run at startup,
# whether user is logged on or not):
#   Program:  powershell.exe
#   Args:     -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\Administrator\Desktop\Yonishwari\download\pyportfolios\deploy\run-sidecar.ps1"

$repo = Split-Path -Parent $PSScriptRoot
$platform = Join-Path $repo "platform"
$log = Join-Path $PSScriptRoot "sidecar.log"

while ($true) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content $log "[$stamp] starting uvicorn on 127.0.0.1:8799"
    Set-Location $platform
    # blocks until the process exits (crash, kill, or reboot)
    & python -m uvicorn app.main:app --port 8799 --host 127.0.0.1 *>> $log
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content $log "[$stamp] uvicorn exited (code $LASTEXITCODE) - restarting in 5s"
    Start-Sleep -Seconds 5
}
