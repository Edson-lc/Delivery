# Script para Verificar Status dos Checkpoints
# Uso: .\checkpoint-status.ps1

Write-Host "📊 STATUS DOS CHECKPOINTS - AmaDelivery" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Verificar checkpoints principais
$checkpointDirs = Get-ChildItem -Path "checkpoints" -Directory | Where-Object { $_.Name -match "^checkpoint-\d+-" } | Sort-Object Name

if ($checkpointDirs.Count -eq 0) {
    Write-Host "❌ Nenhum checkpoint encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 CHECKPOINTS PRINCIPAIS ($($checkpointDirs.Count) encontrados):" -ForegroundColor Green
Write-Host ""

foreach ($dir in $checkpointDirs) {
    if ($dir.Name -match "checkpoint-(\d+)-(.+)") {
        $number = $matches[1]
        $description = $matches[2] -replace "-", " "
        
        # Verificar se existe documentação
        $docPath = "checkpoints\$($dir.Name).md"
        $hasDoc = Test-Path $docPath
        
        # Contar arquivos no checkpoint
        $fileCount = (Get-ChildItem -Path $dir.FullName -File -Recurse).Count
        
        # Verificar tamanho do diretório
        $size = (Get-ChildItem -Path $dir.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        $sizeKB = [math]::Round($size / 1KB, 2)
        
        $status = if ($hasDoc) { "📄" } else { "⚠️ " }
        $color = if ($hasDoc) { "Green" } else { "Yellow" }
        
        Write-Host "Checkpoint $number`: $description" -ForegroundColor $color
        Write-Host "  📁 $($dir.Name)" -ForegroundColor Gray
        Write-Host "  📊 $fileCount arquivos, $sizeKB KB" -ForegroundColor Gray
        if ($hasDoc) {
            Write-Host "  📄 Documentação disponível" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠️  Sem documentação" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

# Verificar backups
$backupDirs = Get-ChildItem -Path "checkpoints\backups" -Directory -ErrorAction SilentlyContinue

if ($backupDirs -and $backupDirs.Count -gt 0) {
    Write-Host "💾 BACKUPS AUTOMÁTICOS ($($backupDirs.Count) encontrados):" -ForegroundColor Green
    Write-Host ""
    
    foreach ($backup in $backupDirs) {
        $fileCount = (Get-ChildItem -Path $backup.FullName -File -Recurse).Count
        $size = (Get-ChildItem -Path $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        $sizeKB = [math]::Round($size / 1KB, 2)
        $age = (Get-Date) - $backup.CreationTime
        
        Write-Host "Backup: $($backup.Name)" -ForegroundColor Yellow
        Write-Host "  📊 $fileCount arquivos, $sizeKB KB" -ForegroundColor Gray
        Write-Host "  🕒 Criado há $($age.Days) dias, $($age.Hours) horas" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "💾 BACKUPS AUTOMÁTICOS: Nenhum encontrado" -ForegroundColor Yellow
    Write-Host ""
}

# Estatísticas gerais
$totalCheckpoints = $checkpointDirs.Count
$totalBackups = if ($backupDirs) { $backupDirs.Count } else { 0 }

# Calcular tamanho total
$totalSize = 0
foreach ($dir in $checkpointDirs) {
    $size = (Get-ChildItem -Path $dir.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
    $totalSize += $size
}

if ($backupDirs) {
    foreach ($backup in $backupDirs) {
        $size = (Get-ChildItem -Path $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        $totalSize += $size
    }
}

$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "📈 ESTATÍSTICAS GERAIS:" -ForegroundColor Cyan
Write-Host "  📊 Total de checkpoints: $totalCheckpoints" -ForegroundColor White
Write-Host "  💾 Total de backups: $totalBackups" -ForegroundColor White
Write-Host "  💽 Tamanho total: $totalSizeMB MB" -ForegroundColor White
Write-Host ""

# Verificar integridade dos checkpoints
Write-Host "🔍 VERIFICAÇÃO DE INTEGRIDADE:" -ForegroundColor Cyan
Write-Host ""

$integrityIssues = 0

foreach ($dir in $checkpointDirs) {
    if ($dir.Name -match "checkpoint-(\d+)-(.+)") {
        $number = $matches[1]
        $description = $matches[2]
        
        # Verificar se tem arquivos
        $files = Get-ChildItem -Path $dir.FullName -File -Recurse
        if ($files.Count -eq 0) {
            Write-Host "  ❌ Checkpoint $number`: Vazio (sem arquivos)" -ForegroundColor Red
            $integrityIssues++
        } else {
            # Verificar se tem documentação
            $docPath = "checkpoints\$($dir.Name).md"
            if (-not (Test-Path $docPath)) {
                Write-Host "  ⚠️  Checkpoint $number`: Sem documentação" -ForegroundColor Yellow
                $integrityIssues++
            } else {
                Write-Host "  ✅ Checkpoint $number`: OK" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""

if ($integrityIssues -eq 0) {
    Write-Host "🎉 Todos os checkpoints estão íntegros!" -ForegroundColor Green
} else {
    Write-Host "⚠️  $integrityIssues problema(s) encontrado(s) nos checkpoints" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host "  .\restore-checkpoint.ps1 list     # Listar checkpoints" -ForegroundColor Gray
Write-Host "  .\create-checkpoint.ps1 \"desc\"    # Criar checkpoint" -ForegroundColor Gray
Write-Host "  .\quick-checkpoint.ps1 \"desc\"     # Checkpoint rápido" -ForegroundColor Gray
Write-Host "  .\backup-before-changes.ps1 \"desc\" # Backup automático" -ForegroundColor Gray
Write-Host ""

# Sugestões de limpeza
$oldBackups = if ($backupDirs) { 
    $backupDirs | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } 
} else { @() }

if ($oldBackups.Count -gt 0) {
    Write-Host "🧹 LIMPEZA SUGERIDA:" -ForegroundColor Yellow
    Write-Host "  $($oldBackups.Count) backup(s) com mais de 30 dias podem ser removidos" -ForegroundColor Gray
    Write-Host "  Comando: Get-ChildItem -Path \"checkpoints\\backups\" -Directory | Where-Object { `$_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse -Force" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "📊 Relatório gerado em $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
