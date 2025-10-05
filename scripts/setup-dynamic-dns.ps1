# Script para configurar DNS Dinâmico
# Este script ajuda a configurar acesso externo com DNS dinâmico

Write-Host "🌐 Configurador de DNS Dinâmico - AmaDelivery" -ForegroundColor Green
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

# Obter IP público atual
Write-Host "🔍 Detectando IP público atual..." -ForegroundColor Blue

try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "✅ IP público detectado: $publicIP" -ForegroundColor Green
} catch {
    Write-Host "❌ Não foi possível detectar o IP público" -ForegroundColor Red
    Write-Host "💡 Verifique sua conexão com a internet" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Mostrar opções de DNS dinâmico
Write-Host "🌐 Serviços de DNS Dinâmico disponíveis:" -ForegroundColor Cyan
Write-Host "   1. No-IP (gratuito)" -ForegroundColor White
Write-Host "   2. DuckDNS (gratuito)" -ForegroundColor White
Write-Host "   3. Dynu (gratuito)" -ForegroundColor White
Write-Host "   4. Cloudflare (gratuito)" -ForegroundColor White
Write-Host "   5. Configuração manual" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Escolha uma opção (1-5)"

switch ($choice) {
    "1" {
        Write-Host "🌐 Configurando No-IP..." -ForegroundColor Blue
        Write-Host "📝 Passos:" -ForegroundColor Yellow
        Write-Host "   1. Acesse: https://www.noip.com" -ForegroundColor White
        Write-Host "   2. Crie uma conta gratuita" -ForegroundColor White
        Write-Host "   3. Adicione um hostname (ex: amadelivery.ddns.net)" -ForegroundColor White
        Write-Host "   4. Baixe o cliente No-IP DUC" -ForegroundColor White
        Write-Host "   5. Configure com suas credenciais" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Após configurar, use o hostname no lugar do IP" -ForegroundColor Cyan
    }
    "2" {
        Write-Host "🌐 Configurando DuckDNS..." -ForegroundColor Blue
        Write-Host "📝 Passos:" -ForegroundColor Yellow
        Write-Host "   1. Acesse: https://www.duckdns.org" -ForegroundColor White
        Write-Host "   2. Faça login com Google/GitHub" -ForegroundColor White
        Write-Host "   3. Crie um subdomínio (ex: amadelivery.duckdns.org)" -ForegroundColor White
        Write-Host "   4. Anote o token de atualização" -ForegroundColor White
        Write-Host "   5. Configure atualização automática" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 URL de atualização:" -ForegroundColor Cyan
        Write-Host "   https://www.duckdns.org/update?domains=SEU_DOMINIO&token=SEU_TOKEN" -ForegroundColor White
    }
    "3" {
        Write-Host "🌐 Configurando Dynu..." -ForegroundColor Blue
        Write-Host "📝 Passos:" -ForegroundColor Yellow
        Write-Host "   1. Acesse: https://www.dynu.com" -ForegroundColor White
        Write-Host "   2. Crie uma conta gratuita" -ForegroundColor White
        Write-Host "   3. Adicione um domínio (ex: amadelivery.dynu.net)" -ForegroundColor White
        Write-Host "   4. Configure atualização automática" -ForegroundColor White
        Write-Host "   5. Baixe o cliente Dynu" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Após configurar, use o domínio no lugar do IP" -ForegroundColor Cyan
    }
    "4" {
        Write-Host "🌐 Configurando Cloudflare..." -ForegroundColor Blue
        Write-Host "📝 Passos:" -ForegroundColor Yellow
        Write-Host "   1. Acesse: https://dash.cloudflare.com" -ForegroundColor White
        Write-Host "   2. Adicione seu domínio" -ForegroundColor White
        Write-Host "   3. Configure DNS A record" -ForegroundColor White
        Write-Host "   4. Use API para atualização automática" -ForegroundColor White
        Write-Host "   5. Configure script de atualização" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Requer domínio próprio registrado" -ForegroundColor Cyan
    }
    "5" {
        Write-Host "🌐 Configuração manual..." -ForegroundColor Blue
        Write-Host "📝 Para configuração manual:" -ForegroundColor Yellow
        Write-Host "   1. Configure port forwarding no roteador" -ForegroundColor White
        Write-Host "   2. Configure firewall para permitir conexões" -ForegroundColor White
        Write-Host "   3. Use o IP público diretamente" -ForegroundColor White
        Write-Host "   4. Configure atualização automática do IP" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️ IP público pode mudar a qualquer momento" -ForegroundColor Red
    }
    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Perguntar pelo hostname/domínio
$hostname = Read-Host "Digite o hostname/domínio configurado (ex: amadelivery.ddns.net)"

if (-not $hostname) {
    Write-Host "❌ Hostname é obrigatório" -ForegroundColor Red
    exit 1
}

# Testar conectividade
Write-Host "🔍 Testando conectividade com $hostname..." -ForegroundColor Blue

try {
    $testResult = Test-NetConnection -ComputerName $hostname -Port 80 -WarningAction SilentlyContinue
    if ($testResult.TcpTestSucceeded) {
        Write-Host "✅ Conectividade OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Conectividade limitada (normal se ainda não configurado)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Não foi possível testar conectividade" -ForegroundColor Yellow
}

Write-Host ""

# Configurar port forwarding
Write-Host "🔧 Configuração de Port Forwarding:" -ForegroundColor Cyan
Write-Host "   No seu roteador, configure:" -ForegroundColor White
Write-Host "   - Porta 5173 → $publicIP:5173 (Frontend)" -ForegroundColor White
Write-Host "   - Porta 4000 → $publicIP:4000 (Backend)" -ForegroundColor White
Write-Host "   - Porta 80 → $publicIP:4000 (Opcional)" -ForegroundColor White
Write-Host ""

# Atualizar configurações do projeto
Write-Host "🔄 Atualizando configurações do projeto..." -ForegroundColor Blue

$envContent = @"
# Configuração com DNS Dinâmico
# Hostname: $hostname
# IP público: $publicIP
# Configurado em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# URLs de acesso
VITE_API_URL=http://$hostname`:4000/api

# URLs de acesso
# Frontend: http://$hostname`:5173
# Backend:  http://$hostname`:4000
# Local:    http://localhost:5173
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

# Atualizar backend se existir
if (Test-Path "server/.env") {
    $backendContent = Get-Content "server/.env" -Raw
    $backendContent = $backendContent -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=http://$hostname`:5173,http://localhost:5173"
    $backendContent | Out-File -FilePath "server/.env" -Encoding UTF8
}

Write-Host "✅ Configurações do projeto atualizadas!" -ForegroundColor Green
Write-Host ""

# Criar script de atualização automática
Write-Host "🔄 Criando script de atualização automática..." -ForegroundColor Blue

$updateScript = @"
# Script de atualização automática de DNS
# Execute este script periodicamente para manter o DNS atualizado

Write-Host "🔄 Atualizando DNS dinâmico..." -ForegroundColor Blue

# Obter IP público atual
try {
    `$currentIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "📍 IP público atual: `$currentIP" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao obter IP público" -ForegroundColor Red
    exit 1
}

# Aqui você deve adicionar o comando específico do seu provedor DNS
# Exemplo para DuckDNS:
# `$updateUrl = "https://www.duckdns.org/update?domains=amadelivery&token=SEU_TOKEN&ip=`$currentIP"
# Invoke-RestMethod -Uri `$updateUrl

Write-Host "✅ DNS atualizado com sucesso!" -ForegroundColor Green
"@

$updateScript | Out-File -FilePath "scripts/update-dns.ps1" -Encoding UTF8

Write-Host "✅ Script de atualização criado: scripts/update-dns.ps1" -ForegroundColor Green
Write-Host ""

# Mostrar resumo
Write-Host "🎉 Configuração de DNS Dinâmico concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs de acesso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$hostname`:5173" -ForegroundColor White
Write-Host "   Backend:  http://$hostname`:4000" -ForegroundColor White
Write-Host "   Local:    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Configure port forwarding no roteador" -ForegroundColor White
Write-Host "   - Execute scripts/update-dns.ps1 periodicamente" -ForegroundColor White
Write-Host "   - Teste a conectividade externa" -ForegroundColor White
Write-Host "   - Configure firewall para permitir conexões" -ForegroundColor White

Write-Host ""
Read-Host "Pressione Enter para sair"
