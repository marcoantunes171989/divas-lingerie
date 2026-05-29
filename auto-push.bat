@echo off
:: ============================================================
:: auto-push.bat — Divas Lingerie
:: Detecta commits nao enviados e faz push para GitHub (main)
:: A Vercel faz o deploy automaticamente apos o push.
:: ============================================================

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

:: Verifica se ha commits locais nao enviados
for /f %%i in ('git rev-list origin/main..HEAD --count 2^>nul') do set PENDING=%%i

if "%PENDING%"=="" set PENDING=0

if %PENDING% GTR 0 (
    echo [%DATE% %TIME%] Enviando %PENDING% commit(s) para o GitHub...
    git push origin main >> "%TEMP%\divas-auto-push.log" 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [%DATE% %TIME%] Push concluido com sucesso. Vercel iniciando deploy...
    ) else (
        echo [%DATE% %TIME%] Erro no push. Verifique %TEMP%\divas-auto-push.log
    )
) else (
    echo [%DATE% %TIME%] Nenhum commit pendente.
)
