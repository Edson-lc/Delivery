# Script Rápido para Checkpoint - Versão Simplificada
# Uso: .\quick-checkpoint.ps1 "descrição"
# Exemplo: .\quick-checkpoint.ps1 "correcao-bug"

param(
    [Parameter(Mandatory=$true)]
    [string]$Description
)

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

Write-Host "⚡ Criando Checkpoint Rápido $nextNumber: $Description" -ForegroundColor Blue

# Criar diretório do checkpoint
New-Item -ItemType Directory -Path $checkpointDir -Force | Out-Null

# Lista reduzida de arquivos essenciais para checkpoint rápido
$essentialFiles = @(
    # Frontend - Arquivos mais importantes
    @{ source = "src\pages\Home.jsx"; dest = "Home.jsx" },
    @{ source = "src\pages\Checkout.jsx"; dest = "Checkout.jsx" },
    @{ source = "src\pages\Login.jsx"; dest = "Login.jsx" },
    @{ source = "src\pages\MinhaConta.jsx"; dest = "MinhaConta.jsx" },
    @{ source = "src\pages\RestaurantMenu.jsx"; dest = "RestaurantMenu.jsx" },
    @{ source = "src\components\public\RestaurantCard.jsx"; dest = "RestaurantCard.jsx" },
    @{ source = "src\components\public\SearchBar.jsx"; dest = "SearchBar.jsx" },
    @{ source = "src\components\checkout\PaymentMethodSelector.jsx"; dest = "PaymentMethodSelector.jsx" },
    @{ source = "src\components\account\PaymentMethods.jsx"; dest = "PaymentMethods.jsx" },
    @{ source = "src\pages\layouts\PublicLayout.jsx"; dest = "PublicLayout.jsx" },
    @{ source = "src\hooks\usePublicRestaurants.js"; dest = "usePublicRestaurants.js" },
    @{ source = "src\api\entities.js"; dest = "entities.js" },
    @{ source = "src\contexts\AuthContext.jsx"; dest = "AuthContext.jsx" },
    
    # Backend - Arquivos mais importantes
    @{ source = "server\src\routes\public.ts"; dest = "public.ts" },
    @{ source = "server\src\routes\auth.ts"; dest = "auth.ts" },
    @{ source = "server\src\routes\orders.ts"; dest = "orders.ts" },
    @{ source = "server\src\routes\restaurants.ts"; dest = "restaurants.ts" },
    @{ source = "server\src\middleware\authenticate.ts"; dest = "authenticate.ts" },
    @{ source = "server\src\utils\auth.ts"; dest = "auth.ts" },
    @{ source = "server\src\app.ts"; dest = "app.ts" },
    @{ source = "server\prisma\schema.prisma"; dest = "schema.prisma" }
)

# Contador de arquivos copiados
$copiedFiles = 0
$totalFiles = $essentialFiles.Count

Write-Host "📁 Copiando arquivos essenciais..." -ForegroundColor Yellow

foreach ($file in $essentialFiles) {
    $sourcePath = $file.source
    $destPath = "$checkpointDir\$($file.dest)"
    
    if (Test-Path $sourcePath) {
        # Criar diretório de destino se não existir
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $sourcePath $destPath -Force
        $copiedFiles++
        Write-Host "  ✅ $($file.dest)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $($file.dest) (não encontrado)" -ForegroundColor Yellow
    }
}

# Criar documentação mínima
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$docContent = @"
# Checkpoint $nextNumber: $Description

**Data:** $timestamp  
**Status:** ✅ Checkpoint Rápido  
**Descrição:** $Description

## 📁 Arquivos Incluídos

Checkpoint rápido com $copiedFiles arquivos essenciais.

## 🔄 Como Restaurar

```powershell
.\checkpoints\restore-checkpoint.ps1 $nextNumber
```

## 📝 Notas

- Checkpoint rápido criado automaticamente
- Arquivos essenciais incluídos
- Reinicie o servidor após restaurar

---

*Checkpoint rápido criado em $timestamp*
"@

$docPath = "checkpoints\$checkpointName.md"
$docContent | Out-File -FilePath $docPath -Encoding UTF8

Write-Host ""
Write-Host "⚡ Checkpoint Rápido $nextNumber criado!" -ForegroundColor Green
Write-Host "📁 Diretório: $checkpointDir" -ForegroundColor Cyan
Write-Host "📊 Arquivos: $copiedFiles essenciais" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Para restaurar: .\checkpoints\restore-checkpoint.ps1 $nextNumber" -ForegroundColor Cyan
