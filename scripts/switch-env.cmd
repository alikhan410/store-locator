@echo off
REM Store Locator Environment Switcher - Windows Launcher
REM This script launches the cross-platform Node.js version

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

REM Change to project root directory
cd /d "%PROJECT_ROOT%"

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Launch the Node.js script with all arguments
node "%SCRIPT_DIR%switch-env.js" %*

REM Preserve the exit code
exit /b %errorlevel% 