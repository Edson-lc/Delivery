# Script para Criar Checkpoints Automaticamente
# Uso: .\create-checkpoint.ps1 "descrição-do-checkpoint"
# Exemplo: .\create-checkpoint.ps1 "implementacao-stripe-pagamentos"

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

Write-Host "Criando Checkpoint $($nextNumber): $($Description)" -ForegroundColor Blue

# Criar diretório do checkpoint
New-Item -ItemType Directory -Path $checkpointDir -Force | Out-Null

# Lista de arquivos para monitorar (expandir conforme necessário)
$filesToBackup = @(
    # Frontend - Páginas
    @{ source = "src\pages\Home.jsx"; dest = "Home.jsx" },
    @{ source = "src\pages\Checkout.jsx"; dest = "Checkout.jsx" },
    @{ source = "src\pages\Login.jsx"; dest = "Login.jsx" },
    @{ source = "src\pages\MinhaConta.jsx"; dest = "MinhaConta.jsx" },
    @{ source = "src\pages\RestaurantMenu.jsx"; dest = "RestaurantMenu.jsx" },
    @{ source = "src\pages\Dashboard.jsx"; dest = "Dashboard.jsx" },
    @{ source = "src\pages\Restaurantes.jsx"; dest = "Restaurantes.jsx" },
    @{ source = "src\pages\Pedidos.jsx"; dest = "Pedidos.jsx" },
    @{ source = "src\pages\Usuarios.jsx"; dest = "Usuarios.jsx" },
    @{ source = "src\pages\Entregadores.jsx"; dest = "Entregadores.jsx" },
    @{ source = "src\pages\PainelEntregador.jsx"; dest = "PainelEntregador.jsx" },
    
    # Frontend - Componentes
    @{ source = "src\components\public\RestaurantCard.jsx"; dest = "RestaurantCard.jsx" },
    @{ source = "src\components\public\SearchBar.jsx"; dest = "SearchBar.jsx" },
    @{ source = "src\components\public\FilterSidebar.jsx"; dest = "FilterSidebar.jsx" },
    @{ source = "src\components\public\PromotionalSlider.jsx"; dest = "PromotionalSlider.jsx" },
    @{ source = "src\components\public\CartSidebar.jsx"; dest = "CartSidebar.jsx" },
    @{ source = "src\components\public\MenuItemCard.jsx"; dest = "MenuItemCard.jsx" },
    @{ source = "src\components\checkout\PaymentMethodSelector.jsx"; dest = "PaymentMethodSelector.jsx" },
    @{ source = "src\components\checkout\AddressSelector.jsx"; dest = "AddressSelector.jsx" },
    @{ source = "src\components\account\ProfileForm.jsx"; dest = "ProfileForm.jsx" },
    @{ source = "src\components\account\PaymentMethods.jsx"; dest = "PaymentMethods.jsx" },
    @{ source = "src\components\account\OrderHistory.jsx"; dest = "OrderHistory.jsx" },
    @{ source = "src\components\restaurant\RestaurantOrdersManager.jsx"; dest = "RestaurantOrdersManager.jsx" },
    @{ source = "src\components\restaurant\RestaurantMenuManager.jsx"; dest = "RestaurantMenuManager.jsx" },
    @{ source = "src\components\drivers\NotificationModal.jsx"; dest = "NotificationModal.jsx" },
    @{ source = "src\components\drivers\DriverLocationMap.jsx"; dest = "DriverLocationMap.jsx" },
    
    # Frontend - Layouts
    @{ source = "src\pages\layouts\PublicLayout.jsx"; dest = "PublicLayout.jsx" },
    @{ source = "src\pages\layouts\AdminLayout.jsx"; dest = "AdminLayout.jsx" },
    @{ source = "src\pages\layouts\RestaurantLayout.jsx"; dest = "RestaurantLayout.jsx" },
    
    # Frontend - Hooks
    @{ source = "src\hooks\usePublicRestaurants.js"; dest = "usePublicRestaurants.js" },
    
    # Frontend - API
    @{ source = "src\api\entities.js"; dest = "entities.js" },
    @{ source = "src\api\httpClient.js"; dest = "httpClient.js" },
    @{ source = "src\api\session.js"; dest = "session.js" },
    
    # Frontend - Contexts
    @{ source = "src\contexts\AuthContext.jsx"; dest = "AuthContext.jsx" },
    
    # Backend - Rotas
    @{ source = "server\src\routes\public.ts"; dest = "public.ts" },
    @{ source = "server\src\routes\auth.ts"; dest = "auth.ts" },
    @{ source = "server\src\routes\orders.ts"; dest = "orders.ts" },
    @{ source = "server\src\routes\restaurants.ts"; dest = "restaurants.ts" },
    @{ source = "server\src\routes\users.ts"; dest = "users.ts" },
    @{ source = "server\src\routes\entregadores.ts"; dest = "entregadores.ts" },
    @{ source = "server\src\routes\carts.ts"; dest = "carts.ts" },
    @{ source = "server\src\routes\menu-items.ts"; dest = "menu-items.ts" },
    @{ source = "server\src\routes\deliveries.ts"; dest = "deliveries.ts" },
    
    # Backend - Middleware
    @{ source = "server\src\middleware\authenticate.ts"; dest = "authenticate.ts" },
    @{ source = "server\src\middleware\require-role.ts"; dest = "require-role.ts" },
    @{ source = "server\src\middleware\security.ts"; dest = "security.ts" },
    
    # Backend - Utils
    @{ source = "server\src\utils\auth.ts"; dest = "auth.ts" },
    @{ source = "server\src\utils\errors.ts"; dest = "errors.ts" },
    @{ source = "server\src\utils\user.ts"; dest = "user.ts" },
    
    # Backend - Schemas
    @{ source = "server\src\schemas\validation.ts"; dest = "validation.ts" },
    
    # Backend - App
    @{ source = "server\src\app.ts"; dest = "app.ts" },
    @{ source = "server\src\server.ts"; dest = "server.ts" },
    
    # Database
    @{ source = "server\prisma\schema.prisma"; dest = "schema.prisma" }
)

