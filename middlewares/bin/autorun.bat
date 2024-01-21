@echo off

pushd %~dp0

:: echo %~dp0
:: Check for administrator privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

:: If the previous command returned with an error, ask for elevated permissions
if %errorlevel% neq 0 (
    :: echo Requesting administrative privileges...
    :: Prompt for UAC elevation
    powershell start-process ".\app\cookie_exporter.exe" -Verb RunAs
    exit /b
)

:: The rest of your script goes here with administrator privileges

popd