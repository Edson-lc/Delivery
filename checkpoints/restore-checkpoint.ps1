# Script de Restauração de Checkpoints - VERSÃO MELHORADA
# Uso: .\restore-checkpoint.ps1 [número] ou .\restore-checkpoint.ps1 list

param(
    [Parameter(Mandatory=$true)]
    [string]$CheckpointNumber
)

# Função para listar checkpoints disponíveis
function Show-AvailableCheckpoints {
    Write-Host "=== CHECKPOINTS DISPONÍVEIS ===" -ForegroundColor Green
    Write-Host ""
    
    $checkpointDirs = Get-ChildItem -Path "checkpoints" -Directory | Where-Object { $_.Name -match "^checkpoint-\d+-" } | Sort-Object Name
    
    if ($checkpointDirs.Count -eq 0) {
        Write-Host "❌ Nenhum checkpoint encontrado!" -ForegroundColor Red
        return
    }
    
    foreach ($dir in $checkpointDirs) {
        if ($dir.Name -match "checkpoint-(\d+)-(.+)") {
            $number = $matches[1]
            $description = $matches[2] -replace "-", " "
            
            # Verificar se existe documentação
            $docPath = "checkpoints\$($dir.Name).md"
            $hasDoc = Test-Path $docPath
            
            $status = if ($hasDoc) { "📄" } else { "⚠️ " }
            $color = if ($hasDoc) { "Green" } else { "Yellow" }
            
            Write-Host "Checkpoint $number`: $description" -ForegroundColor $color
            Write-Host "  📁 $($dir.Name)" -ForegroundColor Gray
            if ($hasDoc) {
                Write-Host "  📄 Documentação disponível" -ForegroundColor Gray
            } else {
                Write-Host "  ⚠️  Sem documentação" -ForegroundColor Yellow
            }
            Write-Host ""
        }
    }
    
    Write-Host "💡 Para restaurar: .\restore-checkpoint.ps1 [número]" -ForegroundColor Cyan
    Write-Host "💡 Exemplo: .\restore-checkpoint.ps1 13" -ForegroundColor Cyan
}

