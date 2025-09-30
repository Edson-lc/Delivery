# Script para Criar Checkpoints Inteligentes (apenas arquivos alterados)
# Uso: .\create-checkpoint-smart.ps1 "descrição-do-checkpoint"
# Exemplo: .\create-checkpoint-smart.ps1 "implementacao-stripe-pagamentos"

param(
    [Parameter(Mandatory=$true)]
    [string]$Description
)

# Verificar se Git está disponível
try {
    $gitVersion = git --version 2>$null
    if (-not $gitVersion) {
        throw "Git não encontrado"
    }
} catch {
    Write-Host "ERRO: Git não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "Instale o Git ou use o script original: create-checkpoint.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar se estamos em um repositório Git
try {
    $gitStatus = git status --porcelain 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Não é um repositório Git"
    }
} catch {
    Write-Host "ERRO: Diretório atual não é um repositório Git" -ForegroundColor Red
    Write-Host "Execute 'git init' primeiro ou use o script original" -ForegroundColor Yellow
    exit 1
}

# Gerar número do próximo checkpoint
$checkpointDirs = Get-ChildItem -Path "checkpoints" -Directory | Where-Object { $_.Name -match "^checkpoint-\d+-" }
$nextNumber = 1

if ($checkpointDirs.Count -gt 0) {
    $numbers = $checkpointDirs | ForEach-Object { 
        if ($_.Name -match "checkpoint-(\d+)-") { 
            [int]$matches[1] 
        } 
    } | Sort-Object
    $nextNumber = ($numbers | Measure-Object -Maximum).Maximum + 1
}

# Criar nome do checkpoint
$checkpointName = "checkpoint-$nextNumber-$Description"
$checkpointDir = "checkpoints\$checkpointName"

Write-Host "Criando Checkpoint Inteligente $($nextNumber): $($Description)" -ForegroundColor Blue

# Criar diretório do checkpoint
New-Item -ItemType Directory -Path $checkpointDir -Force | Out-Null

# Obter arquivos modificados do Git
Write-Host "Analisando arquivos modificados..." -ForegroundColor Yellow

# Arquivos modificados, adicionados ou não rastreados
$modifiedFiles = git status --porcelain | Where-Object { $_ -match "^\s*[AM?]" } | ForEach-Object {
    $_.Substring(3).Trim()
}

# Arquivos deletados
$deletedFiles = git status --porcelain | Where-Object { $_ -match "^\s*D" } | ForEach-Object {
    $_.Substring(3).Trim()
}

# Lista de arquivos importantes para monitorar
$importantFiles = @(
    # Frontend - Páginas
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
    
    # Frontend - Componentes
    "src\components\public\RestaurantCard.jsx",
    "src\components\public\SearchBar.jsx",
    "src\components\public\FilterSidebar.jsx",
    "src\components\public\PromotionalSlider.jsx",
    "src\components\public\CartSidebar.jsx",
    "src\components\public\MenuItemCard.jsx",
    "src\components\ui\FloatingCart.jsx",
    "src\components\ui\CartModal.jsx",
    "src\components\ui\toast.jsx",
    "src\components\checkout\PaymentMethodSelector.jsx",
    "src\components\checkout\AddressSelector.jsx",
    "src\components\account\ProfileForm.jsx",
    "src\components\account\PaymentMethods.jsx",
    "src\components\account\OrderHistory.jsx",
    "src\components\restaurant\RestaurantOrdersManager.jsx",
    "src\components\restaurant\RestaurantMenuManager.jsx",
    "src\components\drivers\NotificationModal.jsx",
    "src\components\drivers\DriverLocationMap.jsx",
    
    # Frontend - Layouts
    "src\pages\layouts\PublicLayout.jsx",
    "src\pages\layouts\AdminLayout.jsx", 
    "src\pages\layouts\RestaurantLayout.jsx",
    
    # Frontend - Hooks
    "src\hooks\usePublicRestaurants.js",
    
    # Frontend - API
    "src\api\entities.js",
    "src\api\httpClient.js",
    "src\api\session.js",
    
    # Frontend - Contexts
    "src\contexts\AuthContext.jsx",
    
    # Backend - Rotas
    "server\src\routes\public.ts",
    "server\src\routes\auth.ts",
    "server\src\routes\orders.ts",
    "server\src\routes\restaurants.ts",
    "server\src\routes\users.ts",
    "server\src\routes\entregadores.ts",
    "server\src\routes\carts.ts",
    "server\src\routes\menu-items.ts",
    "server\src\routes\deliveries.ts",
    
    # Backend - Middleware
    "server\src\middleware\authenticate.ts",
    "server\src\middleware\require-role.ts",
    "server\src\middleware\security.ts",
    
    # Backend - Utils
    "server\src\utils\auth.ts",
    "server\src\utils\errors.ts",
    "server\src\utils\user.ts",
    
    # Backend - Schemas
    "server\src\schemas\validation.ts",
    
    # Backend - App
    "server\src\app.ts",
    "server\src\server.ts",
    
    # Database
    "server\prisma\schema.prisma"
)

