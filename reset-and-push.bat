@echo off
cd /d "%~dp0"

echo Removendo lock files...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\ORIG_HEAD.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul

echo Fazendo squash dos commits com token...
git reset --soft bacda42

echo Adicionando arquivos...
git add -A

echo Criando commit limpo...
git commit -m "feat: imagens nos cards da LandingPage e scripts de auto-deploy"

echo Fazendo force push...
git push --force origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Push realizado! Vercel iniciando deploy automatico...
) else (
    echo.
    echo ❌ Erro. Verifique acima.
)
pause