# Contador de arquivos copiados
$copiedFiles = 0
$totalFiles = $filesToBackup.Count

Write-Host "Verificando e copiando arquivos..." -ForegroundColor Yellow

foreach ($file in $filesToBackup) {
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
        Write-Host "  OK $($file.dest)" -ForegroundColor Green
    } else {
        Write-Host "  WARN $($file.dest) (nao encontrado)" -ForegroundColor Yellow
    }
}

# Criar arquivo de documentação do checkpoint
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$docContent = @"
# Checkpoint $($nextNumber): $($Description)

**Data:** $timestamp  
**Status:** ✅ Criado Automaticamente  
**Descricao:** $($Description)

## 📁 Arquivos Incluídos

Este checkpoint contem $($copiedFiles) de $($totalFiles) arquivos monitorados:

### Frontend
- Paginas principais
- Componentes reutilizaveis  
- Hooks customizados
- Contextos React
- Cliente API

### Backend
- Rotas da API
- Middleware de seguranca
- Utilitarios
- Schemas de validacao
- Configuracao da aplicacao

### Database
- Schema do Prisma

## 🔄 Como Restaurar

Para restaurar este checkpoint:

```powershell
.\checkpoints\restore-checkpoint.ps1 $($nextNumber)
```

## 📝 Notas

- Checkpoint criado automaticamente pelo sistema
- Todos os arquivos principais foram incluídos
- Reinicie o servidor após restaurar

## 🎯 Próximos Passos

1. Testar as mudanças implementadas
2. Criar próximo checkpoint se necessário
3. Documentar funcionalidades adicionadas

---

*Checkpoint criado automaticamente em $($timestamp)*
"@

$docPath = "checkpoints\$checkpointName.md"
$docContent | Out-File -FilePath $docPath -Encoding UTF8

Write-Host ""
Write-Host "Checkpoint $($nextNumber) criado com sucesso!" -ForegroundColor Green
Write-Host "Diretorio: $checkpointDir" -ForegroundColor Cyan
Write-Host "Documentacao: $docPath" -ForegroundColor Cyan
Write-Host "Arquivos copiados: $($copiedFiles) de $($totalFiles)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para restaurar este checkpoint:" -ForegroundColor Yellow
Write-Host "   .\checkpoints\restore-checkpoint.ps1 $($nextNumber)" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Teste suas mudancas antes de continuar!" -ForegroundColor Red