# Filtrar apenas arquivos importantes que foram modificados
$filesToBackup = $modifiedFiles | Where-Object { 
    $file = $_
    $importantFiles | Where-Object { $file -like "*$_*" }
}

# Contador de arquivos
$copiedFiles = 0
$skippedFiles = 0

Write-Host "Arquivos modificados encontrados: $($filesToBackup.Count)" -ForegroundColor Cyan

if ($filesToBackup.Count -eq 0) {
    Write-Host "Nenhum arquivo importante foi modificado." -ForegroundColor Yellow
    Write-Host "Deseja criar checkpoint mesmo assim? (s/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "Checkpoint cancelado." -ForegroundColor Red
        Remove-Item $checkpointDir -Force
        exit 0
    }
}

Write-Host "Copiando arquivos modificados..." -ForegroundColor Yellow

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        # Determinar nome do arquivo de destino
        $fileName = Split-Path $file -Leaf
        
        # Criar diretório de destino se necessário
        $destPath = "$checkpointDir\$fileName"
        
        Copy-Item $file $destPath -Force
        $copiedFiles++
        Write-Host "  ✅ $fileName" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $file (não encontrado)" -ForegroundColor Yellow
        $skippedFiles++
    }
}

# Processar arquivos deletados
if ($deletedFiles.Count -gt 0) {
    Write-Host "Arquivos deletados encontrados: $($deletedFiles.Count)" -ForegroundColor Red
    
    $deletedImportantFiles = $deletedFiles | Where-Object { 
        $file = $_
        $importantFiles | Where-Object { $file -like "*$_*" }
    }
    
    if ($deletedImportantFiles.Count -gt 0) {
        $deletedList = $deletedImportantFiles -join "`n"
        $deletedList | Out-File -FilePath "$checkpointDir\DELETED_FILES.txt" -Encoding UTF8
        Write-Host "  📝 Lista de arquivos deletados salva em DELETED_FILES.txt" -ForegroundColor Red
    }
}

# Criar arquivo de metadados do checkpoint
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$gitCommit = git rev-parse HEAD 2>$null
$gitBranch = git branch --show-current 2>$null

$metadata = @{
    checkpoint = $nextNumber
    description = $Description
    timestamp = $timestamp
    gitCommit = $gitCommit
    gitBranch = $gitBranch
    filesModified = $filesToBackup.Count
    filesCopied = $copiedFiles
    filesSkipped = $skippedFiles
    filesDeleted = $deletedFiles.Count
}

$metadata | ConvertTo-Json | Out-File -FilePath "$checkpointDir\metadata.json" -Encoding UTF8

# Criar arquivo de documentação do checkpoint
$docContent = @"
# Checkpoint Inteligente $($nextNumber): $($Description)

**Data:** $timestamp  
**Status:** ✅ Criado Automaticamente (Git-based)  
**Descrição:** $($Description)
**Git Commit:** $gitCommit
**Git Branch:** $gitBranch

## 📊 Estatísticas

- **Arquivos modificados:** $($filesToBackup.Count)
- **Arquivos copiados:** $copiedFiles
- **Arquivos ignorados:** $skippedFiles
- **Arquivos deletados:** $($deletedFiles.Count)

## 📁 Arquivos Incluídos

Este checkpoint contém apenas os arquivos que foram modificados:

### Arquivos Modificados
$($filesToBackup | ForEach-Object { "- $($_)" } | Out-String)

### Arquivos Deletados
$($deletedFiles | ForEach-Object { "- $($_)" } | Out-String)

## 🔄 Como Restaurar

Para restaurar este checkpoint:

```powershell
.\checkpoints\restore-checkpoint.ps1 $($nextNumber)
```

## 📝 Notas

- Checkpoint criado automaticamente usando Git
- Apenas arquivos modificados foram incluídos
- Metadados salvos em metadata.json
- Reinicie o servidor após restaurar

## 🎯 Próximos Passos

1. Testar as mudanças implementadas
2. Criar próximo checkpoint se necessário
3. Documentar funcionalidades adicionadas

---

*Checkpoint inteligente criado automaticamente em $($timestamp)*
"@

$docPath = "checkpoints\$checkpointName.md"
$docContent | Out-File -FilePath $docPath -Encoding UTF8

Write-Host ""
Write-Host "Checkpoint Inteligente $($nextNumber) criado com sucesso!" -ForegroundColor Green
Write-Host "Diretório: $checkpointDir" -ForegroundColor Cyan
Write-Host "Documentação: $docPath" -ForegroundColor Cyan
Write-Host "Arquivos copiados: $copiedFiles" -ForegroundColor Yellow
Write-Host "Arquivos ignorados: $skippedFiles" -ForegroundColor Gray
Write-Host ""
Write-Host "Para restaurar este checkpoint:" -ForegroundColor Yellow
Write-Host "   .\checkpoints\restore-checkpoint.ps1 $($nextNumber)" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Teste suas mudanças antes de continuar!" -ForegroundColor Red
