# Script principal para resolver problemas de IP dinâmico
# Este script oferece todas as soluções para IP dinâmico

Write-Host "🌐 Solucionador de IP Dinâmico - AmaDelivery" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Execute este script na raiz do projeto AmaDelivery" -ForegroundColor Red
    exit 1
}

# Detectar IP atual
Write-Host "🔍 Detectando configuração atual..." -ForegroundColor Blue

$currentIP = $null
try {
    $currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.16.*"} | Select-Object -First 1).IPAddress
} catch {
    $ipconfig = ipconfig | Select-String "IPv4" | Select-String "192.168\|10\.\|172\.16" | Select-Object -First 1
    if ($ipconfig) {
        $currentIP = ($ipconfig -split ":")[1].Trim()
    }
}

if ($currentIP) {
    Write-Host "✅ IP atual detectado: $currentIP" -ForegroundColor Green
} else {
    Write-Host "❌ Não foi possível detectar o IP atual" -ForegroundColor Red
    exit 1
}

# Verificar se há arquivo .env.local
$hasEnvFile = Test-Path ".env.local"
if ($hasEnvFile) {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -like "*$currentIP*") {
        Write-Host "✅ Configuração está atualizada" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Configuração desatualizada" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Arquivo .env.local não encontrado" -ForegroundColor Yellow
}

Write-Host ""

# Mostrar opções
Write-Host "🎯 Escolha uma solução:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 🔄 Atualizar configuração automaticamente" -ForegroundColor White
Write-Host "   (Detecta IP atual e atualiza configurações)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🔄 Monitorar mudanças de IP automaticamente" -ForegroundColor White
Write-Host "   (Roda em background e atualiza quando IP muda)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🔧 Configurar IP fixo" -ForegroundColor White
Write-Host "   (Configura IP fixo no Windows - requer admin)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🌐 Configurar DNS dinâmico" -ForegroundColor White
Write-Host "   (Para acesso externo - requer admin)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 📋 Mostrar informações de rede" -ForegroundColor White
Write-Host "   (Detalhes da configuração atual)" -ForegroundColor Gray
Write-Host ""
Write-Host "6. 🧪 Testar conectividade" -ForegroundColor White
Write-Host "   (Testar se tudo está funcionando)" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Escolha uma opção (1-6)"

switch ($choice) {
    "1" {
        Write-Host "🔄 Executando atualização automática..." -ForegroundColor Blue
        & ".\scripts\auto-detect-ip.ps1"
    }
    "2" {
        Write-Host "🔄 Iniciando monitor de IP..." -ForegroundColor Blue
        $runBackground = Read-Host "Executar em background? (s/n)"
        if ($runBackground -eq "s" -or $runBackground -eq "S") {
            & ".\scripts\ip-monitor.ps1" -Background
            Write-Host "✅ Monitor iniciado em background" -ForegroundColor Green
        } else {
            & ".\scripts\ip-monitor.ps1"
        }
    }
    "3" {
        Write-Host "🔧 Configurando IP fixo..." -ForegroundColor Blue
        & ".\scripts\setup-fixed-ip.ps1"
    }
    "4" {
        Write-Host "🌐 Configurando DNS dinâmico..." -ForegroundColor Blue
        & ".\scripts\setup-dynamic-dns.ps1"
    }
    "5" {
        Write-Host "📋 Informações de rede:" -ForegroundColor Blue
        Write-Host ""
        
        # Informações detalhadas da rede
        $adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -notlike "*Loopback*"}
        
        foreach ($adapter in $adapters) {
            $ipConfig = Get-NetIPConfiguration -InterfaceAlias $adapter.Name
            if ($ipConfig.IPv4Address) {
                Write-Host "📍 Adaptador: $($adapter.Name)" -ForegroundColor Cyan
                Write-Host "   IP: $($ipConfig.IPv4Address.IPAddress)" -ForegroundColor White
                Write-Host "   Gateway: $($ipConfig.IPv4DefaultGateway.NextHop)" -ForegroundColor White
                Write-Host "   DNS: $($ipConfig.DNSServer.ServerAddresses -join ', ')" -ForegroundColor White
                Write-Host "   DHCP: $($ipConfig.NetAdapter.Dhcp)" -ForegroundColor White
                Write-Host ""
            }
        }
        
        # IP público
        try {
            $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
            Write-Host "🌐 IP público: $publicIP" -ForegroundColor Cyan
        } catch {
            Write-Host "❌ Não foi possível obter IP público" -ForegroundColor Red
        }
        
        # Status dos serviços
        Write-Host ""
        Write-Host "🔍 Status dos serviços:" -ForegroundColor Blue
        
        # Backend
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4000/api/public/restaurants" -Method GET -TimeoutSec 5
            Write-Host "✅ Backend: Rodando" -ForegroundColor Green
        } catch {
            Write-Host "❌ Backend: Não está rodando" -ForegroundColor Red
        }
        
        # Frontend
        $frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*vite*"}
        if ($frontendProcess) {
            Write-Host "✅ Frontend: Rodando" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend: Não está rodando" -ForegroundColor Red
        }
        
        Read-Host "Pressione Enter para continuar"
    }
    "6" {
        Write-Host "🧪 Testando conectividade..." -ForegroundColor Blue
        Write-Host ""
        
        # Teste local
        Write-Host "🔍 Teste local:" -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4000/api/public/restaurants" -Method GET -TimeoutSec 5
            Write-Host "✅ Backend local: OK" -ForegroundColor Green
        } catch {
            Write-Host "❌ Backend local: Falhou" -ForegroundColor Red
        }
        
        # Teste de rede
        Write-Host "🔍 Teste de rede:" -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://$currentIP:4000/api/public/restaurants" -Method GET -TimeoutSec 5
            Write-Host "✅ Backend rede: OK" -ForegroundColor Green
        } catch {
            Write-Host "❌ Backend rede: Falhou" -ForegroundColor Red
        }
        
        # Teste de conectividade externa
        Write-Host "🔍 Teste de conectividade externa:" -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "https://api.ipify.org" -Method GET -TimeoutSec 5
            Write-Host "✅ Internet: OK" -ForegroundColor Green
        } catch {
            Write-Host "❌ Internet: Falhou" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "🌐 URLs para teste:" -ForegroundColor Yellow
        Write-Host "   Local: http://localhost:5173" -ForegroundColor White
        Write-Host "   Rede:  http://$currentIP:5173" -ForegroundColor White
        
        Read-Host "Pressione Enter para continuar"
    }
    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Operação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Yellow
Write-Host "   - Execute este script sempre que o IP mudar" -ForegroundColor White
Write-Host "   - Configure IP fixo para evitar mudanças" -ForegroundColor White
Write-Host "   - Use DNS dinâmico para acesso externo" -ForegroundColor White
Write-Host "   - Monitore a conectividade regularmente" -ForegroundColor White
Write-Host ""

Read-Host "Pressione Enter para sair"
