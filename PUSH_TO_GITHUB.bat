@echo off
echo ========================================
echo   HimBus - Push to GitHub
echo ========================================
echo.

cd /d "C:\Users\Chaitanya\Desktop\Transport application"

echo [1/3] Checking what changed...
git status
echo.

set /p MSG="Enter a short description of your changes: "

echo.
echo [2/3] Staging all changes...
git add .

echo.
echo [3/3] Committing and pushing to GitHub...
git commit -m "%MSG%"
git push

echo.
echo ========================================
echo   Done! Your code is on GitHub.
echo ========================================
pause

