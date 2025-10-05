# Script simples para detectar IP e atualizar configurações
Write-Host "Detectando IP atual da rede local..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "Execute este script na raiz do projeto AmaDelivery" -ForegroundColor Red
    exit 1
}

# Obter IP da máquina
$ip = $null

# Tentativa 1: PowerShell Get-NetIPAddress
try {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.16.*"} | Select-Object -First 1).IPAddress
} catch {
    Write-Host "Metodo 1 falhou, tentando metodo alternativo..." -ForegroundColor Yellow
}

# Tentativa 2: ipconfig
if (-not $ip) {
    try {
        $ipconfig = ipconfig | Select-String "IPv4" | Select-String "192.168|10\.|172\.16" | Select-Object -First 1
        if ($ipconfig) {
            $ip = ($ipconfig -split ":")[1].Trim()
        }
    } catch {
        Write-Host "Metodo 2 falhou" -ForegroundColor Yellow
    }
}

if (-not $ip) {
    Write-Host "Nao foi possivel detectar o IP da rede local" -ForegroundColor Red
    Write-Host "Solucoes:" -ForegroundColor Yellow
    Write-Host "   1. Configure um IP fixo no seu roteador" -ForegroundColor White
    Write-Host "   2. Execute este script novamente" -ForegroundColor White
    exit 1
}

Write-Host "IP detectado: $ip" -ForegroundColor Green

# Verificar se o IP mudou
$currentEnvFile = ".env.local"
$ipChanged = $false

if (Test-Path $currentEnvFile) {
    $currentContent = Get-Content $currentEnvFile -Raw
    if ($currentContent -notlike "*$ip*") {
        $ipChanged = $true
        Write-Host "IP mudou! Atualizando configuracoes..." -ForegroundColor Yellow
    } else {
        Write-Host "IP nao mudou, configuracoes estao atualizadas" -ForegroundColor Green
    }
} else {
    $ipChanged = $true
    Write-Host "Criando arquivo de configuracao..." -ForegroundColor Blue
}

# Atualizar arquivo .env.local
if ($ipChanged) {
    $envContent = @"
# Configuracao automatica para rede local
# Ultima atualizacao: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
VITE_API_URL=http://$ip`:4000/api

# URLs de acesso
# Frontend: http://$ip`:5173
# Backend:  http://$ip`:4000
# Local:    http://localhost:5173
"@
    
    $envContent | Out-File -FilePath $currentEnvFile -Encoding UTF8
    Write-Host "Arquivo .env.local atualizado com IP: $ip" -ForegroundColor Green
}

# Mostrar informações
Write-Host ""
Write-Host "URLs de acesso:" -ForegroundColor Green
Write-Host "   Frontend: http://$ip`:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://$ip`:4000" -ForegroundColor Cyan
Write-Host "   Local:    http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

# Verificar se os serviços estão rodando
Write-Host "Verificando status dos servicos..." -ForegroundColor Blue

# Verificar backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/public/restaurants" -Method GET -TimeoutSec 5
    Write-Host "Backend esta rodando" -ForegroundColor Green
} catch {
    Write-Host "Backend nao esta rodando" -ForegroundColor Yellow
    Write-Host "   Execute: cd server && npm run dev" -ForegroundColor Cyan
}

# Verificar frontend
$frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*vite*"}
if ($frontendProcess) {
    Write-Host "Frontend esta rodando" -ForegroundColor Green
} else {
    Write-Host "Frontend nao esta rodando" -ForegroundColor Yellow
    Write-Host "   Execute: npm run dev:network" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Para acessar de outros dispositivos:" -ForegroundColor Yellow
Write-Host "   1. Conecte o dispositivo na mesma rede Wi-Fi" -ForegroundColor White
Write-Host "   2. Abra o navegador e acesse: http://$ip`:5173" -ForegroundColor White
Write-Host ""

Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "   1. Execute este script sempre que o IP mudar" -ForegroundColor White
Write-Host "   2. Configure um IP fixo no roteador (recomendado)" -ForegroundColor White
Write-Host "   3. Use um servico de DNS dinamico para acesso externo" -ForegroundColor White
Write-Host ""

Write-Host "Configuracao atualizada com sucesso!" -ForegroundColor Green