# Função para restaurar arquivos
function Restore-Files {
    param(
        [string]$CheckpointDir,
        [string]$CheckpointNumber
    )
    
    Write-Host "🔄 Restaurando Checkpoint $CheckpointNumber..." -ForegroundColor Blue
    Write-Host "📁 Diretório: $CheckpointDir" -ForegroundColor Cyan
    Write-Host ""
    
    # Mapeamento de arquivos para restaurar
    $fileMappings = @(
        # Frontend - Páginas
        @{ source = "Home.jsx"; dest = "src\pages\Home.jsx" },
        @{ source = "Checkout.jsx"; dest = "src\pages\Checkout.jsx" },
        @{ source = "Login.jsx"; dest = "src\pages\Login.jsx" },
        @{ source = "MinhaConta.jsx"; dest = "src\pages\MinhaConta.jsx" },
        @{ source = "RestaurantMenu.jsx"; dest = "src\pages\RestaurantMenu.jsx" },
        @{ source = "Dashboard.jsx"; dest = "src\pages\Dashboard.jsx" },
        @{ source = "Restaurantes.jsx"; dest = "src\pages\Restaurantes.jsx" },
        @{ source = "Pedidos.jsx"; dest = "src\pages\Pedidos.jsx" },
        @{ source = "Usuarios.jsx"; dest = "src\pages\Usuarios.jsx" },
        @{ source = "Entregadores.jsx"; dest = "src\pages\Entregadores.jsx" },
        @{ source = "PainelEntregador.jsx"; dest = "src\pages\PainelEntregador.jsx" },
        
        # Frontend - Componentes
        @{ source = "RestaurantCard.jsx"; dest = "src\components\public\RestaurantCard.jsx" },
        @{ source = "SearchBar.jsx"; dest = "src\components\public\SearchBar.jsx" },
        @{ source = "FilterSidebar.jsx"; dest = "src\components\public\FilterSidebar.jsx" },
        @{ source = "PromotionalSlider.jsx"; dest = "src\components\public\PromotionalSlider.jsx" },
        @{ source = "CartSidebar.jsx"; dest = "src\components\public\CartSidebar.jsx" },
        @{ source = "MenuItemCard.jsx"; dest = "src\components\public\MenuItemCard.jsx" },
        @{ source = "PaymentMethodSelector.jsx"; dest = "src\components\checkout\PaymentMethodSelector.jsx" },
        @{ source = "AddressSelector.jsx"; dest = "src\components\checkout\AddressSelector.jsx" },
        @{ source = "ProfileForm.jsx"; dest = "src\components\account\ProfileForm.jsx" },
        @{ source = "PaymentMethods.jsx"; dest = "src\components\account\PaymentMethods.jsx" },
        @{ source = "OrderHistory.jsx"; dest = "src\components\account\OrderHistory.jsx" },
        @{ source = "RestaurantOrdersManager.jsx"; dest = "src\components\restaurant\RestaurantOrdersManager.jsx" },
        @{ source = "RestaurantMenuManager.jsx"; dest = "src\components\restaurant\RestaurantMenuManager.jsx" },
        @{ source = "NotificationModal.jsx"; dest = "src\components\drivers\NotificationModal.jsx" },
        @{ source = "DriverLocationMap.jsx"; dest = "src\components\drivers\DriverLocationMap.jsx" },
        
        # Frontend - Layouts
        @{ source = "PublicLayout.jsx"; dest = "src\pages\layouts\PublicLayout.jsx" },
        @{ source = "AdminLayout.jsx"; dest = "src\pages\layouts\AdminLayout.jsx" },
        @{ source = "RestaurantLayout.jsx"; dest = "src\pages\layouts\RestaurantLayout.jsx" },
        
        # Frontend - Hooks
        @{ source = "usePublicRestaurants.js"; dest = "src\hooks\usePublicRestaurants.js" },
        
        # Frontend - API
        @{ source = "entities.js"; dest = "src\api\entities.js" },
        @{ source = "httpClient.js"; dest = "src\api\httpClient.js" },
        @{ source = "session.js"; dest = "src\api\session.js" },
        
        # Frontend - Contexts
        @{ source = "AuthContext.jsx"; dest = "src\contexts\AuthContext.jsx" },
        
        # Backend - Rotas
        @{ source = "public.ts"; dest = "server\src\routes\public.ts" },
        @{ source = "auth.ts"; dest = "server\src\routes\auth.ts" },
        @{ source = "orders.ts"; dest = "server\src\routes\orders.ts" },
        @{ source = "restaurants.ts"; dest = "server\src\routes\restaurants.ts" },
        @{ source = "users.ts"; dest = "server\src\routes\users.ts" },
        @{ source = "entregadores.ts"; dest = "server\src\routes\entregadores.ts" },
        @{ source = "carts.ts"; dest = "server\src\routes\carts.ts" },
        @{ source = "menu-items.ts"; dest = "server\src\routes\menu-items.ts" },
        @{ source = "deliveries.ts"; dest = "server\src\routes\deliveries.ts" },
        
        # Backend - Middleware
        @{ source = "authenticate.ts"; dest = "server\src\middleware\authenticate.ts" },
        @{ source = "require-role.ts"; dest = "server\src\middleware\require-role.ts" },
        @{ source = "security.ts"; dest = "server\src\middleware\security.ts" },
        
        # Backend - Utils
        @{ source = "auth.ts"; dest = "server\src\utils\auth.ts" },
        @{ source = "errors.ts"; dest = "server\src\utils\errors.ts" },
        @{ source = "user.ts"; dest = "server\src\utils\user.ts" },
        
        # Backend - Schemas
        @{ source = "validation.ts"; dest = "server\src\schemas\validation.ts" },
        
        # Backend - App
        @{ source = "app.ts"; dest = "server\src\app.ts" },
        @{ source = "server.ts"; dest = "server\src\server.ts" },
        
        # Database
        @{ source = "schema.prisma"; dest = "server\prisma\schema.prisma" }
    )
    
    $restoredFiles = 0
    $totalFiles = $fileMappings.Count
    
    foreach ($mapping in $fileMappings) {
        $sourcePath = "$CheckpointDir\$($mapping.source)"
        $destPath = $mapping.dest
        
        if (Test-Path $sourcePath) {
            # Criar diretório de destino se não existir
            $destDir = Split-Path $destPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                Write-Host "  📁 Criado diretório: $destDir" -ForegroundColor Gray
            }
            
            Copy-Item $sourcePath $destPath -Force
            $restoredFiles++
            Write-Host "  ✅ $($mapping.source) → $destPath" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $($mapping.source) (não encontrado no checkpoint)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "📊 Arquivos restaurados: $restoredFiles de $totalFiles" -ForegroundColor Yellow
    
    return $restoredFiles
}

# Função para mostrar informações do checkpoint
function Show-CheckpointInfo {
    param(
        [string]$CheckpointNumber
    )
    
    $checkpointDirs = Get-ChildItem -Path "checkpoints" -Directory | Where-Object { $_.Name -match "^checkpoint-$CheckpointNumber-" }
    
    if ($checkpointDirs.Count -eq 0) {
        Write-Host "❌ Checkpoint $CheckpointNumber não encontrado!" -ForegroundColor Red
        return $false
    }
    
    $checkpointDir = $checkpointDirs[0].FullName
    $docPath = "checkpoints\checkpoint-$CheckpointNumber-*.md"
    $docFiles = Get-ChildItem -Path $docPath -ErrorAction SilentlyContinue
    
    Write-Host "📋 Informações do Checkpoint $CheckpointNumber" -ForegroundColor Cyan
    Write-Host "📁 Diretório: $($checkpointDirs[0].Name)" -ForegroundColor Gray
    
    if ($docFiles.Count -gt 0) {
        Write-Host "📄 Documentação: $($docFiles[0].Name)" -ForegroundColor Gray
        
        # Mostrar primeiras linhas da documentação
        $docContent = Get-Content $docFiles[0].FullName -Head 10
        Write-Host ""
        Write-Host "📝 Descrição:" -ForegroundColor Yellow
        foreach ($line in $docContent) {
            if ($line -match "^\*\*Descrição:\*\* (.+)") {
                Write-Host "   $($matches[1])" -ForegroundColor White
                break
            }
        }
    } else {
        Write-Host "⚠️  Sem documentação disponível" -ForegroundColor Yellow
    }
    
    Write-Host ""
    return $true
}

# Verificar se é comando de listagem
if ($CheckpointNumber -eq "list") {
    Show-AvailableCheckpoints
    exit 0
}

# Verificar se o checkpoint existe
$checkpointDirs = Get-ChildItem -Path "checkpoints" -Directory | Where-Object { $_.Name -match "^checkpoint-$CheckpointNumber-" }

if ($checkpointDirs.Count -eq 0) {
    Write-Host "❌ Checkpoint $CheckpointNumber não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Use: .\restore-checkpoint.ps1 list" -ForegroundColor Yellow
    Write-Host "💡 Para ver checkpoints disponíveis" -ForegroundColor Yellow
    exit 1
}

$checkpointDir = $checkpointDirs[0].FullName

# Mostrar informações do checkpoint
if (-not (Show-CheckpointInfo $CheckpointNumber)) {
    exit 1
}

# Confirmar restauração
Write-Host "⚠️  ATENÇÃO: Esta operação irá sobrescrever arquivos atuais!" -ForegroundColor Red
Write-Host "💡 Certifique-se de que não há mudanças não salvas." -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Deseja continuar? (s/N)"

if ($confirmation -notmatch "^[sS]") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Restaurar arquivos
$restoredCount = Restore-Files $checkpointDir $CheckpointNumber

Write-Host ""
Write-Host "🎉 Checkpoint $CheckpointNumber restaurado com sucesso!" -ForegroundColor Green
Write-Host "📊 Total de arquivos restaurados: $restoredCount" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Reinicie o servidor de desenvolvimento" -ForegroundColor White
Write-Host "   2. Teste as funcionalidades" -ForegroundColor White
Write-Host "   3. Verifique se tudo está funcionando" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   npm run dev          # Reiniciar frontend" -ForegroundColor Gray
Write-Host "   cd server && npm run dev  # Reiniciar backend" -ForegroundColor Gray