# Script para configurar acesso pela internet
Write-Host "Configurando acesso pela internet..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "Execute este script na raiz do projeto AmaDelivery" -ForegroundColor Red
    exit 1
}

# Obter IP público
Write-Host "Detectando IP publico..." -ForegroundColor Blue
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "IP publico detectado: $publicIP" -ForegroundColor Green
} catch {
    Write-Host "Nao foi possivel detectar o IP publico" -ForegroundColor Red
    exit 1
}

# Obter IP local
Write-Host "Detectando IP local..." -ForegroundColor Blue
$localIP = $null
try {
    $adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -notlike "*Loopback*" -and $_.Name -notlike "*vEthernet*" -and $_.Name -notlike "*Docker*"}
    
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
    Write-Host "IP local detectado: $localIP" -ForegroundColor Green
} else {
    Write-Host "IP local nao detectado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== CONFIGURACAO DE ACESSO PELA INTERNET ===" -ForegroundColor Cyan
Write-Host ""

# Mostrar opções
Write-Host "Opcoes para acesso pela internet:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configuracao Manual (IP Publico)" -ForegroundColor White
Write-Host "   - Use o IP publico diretamente" -ForegroundColor Gray
Write-Host "   - Requer configuracao de port forwarding" -ForegroundColor Gray
Write-Host ""
Write-Host "2. DNS Dinamico (Recomendado)" -ForegroundColor White
Write-Host "   - Servico gratuito com hostname fixo" -ForegroundColor Gray
Write-Host "   - Atualizacao automatica do IP" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Tunneling (Ngrok/LocalTunnel)" -ForegroundColor White
Write-Host "   - Solucao rapida sem configuracao" -ForegroundColor Gray
Write-Host "   - Ideal para testes" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Escolha uma opcao (1-3)"

switch ($choice) {
    "1" {
        Write-Host "Configurando acesso por IP publico..." -ForegroundColor Blue
        Write-Host ""
        Write-Host "IMPORTANTE: Para usar IP publico, voce precisa:" -ForegroundColor Yellow
        Write-Host "1. Configurar Port Forwarding no roteador:" -ForegroundColor White
        Write-Host "   - Porta 5173 -> $localIP:5173 (Frontend)" -ForegroundColor Gray
        Write-Host "   - Porta 4000 -> $localIP:4000 (Backend)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Configurar firewall do Windows:" -ForegroundColor White
        Write-Host "   - Permitir conexoes nas portas 5173 e 4000" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. URLs de acesso:" -ForegroundColor White
        Write-Host "   - Frontend: http://$publicIP`:5173" -ForegroundColor Cyan
        Write-Host "   - Backend:  http://$publicIP`:4000" -ForegroundColor Cyan
        Write-Host ""
        
        # Atualizar configurações
        $envContent = @"
# Configuracao para acesso pela internet
# IP publico: $publicIP
# IP local: $localIP
# Ultima atualizacao: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# URLs de acesso
VITE_API_URL=http://$publicIP`:4000/api

# URLs de acesso
# Frontend: http://$publicIP`:5173
# Backend:  http://$publicIP`:4000
# Local:    http://localhost:5173
# Rede:     http://$localIP`:5173
"@
        
        $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Host "Arquivo .env.local atualizado!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host "Configurando DNS Dinamico..." -ForegroundColor Blue
        Write-Host ""
        Write-Host "Servicos gratuitos recomendados:" -ForegroundColor Yellow
        Write-Host "1. DuckDNS (duckdns.org)" -ForegroundColor White
        Write-Host "2. No-IP (noip.com)" -ForegroundColor White
        Write-Host "3. Dynu (dynu.com)" -ForegroundColor White
        Write-Host ""
        
        $hostname = Read-Host "Digite o hostname configurado (ex: amadelivery.duckdns.org)"
        
        if ($hostname) {
            Write-Host ""
            Write-Host "Configuracao DNS Dinamico:" -ForegroundColor Cyan
            Write-Host "1. Configure Port Forwarding no roteador:" -ForegroundColor White
            Write-Host "   - Porta 5173 -> $localIP:5173" -ForegroundColor Gray
            Write-Host "   - Porta 4000 -> $localIP:4000" -ForegroundColor Gray
            Write-Host ""
            Write-Host "2. Configure atualizacao automatica do DNS" -ForegroundColor White
            Write-Host ""
            Write-Host "3. URLs de acesso:" -ForegroundColor White
            Write-Host "   - Frontend: http://$hostname`:5173" -ForegroundColor Cyan
            Write-Host "   - Backend:  http://$hostname`:4000" -ForegroundColor Cyan
            Write-Host ""
            
            # Atualizar configurações
            $envContent = @"
# Configuracao DNS Dinamico
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
            
            # Criar script de atualização DNS
            $updateScript = @"
# Script de atualizacao DNS dinamico
Write-Host "Atualizando DNS dinamico..." -ForegroundColor Blue

# Obter IP publico atual
try {
    `$currentIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "IP publico atual: `$currentIP" -ForegroundColor Green
} catch {
    Write-Host "Erro ao obter IP publico" -ForegroundColor Red
    exit 1
}

# Aqui voce deve adicionar o comando especifico do seu provedor DNS
# Exemplo para DuckDNS:
# `$updateUrl = "https://www.duckdns.org/update?domains=amadelivery&token=SEU_TOKEN&ip=`$currentIP"
# Invoke-RestMethod -Uri `$updateUrl

# Exemplo para No-IP:
# `$updateUrl = "https://dynupdate.no-ip.com/nic/update?hostname=amadelivery.ddns.net&myip=`$currentIP"
# Invoke-RestMethod -Uri `$updateUrl -Credential (Get-Credential)

Write-Host "DNS atualizado com sucesso!" -ForegroundColor Green
"@
            
            $updateScript | Out-File -FilePath "scripts/update-dns.ps1" -Encoding UTF8
            Write-Host "Script de atualizacao criado: scripts/update-dns.ps1" -ForegroundColor Green
        }
    }
    
    "3" {
        Write-Host "Configurando Tunneling..." -ForegroundColor Blue
        Write-Host ""
        Write-Host "Opcoes de tunneling:" -ForegroundColor Yellow
        Write-Host "1. Ngrok (ngrok.com)" -ForegroundColor White
        Write-Host "2. LocalTunnel (localtunnel.me)" -ForegroundColor White
        Write-Host ""
        
        $tunnelChoice = Read-Host "Escolha uma opcao (1-2)"
        
        if ($tunnelChoice -eq "1") {
            Write-Host ""
            Write-Host "Configuracao Ngrok:" -ForegroundColor Cyan
            Write-Host "1. Instale o Ngrok:" -ForegroundColor White
            Write-Host "   - Baixe de: https://ngrok.com/download" -ForegroundColor Gray
            Write-Host "   - Extraia e adicione ao PATH" -ForegroundColor Gray
            Write-Host ""
            Write-Host "2. Execute os comandos:" -ForegroundColor White
            Write-Host "   ngrok http 5173  # Para frontend" -ForegroundColor Gray
            Write-Host "   ngrok http 4000  # Para backend" -ForegroundColor Gray
            Write-Host ""
            Write-Host "3. Use as URLs geradas pelo Ngrok" -ForegroundColor White
            Write-Host ""
            
            # Criar script para Ngrok
            $ngrokScript = @"
# Script para iniciar Ngrok
Write-Host "Iniciando Ngrok..." -ForegroundColor Blue

# Verificar se Ngrok esta instalado
try {
    ngrok version
} catch {
    Write-Host "Ngrok nao encontrado. Instale primeiro:" -ForegroundColor Red
    Write-Host "1. Baixe de: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "2. Extraia e adicione ao PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "Iniciando tunel para frontend (porta 5173)..." -ForegroundColor Green
Start-Process -FilePath "ngrok" -ArgumentList "http", "5173" -WindowStyle Normal

Write-Host "Iniciando tunel para backend (porta 4000)..." -ForegroundColor Green
Start-Process -FilePath "ngrok" -ArgumentList "http", "4000" -WindowStyle Normal

Write-Host "Ngrok iniciado! Acesse http://localhost:4040 para ver as URLs" -ForegroundColor Green
"@
            
            $ngrokScript | Out-File -FilePath "scripts/start-ngrok.ps1" -Encoding UTF8
            Write-Host "Script Ngrok criado: scripts/start-ngrok.ps1" -ForegroundColor Green
            
        } elseif ($tunnelChoice -eq "2") {
            Write-Host ""
            Write-Host "Configuracao LocalTunnel:" -ForegroundColor Cyan
            Write-Host "1. Instale o LocalTunnel:" -ForegroundColor White
            Write-Host "   npm install -g localtunnel" -ForegroundColor Gray
            Write-Host ""
            Write-Host "2. Execute os comandos:" -ForegroundColor White
            Write-Host "   lt --port 5173 --subdomain amadelivery-frontend" -ForegroundColor Gray
            Write-Host "   lt --port 4000 --subdomain amadelivery-backend" -ForegroundColor Gray
            Write-Host ""
            Write-Host "3. Use as URLs geradas pelo LocalTunnel" -ForegroundColor White
            Write-Host ""
            
            # Criar script para LocalTunnel
            $ltScript = @"
# Script para iniciar LocalTunnel
Write-Host "Iniciando LocalTunnel..." -ForegroundColor Blue

# Verificar se LocalTunnel esta instalado
try {
    lt --version
} catch {
    Write-Host "LocalTunnel nao encontrado. Instale primeiro:" -ForegroundColor Red
    Write-Host "npm install -g localtunnel" -ForegroundColor Yellow
    exit 1
}

Write-Host "Iniciando tunel para frontend..." -ForegroundColor Green
Start-Process -FilePath "lt" -ArgumentList "--port", "5173", "--subdomain", "amadelivery-frontend" -WindowStyle Normal

Write-Host "Iniciando tunel para backend..." -ForegroundColor Green
Start-Process -FilePath "lt" -ArgumentList "--port", "4000", "--subdomain", "amadelivery-backend" -WindowStyle Normal

Write-Host "LocalTunnel iniciado!" -ForegroundColor Green
"@
            
            $ltScript | Out-File -FilePath "scripts/start-localtunnel.ps1" -Encoding UTF8
            Write-Host "Script LocalTunnel criado: scripts/start-localtunnel.ps1" -ForegroundColor Green
        }
    }
    
    default {
        Write-Host "Opcao invalida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== CONFIGURACAO CONCLUIDA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure Port Forwarding no roteador (se necessario)" -ForegroundColor White
Write-Host "2. Configure firewall do Windows" -ForegroundColor White
Write-Host "3. Teste o acesso externo" -ForegroundColor White
Write-Host "4. Configure SSL/HTTPS para producao" -ForegroundColor White
Write-Host ""

Write-Host "Configuracao de acesso pela internet concluida!" -ForegroundColor Green
