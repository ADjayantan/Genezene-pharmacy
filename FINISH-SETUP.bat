@echo off
title Genezenz Pharmacy - finish setup
cls
cd /d "C:\genezenz" 2>nul
if errorlevel 1 (
  echo    [X] C:\genezenz not found. Run WINDOWS-SETUP.bat first.
  echo.
  pause
  exit /b 1
)

echo.
echo  ================================================================
echo    GENEZENZ PHARMACY  -  FINISH SETUP
echo  ================================================================
echo.

REM  Refuse to run against the placeholder. Without this the first error is
REM  "Can't reach database server at localhost:5432", which reads like a bug
REM  rather than a missing step.
findstr /C:"localhost:5432" .env >nul 2>nul
if not errorlevel 1 (
  echo    [X] DATABASE_URL is still the example value.
  echo.
  echo        1. Get a free database at  https://neon.tech
  echo           Sign in with Google, New project, region Singapore.
  echo        2. Copy the connection string it shows you.
  echo        3. Paste it into C:\genezenz\.env  between the quotes of
  echo           DATABASE_URL=""   then save the file.
  echo        4. Run this file again.
  echo.
  start "" notepad "C:\genezenz\.env"
  pause
  exit /b 1
)

echo    [ok] DATABASE_URL is set
echo.
echo    Creating the database tables...
call npx --no-install prisma db push
if errorlevel 1 (
  echo.
  echo    [X] Could not reach the database. Check DATABASE_URL in .env —
  echo        Neon strings must end with  ?sslmode=require
  echo.
  pause
  exit /b 1
)

echo.
echo    Creating the admin account and categories...
call npm run db:seed
if errorlevel 1 (
  echo.
  echo    [X] Seed failed. Copy the error above and send it over.
  echo.
  pause
  exit /b 1
)

echo.
echo    Importing the real catalogue from the old site...
echo    (the old Render server sleeps, so the first request can take a minute)
echo.
call npm run db:migrate-legacy -- --write --fix-images
if errorlevel 1 (
  echo.
  echo    [!] Catalogue import failed - not fatal. The shop works with the
  echo        8 sample products from the seed. Retry later with:
  echo            npm run db:migrate-legacy -- --write --fix-images
  echo.
)

echo.
echo  ================================================================
echo    READY
echo  ================================================================
echo.
echo    Shop   http://localhost:3000
echo    Admin  http://localhost:3000/admin
echo.
echo    Sign in to the admin with:
echo        care@genezenz-pharmacy.in
echo        ChangeMe-Genezenz-2026     ^<-- change this before going live
echo.
echo    Starting the server. Leave this window open.
echo    Press Ctrl+C here to stop it.
echo.
timeout /t 3 >nul
start "" http://localhost:3000
call npm run dev
pause
