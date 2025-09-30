# Script para Backup Automático Antes de Mudanças
# Uso: .\backup-before-changes.ps1 "descrição-da-mudanca"
# Exemplo: .\backup-before-changes.ps1 "implementacao-stripe"

param(
    [Parameter(Mandatory=$true)]
    [string]$ChangeDescription
)

# Gerar timestamp para o backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "backup-$timestamp-$ChangeDescription"
$backupDir = "checkpoints\backups\$backupName"

Write-Host "🔄 Criando backup automático antes das mudanças..." -ForegroundColor Blue
Write-Host "📁 Diretório: $backupDir" -ForegroundColor Cyan
Write-Host "📝 Descrição: $ChangeDescription" -ForegroundColor Cyan
Write-Host ""

# Criar diretório de backup
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Lista de arquivos para backup (mesma lista do create-checkpoint.ps1)
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

Write-Host "📁 Fazendo backup dos arquivos..." -ForegroundColor Yellow

foreach ($file in $filesToBackup) {
    $sourcePath = $file.source
    $destPath = "$backupDir\$($file.dest)"
    
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

# Criar arquivo de documentação do backup
$docContent = @"
# Backup Automático: $ChangeDescription

**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Status:** ✅ Backup Criado  
**Descrição:** $ChangeDescription

## 📁 Arquivos Incluídos

Este backup contém $copiedFiles de $totalFiles arquivos monitorados:

### Frontend
- Páginas principais
- Componentes reutilizáveis  
- Hooks customizados
- Contextos React
- Cliente API

### Backend
- Rotas da API
- Middleware de segurança
- Utilitários
- Schemas de validação
- Configuração da aplicação

### Database
- Schema do Prisma

## 🔄 Como Restaurar

Para restaurar este backup:

```powershell
# Copiar arquivos de volta
Copy-Item "checkpoints\backups\$backupName\*" "src\" -Recurse -Force
Copy-Item "checkpoints\backups\$backupName\*" "server\src\" -Recurse -Force
```

## 📝 Notas

- Backup criado automaticamente antes das mudanças
- Todos os arquivos principais foram incluídos
- Reinicie o servidor após restaurar

## 🎯 Próximos Passos

1. Implementar as mudanças planejadas
2. Testar as funcionalidades
3. Criar checkpoint se necessário
4. Documentar funcionalidades adicionadas

---

*Backup criado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
"@

$docPath = "checkpoints\backups\$backupName.md"
$docContent | Out-File -FilePath $docPath -Encoding UTF8

Write-Host ""
Write-Host "🎉 Backup criado com sucesso!" -ForegroundColor Green
Write-Host "📁 Diretório: $backupDir" -ForegroundColor Cyan
Write-Host "📄 Documentação: $docPath" -ForegroundColor Cyan
Write-Host "📊 Arquivos copiados: $copiedFiles de $totalFiles" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Agora você pode fazer suas mudanças com segurança!" -ForegroundColor Green
Write-Host "💡 Se algo der errado, use o backup para restaurar." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Implementar suas mudanças" -ForegroundColor White
Write-Host "   2. Testar as funcionalidades" -ForegroundColor White
Write-Host "   3. Criar checkpoint se necessário" -ForegroundColor White
Write-Host "   4. Documentar as mudanças" -ForegroundColor White
