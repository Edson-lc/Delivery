# Script para configurar IP fixo automaticamente
# Este script ajuda a configurar um IP fixo no Windows

Write-Host "🔧 Configurador de IP Fixo - AmaDelivery" -ForegroundColor Green
Write-Host ""

# Verificar se está executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador" -ForegroundColor Red
    Write-Host "💡 Clique com botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green
Write-Host ""

# Obter informações da rede atual
Write-Host "🔍 Analisando configuração de rede atual..." -ForegroundColor Blue

$adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -notlike "*Loopback*"}
$currentIP = $null
$currentGateway = $null
$currentDNS = $null

foreach ($adapter in $adapters) {
    $ipConfig = Get-NetIPConfiguration -InterfaceAlias $adapter.Name
    if ($ipConfig.IPv4Address) {
        $currentIP = $ipConfig.IPv4Address.IPAddress
        $currentGateway = $ipConfig.IPv4DefaultGateway.NextHop
        $currentDNS = $ipConfig.DNSServer.ServerAddresses
        Write-Host "📍 Adaptador: $($adapter.Name)" -ForegroundColor Cyan
        Write-Host "   IP atual: $currentIP" -ForegroundColor White
        Write-Host "   Gateway: $currentGateway" -ForegroundColor White
        Write-Host "   DNS: $($currentDNS -join ', ')" -ForegroundColor White
        break
    }
}

if (-not $currentIP) {
    Write-Host "❌ Não foi possível detectar a configuração de rede atual" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Sugerir IP fixo
$ipParts = $currentIP.Split('.')
$suggestedIP = "$($ipParts[0]).$($ipParts[1]).$($ipParts[2]).100"

Write-Host "💡 Sugestão de IP fixo: $suggestedIP" -ForegroundColor Yellow
Write-Host "   (Usando .100 para evitar conflitos com DHCP)" -ForegroundColor Gray
Write-Host ""

# Perguntar se quer usar a sugestão
$useSuggested = Read-Host "Usar IP sugerido ($suggestedIP)? (s/n)"

if ($useSuggested -eq "s" -or $useSuggested -eq "S" -or $useSuggested -eq "sim") {
    $fixedIP = $suggestedIP
} else {
    $fixedIP = Read-Host "Digite o IP fixo desejado (ex: $suggestedIP)"
    
    # Validar formato do IP
    if (-not ($fixedIP -match '^(\d{1,3}\.){3}\d{1,3}$')) {
        Write-Host "❌ Formato de IP inválido" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Configurando IP fixo: $fixedIP" -ForegroundColor Green

# Encontrar o adaptador correto
$targetAdapter = $null
foreach ($adapter in $adapters) {
    $ipConfig = Get-NetIPConfiguration -InterfaceAlias $adapter.Name
    if ($ipConfig.IPv4Address -and $ipConfig.IPv4Address.IPAddress -eq $currentIP) {
        $targetAdapter = $adapter
        break
    }
}

if (-not $targetAdapter) {
    Write-Host "❌ Não foi possível encontrar o adaptador de rede" -ForegroundColor Red
    exit 1
}

try {
    # Remover configuração DHCP
    Write-Host "🔄 Removendo configuração DHCP..." -ForegroundColor Blue
    Set-NetIPInterface -InterfaceAlias $targetAdapter.Name -Dhcp Disabled
    
    # Configurar IP fixo
    Write-Host "🔄 Configurando IP fixo..." -ForegroundColor Blue
    New-NetIPAddress -InterfaceAlias $targetAdapter.Name -IPAddress $fixedIP -PrefixLength 24 -DefaultGateway $currentGateway -ErrorAction SilentlyContinue
    
    # Configurar DNS
    Write-Host "🔄 Configurando DNS..." -ForegroundColor Blue
    Set-DnsClientServerAddress -InterfaceAlias $targetAdapter.Name -ServerAddresses $currentDNS
    
    Write-Host "✅ IP fixo configurado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Nova configuração:" -ForegroundColor Cyan
    Write-Host "   IP: $fixedIP" -ForegroundColor White
    Write-Host "   Gateway: $currentGateway" -ForegroundColor White
    Write-Host "   DNS: $($currentDNS -join ', ')" -ForegroundColor White
    Write-Host ""
    
    # Atualizar configurações do projeto
    Write-Host "🔄 Atualizando configurações do projeto..." -ForegroundColor Blue
    
    $envContent = @"
# Configuração com IP fixo
# Configurado em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
VITE_API_URL=http://$fixedIP`:4000/api

# URLs de acesso
# Frontend: http://$fixedIP`:5173
# Backend:  http://$fixedIP`:4000
# Local:    http://localhost:5173
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    
    # Atualizar backend se existir
    if (Test-Path "server/.env") {
        $backendContent = Get-Content "server/.env" -Raw
        $backendContent = $backendContent -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=http://$fixedIP`:5173,http://localhost:5173"
        $backendContent | Out-File -FilePath "server/.env" -Encoding UTF8
    }
    
    Write-Host "✅ Configurações do projeto atualizadas!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Configuração completa!" -ForegroundColor Green
    Write-Host "🌐 Acesse: http://$fixedIP`:5173" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "   - Reinicie o computador para aplicar as mudanças" -ForegroundColor White
    Write-Host "   - Configure o mesmo IP no roteador para evitar conflitos" -ForegroundColor White
    Write-Host "   - Teste a conectividade após reiniciar" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao configurar IP fixo: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Tente executar novamente ou configure manualmente" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Pressione Enter para sair"
