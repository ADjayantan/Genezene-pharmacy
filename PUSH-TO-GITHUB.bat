@echo off
REM ==================================================================
REM  Genezenz Pharmacy  ->  push to GitHub
REM  Repo: https://github.com/ADjayantan/Genezene-pharmacy
REM  Safe: .gitignore keeps .env, node_modules and secrets OUT.
REM ==================================================================
cd /d C:\genezenz

where git >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Git is not installed. Get it from https://git-scm.com/download/win
  echo   Install, then run this file again.
  echo.
  pause & exit /b 1
)

if not exist ".gitignore" (
  echo   WARNING: .gitignore is missing - stop and tell Claude before pushing.
  pause & exit /b 1
)

REM First time here? initialise the repo.
if not exist ".git" (
  git init
)
git branch -M main

REM Commit identity (repo-local, harmless to set each run).
git config user.name  "ADjayantan"
git config user.email "adjayantan2007@gmail.com"

REM Point at the GitHub repo (replace any existing remote).
git remote remove origin >nul 2>nul
git remote add origin https://github.com/ADjayantan/Genezene-pharmacy.git

echo.
echo   Staging files (node_modules and .env are skipped automatically)...
git add -A
git commit -m "Genezenz Pharmacy - full Next.js rebuild with admin dashboard" 2>nul

echo.
echo   Pushing to GitHub... a browser window may open to sign in - approve it.
echo.
git push -u origin main
if errorlevel 1 (
  echo.
  echo   ------------------------------------------------------------
  echo   Push was rejected. This almost always means the GitHub repo
  echo   was created WITH a README, so it already has a commit.
  echo   Since this repo is meant to hold ONLY this code, run:
  echo.
  echo       git push -u origin main --force
  echo.
  echo   ...or tell Claude and I will guide you.
  echo   ------------------------------------------------------------
) else (
  echo.
  echo   Done! Refresh the repo page on GitHub - your code is there.
)
echo.
pause
