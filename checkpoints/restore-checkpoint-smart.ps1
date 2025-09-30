# Script para Restaurar Checkpoints Inteligentes
# Uso: .\restore-checkpoint-smart.ps1 [número-do-checkpoint]
# Exemplo: .\restore-checkpoint-smart.ps1 25

param(
    [Parameter(Mandatory=$false)]
    [int]$CheckpointNumber
)

# Se não especificado, mostrar lista de checkpoints disponíveis
if (-not $CheckpointNumber) {
    Write-Host "Checkpoints Disponíveis:" -ForegroundColor Blue
    Write-Host "========================" -ForegroundColor Blue
    
    $checkpointDirs = Get-ChildItem -Path "checkpoints" -Directory | Where-Object { $_.Name -match "^checkpoint-\d+-" } | Sort-Object Name
    
    if ($checkpointDirs.Count -eq 0) {
        Write-Host "Nenhum checkpoint encontrado." -ForegroundColor Red
        exit 1
    }
    
    foreach ($dir in $checkpointDirs) {
        if ($dir.Name -match "checkpoint-(\d+)-(.+)") {
            $number = $matches[1]
            $description = $matches[2]
            
            # Tentar ler metadados se disponível
            $metadataPath = "$($dir.FullName)\metadata.json"
            if (Test-Path $metadataPath) {
                try {
                    $metadata = Get-Content $metadataPath | ConvertFrom-Json
                    $filesCount = $metadata.filesCopied
                    $timestamp = $metadata.timestamp
                    Write-Host "  $number - $description ($filesCount arquivos) - $timestamp" -ForegroundColor Green
                } catch {
                    Write-Host "  $number - $description" -ForegroundColor Green
                }
            } else {
                Write-Host "  $number - $description" -ForegroundColor Green
            }
        }
    }
    
    Write-Host ""
    Write-Host "Uso: .\restore-checkpoint-smart.ps1 [número]" -ForegroundColor Yellow
    exit 0
}

# Encontrar o checkpoint
$checkpointDir = Get-ChildItem -Path "checkpoints" -Directory | Where-Object { $_.Name -match "^checkpoint-$CheckpointNumber-" }

if (-not $checkpointDir) {
    Write-Host "Checkpoint $CheckpointNumber não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "Restaurando Checkpoint $CheckpointNumber..." -ForegroundColor Blue
Write-Host "Diretório: $($checkpointDir.Name)" -ForegroundColor Cyan

# Ler metadados se disponível
$metadataPath = "$($checkpointDir.FullName)\metadata.json"
$metadata = $null
if (Test-Path $metadataPath) {
    try {
        $metadata = Get-Content $metadataPath | ConvertFrom-Json
        Write-Host "Descrição: $($metadata.description)" -ForegroundColor Yellow
        Write-Host "Data: $($metadata.timestamp)" -ForegroundColor Yellow
        Write-Host "Arquivos: $($metadata.filesCopied)" -ForegroundColor Yellow
    } catch {
        Write-Host "Metadados corrompidos, continuando..." -ForegroundColor Yellow
    }
}

# Confirmar restauração
Write-Host ""
Write-Host "ATENÇÃO: Esta operação irá sobrescrever arquivos modificados!" -ForegroundColor Red
Write-Host "Deseja continuar? (s/N): " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -ne "s" -and $response -ne "S") {
    Write-Host "Restauração cancelada." -ForegroundColor Red
    exit 0
}

# Fazer backup dos arquivos atuais antes de restaurar
$backupDir = "checkpoints\backup-before-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "Criando backup de segurança em: $backupDir" -ForegroundColor Yellow

# Lista de arquivos importantes para backup
$importantFiles = @(
    "src\pages\Home.jsx",
    "src\pages\Checkout.jsx", 
    "src\pages\Login.jsx",
    "src\pages\MinhaConta.jsx",
    "src\pages\RestaurantMenu.jsx",
    "src\pages\Dashboard.jsx",
    "src\pages\Restaurantes.jsx",
    "src\pages\Pedidos.jsx",
    "src\pages\Usuarios.jsx",
    "src\pages\Entregadores.jsx",
    "src\pages\PainelEntregador.jsx",
    "src\components\public\RestaurantCard.jsx",
    "src\components\public\SearchBar.jsx",
    "src\components\public\FilterSidebar.jsx",
    "src\components\public\PromotionalSlider.jsx",
    "src\components\public\CartSidebar.jsx",
    "src\components\public\MenuItemCard.jsx",
    "src\components\ui\FloatingCart.jsx",
    "src\components\ui\CartModal.jsx",
    "src\components\ui\toast.jsx"
)

$backupCount = 0
foreach ($file in $importantFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Copy-Item $file "$backupDir\$fileName" -Force
        $backupCount++
    }
}

Write-Host "Backup criado: $backupCount arquivos" -ForegroundColor Green

# Restaurar arquivos do checkpoint
$restoredFiles = 0
$skippedFiles = 0

Write-Host "Restaurando arquivos..." -ForegroundColor Yellow

# Obter todos os arquivos no checkpoint (exceto metadados)
$checkpointFiles = Get-ChildItem -Path $checkpointDir.FullName -File | Where-Object { 
    $_.Name -ne "metadata.json" -and $_.Name -ne "DELETED_FILES.txt" 
}

foreach ($file in $checkpointFiles) {
    $fileName = $file.Name
    
    # Tentar encontrar o arquivo original baseado no nome
    $originalFile = $null
    foreach ($importantFile in $importantFiles) {
        if ((Split-Path $importantFile -Leaf) -eq $fileName) {
            $originalFile = $importantFile
            break
        }
    }
    
    if ($originalFile) {
        # Criar diretório se não existir
        $destDir = Split-Path $originalFile -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $file.FullName $originalFile -Force
        $restoredFiles++
        Write-Host "  ✅ $fileName" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $fileName (arquivo não encontrado no sistema)" -ForegroundColor Yellow
        $skippedFiles++
    }
}

# Processar arquivos deletados se existir lista
$deletedFilesPath = "$($checkpointDir.FullName)\DELETED_FILES.txt"
if (Test-Path $deletedFilesPath) {
    Write-Host "Arquivos deletados no checkpoint:" -ForegroundColor Red
    $deletedFiles = Get-Content $deletedFilesPath
    foreach ($deletedFile in $deletedFiles) {
        if (Test-Path $deletedFile) {
            Remove-Item $deletedFile -Force
            Write-Host "  🗑️  $deletedFile" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Restauração concluída!" -ForegroundColor Green
Write-Host "Arquivos restaurados: $restoredFiles" -ForegroundColor Green
Write-Host "Arquivos ignorados: $skippedFiles" -ForegroundColor Yellow
Write-Host "Backup de segurança: $backupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "1. Reinicie o servidor de desenvolvimento" -ForegroundColor Yellow
Write-Host "2. Teste as funcionalidades restauradas" -ForegroundColor Yellow
Write-Host "3. Se necessário, restaure o backup: $backupDir" -ForegroundColor Yellow
