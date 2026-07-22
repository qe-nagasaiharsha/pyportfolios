@echo off
REM Risk Parity project - one-click runner for Windows.
REM Double-click this file. It installs uv (which installs Python + the libraries)
REM and runs the project. Figures are saved into this same folder.

cd /d "%~dp0"

echo ==================================================
echo   Risk Parity project
echo ==================================================

REM 1) Install uv (Astral) if it isn't already present. uv manages Python + deps.
where uv >nul 2>nul
if errorlevel 1 (
  if not exist "%USERPROFILE%\.local\bin\uv.exe" (
    echo Installing uv ^(one-time, needs internet^)...
    powershell -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
  )
)
set "PATH=%USERPROFILE%\.local\bin;%PATH%"

REM 2) Run the script. uv reads its inline dependencies, installs the right Python
REM    version if needed, sets up an isolated environment, and runs it.
echo Setting up Python + libraries and running the project...
uv run risk_parity_futures.py

echo.
echo Finished. The figures are in this folder:
echo   %cd%
pause
