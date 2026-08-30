@echo off
title Genezenz Pharmacy - setup
cls

REM  Double-click this file, or paste its full path into cmd and press Enter.
REM  It copies the project out of the Claude folder to C:\genezenz, installs
REM  everything, and stops before the database, which needs your .env.

set "SRC=%~dp0"
set "DEST=C:\genezenz"

echo.
echo  ================================================================
echo    GENEZENZ PHARMACY  -  SETUP
echo  ================================================================
echo.
echo    From : %SRC%
echo    To   : %DEST%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo    [X] Node.js is not installed.
  echo        Get the LTS build from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set "NODEV=%%v"
echo    [ok] Node %NODEV%
echo.

echo    Copying project files...
robocopy "%SRC%." "%DEST%" /E /XD node_modules .next /NFL /NDL /NJH /NJS /nc /ns >nul
REM  robocopy signals success with 0-7 and failure with 8+, unlike everything else
if %ERRORLEVEL% GEQ 8 (
  echo    [X] Copy failed. Right-click this file and Run as administrator.
  echo.
  pause
  exit /b 1
)
echo    [ok] Copied to %DEST%
echo.

cd /d "%DEST%"

REM  .env setup and secret generation, done entirely in PowerShell.
REM  Batch quoting around node -e and findstr is fragile enough that it was
REM  the first thing to break; this does the same job in one call.
echo    Preparing .env...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' };" ^
  "$t = Get-Content '.env' -Raw;" ^
  "if ($t -match 'AUTH_SECRET=\"\"') {" ^
  "  $s = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }));" ^
  "  $t = $t -replace 'AUTH_SECRET=\"\"', ('AUTH_SECRET=\"' + $s + '\"');" ^
  "  Set-Content '.env' $t -NoNewline;" ^
  "  Write-Host '   [ok] Generated AUTH_SECRET into .env'" ^
  "} else { Write-Host '   [ok] .env already has AUTH_SECRET' }"

echo.
echo    Installing dependencies. First run takes a few minutes.
echo.
call npm install
if errorlevel 1 (
  echo.
  echo    [X] npm install failed. Copy the error above and send it over.
  echo.
  pause
  exit /b 1
)

echo.
echo    Generating the database client...
REM  --no-install matters: without it npx offers a Prisma release candidate,
REM  which does not work with this schema.
call npx --no-install prisma generate
if errorlevel 1 (
  echo.
  echo    [X] prisma generate failed. Copy the error above and send it over.
  echo.
  pause
  exit /b 1
)

echo.
echo  ================================================================
echo    DONE. Two things left, both need you.
echo  ================================================================
echo.
echo    1. Free database at  https://neon.tech
echo       New project, region Singapore, copy the connection string.
echo.
echo    2. Notepad is opening C:\genezenz\.env - fill in:
echo          DATABASE_URL     the Neon string
echo          ADMIN_EMAIL      care@genezenz-pharmacy.in
echo          ADMIN_PASSWORD   anything 12+ characters
echo       Save and close Notepad.
echo.
echo    Then in the window that stays open, run these ONE AT A TIME:
echo.
echo          npx prisma db push
echo          npm run db:seed
echo          npm run build
echo          npm run dev
echo.
echo    Shop  http://localhost:3000
echo    Admin http://localhost:3000/admin
echo.
start "" notepad "%DEST%\.env"
cmd /k "cd /d %DEST% && echo You are now in %DEST% - run the four commands above, one at a time."
