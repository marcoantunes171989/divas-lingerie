# ============================================================
# instalar-auto-push.ps1 — Divas Lingerie
# Execute UMA VEZ como Administrador para registrar a tarefa
# agendada que faz push automatico a cada 10 minutos.
# ============================================================

$TaskName   = "DivasLingerie-AutoPush"
$ScriptPath = "$PSScriptRoot\auto-push.bat"

# Remove tarefa anterior se existir
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Tarefa anterior removida."
}

$Action  = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$ScriptPath`""
$Trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 10) -Once -At (Get-Date)
$Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action   $Action `
    -Trigger  $Trigger `
    -Settings $Settings `
    -Description "Auto-push do projeto Divas Lingerie para o GitHub a cada 10 minutos." `
    -RunLevel Highest

Write-Host ""
Write-Host "✅ Tarefa '$TaskName' registrada com sucesso!"
Write-Host "   Push automatico a cada 10 minutos."
Write-Host "   A Vercel fara o deploy automaticamente apos cada push."
