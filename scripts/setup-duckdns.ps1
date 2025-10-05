# Script para configurar DNS Dinamico com DuckDNS
Write-Host "Configurando DNS Dinamico com DuckDNS..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "Execute este script na raiz do projeto AmaDelivery" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== CONFIGURACAO DNS DINAMICO ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Passos para configurar DuckDNS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Acesse: https://www.duckdns.org" -ForegroundColor White
Write-Host "2. Faça login com Google ou GitHub" -ForegroundColor White
Write-Host "3. Crie um subdomínio (ex: amadelivery)" -ForegroundColor White
Write-Host "4. Anote o token de atualização" -ForegroundColor White
Write-Host ""

$hostname = Read-Host "Digite o hostname completo (ex: amadelivery.duckdns.org)"
$token = Read-Host "Digite o token do DuckDNS"

if (-not $hostname -or -not $token) {
    Write-Host "Hostname e token sao obrigatorios" -ForegroundColor Red
    exit 1
}

# Obter IP público atual
Write-Host "Detectando IP publico atual..." -ForegroundColor Blue
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "IP publico atual: $publicIP" -ForegroundColor Green
} catch {
    Write-Host "Nao foi possivel detectar o IP publico" -ForegroundColor Red
    exit 1
}

# Obter IP local
$localIP = $null
try {
    $adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -notlike "*Loopback*" -and $_.Name -notlike "*vEthernet*"}
    
    foreach ($adapter in $adapters) {
        $ipConfig = Get-NetIPConfiguration -InterfaceAlias $adapter.Name
        if ($ipConfig.IPv4Address) {
            $currentIP = $ipConfig.IPv4Address.IPAddress
            if ($currentIP -like "192.168.*" -or $currentIP -like "10.*") {
                $localIP = $currentIP
                break
            }
        }
    }
} catch {
    Write-Host "Nao foi possivel detectar o IP local" -ForegroundColor Yellow
}

if ($localIP) {
    Write-Host "IP local: $localIP" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== CONFIGURACAO DUCKDNS ===" -ForegroundColor Cyan
Write-Host ""

# Testar atualização do DNS
Write-Host "Testando atualizacao do DNS..." -ForegroundColor Blue
try {
    $updateUrl = "https://www.duckdns.org/update?domains=$($hostname.Split('.')[0])&token=$token&ip=$publicIP"
    $response = Invoke-RestMethod -Uri $updateUrl -TimeoutSec 10
    
    if ($response -eq "OK") {
        Write-Host "DNS atualizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Erro ao atualizar DNS: $response" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao testar atualizacao do DNS" -ForegroundColor Red
    Write-Host "Verifique o hostname e token" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== CONFIGURACAO COMPLETA ===" -ForegroundColor Green
Write-Host ""

# Atualizar configurações do projeto
$envContent = @"
# Configuracao DNS Dinamico DuckDNS
# Hostname: $hostname
# IP publico: $publicIP
# IP local: $localIP
# Ultima atualizacao: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# URLs de acesso
VITE_API_URL=http://$hostname`:4000/api

# URLs de acesso
# Frontend: http://$hostname`:5173
# Backend:  http://$hostname`:4000
# Local:    http://localhost:5173
# Rede:     http://$localIP`:5173
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "Arquivo .env.local atualizado!" -ForegroundColor Green

# Criar script de atualização automática
$updateScript = @"
# Script de atualizacao automatica DuckDNS
Write-Host "Atualizando DNS DuckDNS..." -ForegroundColor Blue

# Configuracoes
`$hostname = "$hostname"
`$token = "$token"

# Obter IP publico atual
try {
    `$currentIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "IP publico atual: `$currentIP" -ForegroundColor Green
} catch {
    Write-Host "Erro ao obter IP publico" -ForegroundColor Red
    exit 1
}

# Atualizar DNS
try {
    `$updateUrl = "https://www.duckdns.org/update?domains=`$(`$hostname.Split('.')[0])&token=`$token&ip=`$currentIP"
    `$response = Invoke-RestMethod -Uri `$updateUrl -TimeoutSec 10
    
    if (`$response -eq "OK") {
        Write-Host "DNS atualizado com sucesso!" -ForegroundColor Green
        Write-Host "Hostname: `$hostname" -ForegroundColor Cyan
        Write-Host "IP: `$currentIP" -ForegroundColor Cyan
    } else {
        Write-Host "Erro ao atualizar DNS: `$response" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao atualizar DNS" -ForegroundColor Red
}
"@

$updateScript | Out-File -FilePath "scripts/update-duckdns.ps1" -Encoding UTF8
Write-Host "Script de atualizacao criado: scripts/update-duckdns.ps1" -ForegroundColor Green

Write-Host ""
Write-Host "=== CONFIGURACAO CONCLUIDA ===" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de acesso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$hostname`:5173" -ForegroundColor White
Write-Host "   Backend:  http://$hostname`:4000" -ForegroundColor White
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure Port Forwarding no roteador:" -ForegroundColor White
Write-Host "   - Porta 5173 -> $localIP:5173" -ForegroundColor Gray
Write-Host "   - Porta 4000 -> $localIP:4000" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure firewall do Windows:" -ForegroundColor White
Write-Host "   - Permitir conexoes nas portas 5173 e 4000" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Execute atualizacao automatica:" -ForegroundColor White
Write-Host "   .\scripts\update-duckdns.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Configure atualizacao periodica (opcional)" -ForegroundColor White
Write-Host "   - Use Agendador de Tarefas do Windows" -ForegroundColor Gray
Write-Host "   - Execute a cada 5 minutos" -ForegroundColor Gray
Write-Host ""

Write-Host "DNS Dinamico configurado com sucesso!" -ForegroundColor Green
Write-Host "Agora voce pode acessar o AmaDelivery pela internet!" -ForegroundColor Green
