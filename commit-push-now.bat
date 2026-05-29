@echo off
cd /d "%~dp0"

:: Remove lock se existir
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"  del /f /q ".git\HEAD.lock"

:: Adiciona todos os arquivos e faz commit+push
git add -A
git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    git commit -m "chore: teste deploy automatico Vercel + GitHub CI/CD"
)

git push origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Push realizado com sucesso! Vercel iniciando deploy...
) else (
    echo.
    echo ❌ Erro no push.
)
pause
