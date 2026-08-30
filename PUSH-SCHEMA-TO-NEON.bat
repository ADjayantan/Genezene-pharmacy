@echo off
REM ============================================================
REM  Genezenz Pharmacy - push new DB columns to Neon
REM  Adds batchNo, expiryDate, gstRate. Safe: existing data kept.
REM ============================================================
cd /d C:\genezenz
if not exist ".env" (
  echo.
  echo   ERROR: .env not found in C:\genezenz
  echo   Make sure you are in the project folder with your Neon DATABASE_URL set.
  echo.
  pause
  exit /b 1
)
findstr /C:"localhost:5432" .env >nul
if %errorlevel%==0 (
  echo.
  echo   ERROR: .env still points at localhost:5432
  echo   Put your Neon connection string in DATABASE_URL first.
  echo.
  pause
  exit /b 1
)
echo.
echo   Pushing schema to your Neon database...
echo.
call npx --no-install prisma db push
echo.
if %errorlevel%==0 (
  echo   Done. Your database now has the new columns.
) else (
  echo   Something went wrong - read the message above.
)
echo.
pause
