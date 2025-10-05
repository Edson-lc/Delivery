# Script melhorado para detectar IP real da rede local
Write-Host "Detectando IP real da rede local..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "Execute este script na raiz do projeto AmaDelivery" -ForegroundColor Red
    exit 1
}

# Obter IP da máquina (ignorando adaptadores virtuais)
$ip = $null

# Tentativa 1: PowerShell Get-NetIPAddress (ignorando adaptadores virtuais)
try {
    $adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -notlike "*Loopback*" -and $_.Name -notlike "*vEthernet*" -and $_.Name -notlike "*Docker*" -and $_.Name -notlike "*Hyper-V*"}
    
    foreach ($adapter in $adapters) {
        $ipConfig = Get-NetIPConfiguration -InterfaceAlias $adapter.Name
        if ($ipConfig.IPv4Address) {
            $currentIP = $ipConfig.IPv4Address.IPAddress
            # Verificar se é um IP de rede local válido
            if ($currentIP -like "192.168.*" -or $currentIP -like "10.*" -or ($currentIP -like "172.*" -and $currentIP -notlike "172.17.*")) {
                $ip = $currentIP
                Write-Host "Adaptador encontrado: $($adapter.Name)" -ForegroundColor Cyan
                Write-Host "Tipo: $($adapter.InterfaceDescription)" -ForegroundColor Gray
                break
            }
        }
    }
} catch {
    Write-Host "Metodo 1 falhou, tentando metodo alternativo..." -ForegroundColor Yellow
}

# Tentativa 2: ipconfig (filtrando adaptadores virtuais)
if (-not $ip) {
    try {
        $ipconfig = ipconfig | Select-String "Adaptador|IPv4" | Where-Object {$_ -notlike "*vEthernet*" -and $_ -notlike "*Docker*" -and $_ -notlike "*Hyper-V*"}
        
        $lines = $ipconfig -split "`n"
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -like "*Adaptador*" -and $lines[$i] -notlike "*vEthernet*" -and $lines[$i] -notlike "*Docker*") {
                # Procurar IPv4 nas próximas linhas
                for ($j = $i + 1; $j -lt $i + 10 -and $j -lt $lines.Length; $j++) {
                    if ($lines[$j] -like "*IPv4*" -and $lines[$j] -like "*192.168.*") {
                        $ip = ($lines[$j] -split ":")[1].Trim()
                        break
                    }
                }
                if ($ip) { break }
            }
        }
    } catch {
        Write-Host "Metodo 2 falhou" -ForegroundColor Yellow
    }
}

# Tentativa 3: Usar apenas adaptadores físicos
if (-not $ip) {
    try {
        $physicalAdapters = Get-NetAdapter | Where-Object {
            $_.Status -eq "Up" -and 
            $_.Name -notlike "*Loopback*" -and 
            $_.Name -notlike "*vEthernet*" -and 
            $_.Name -notlike "*Docker*" -and 
            $_.Name -notlike "*Hyper-V*" -and
            $_.Name -notlike "*Bluetooth*" -and
            $_.InterfaceDescription -notlike "*Virtual*"
        }
        
        foreach ($adapter in $physicalAdapters) {
            $ipConfig = Get-NetIPConfiguration -InterfaceAlias $adapter.Name
            if ($ipConfig.IPv4Address) {
                $currentIP = $ipConfig.IPv4Address.IPAddress
                if ($currentIP -like "192.168.*") {
                    $ip = $currentIP
                    Write-Host "Adaptador fisico encontrado: $($adapter.Name)" -ForegroundColor Cyan
                    break
                }
            }
        }
    } catch {
        Write-Host "Metodo 3 falhou" -ForegroundColor Yellow
    }
}

if (-not $ip) {
    Write-Host "Nao foi possivel detectar o IP da rede local" -ForegroundColor Red
    Write-Host "Adaptadores encontrados:" -ForegroundColor Yellow
    
    # Mostrar todos os adaptadores para debug
    $allAdapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
    foreach ($adapter in $allAdapters) {
        $ipConfig = Get-NetIPConfiguration -InterfaceAlias $adapter.Name -ErrorAction SilentlyContinue
        if ($ipConfig -and $ipConfig.IPv4Address) {
            Write-Host "  $($adapter.Name): $($ipConfig.IPv4Address.IPAddress)" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "Solucoes:" -ForegroundColor Yellow
    Write-Host "   1. Configure um IP fixo no seu roteador" -ForegroundColor White
    Write-Host "   2. Execute este script novamente" -ForegroundColor White
    exit 1
}

Write-Host "IP real detectado: $ip" -ForegroundColor Green

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
# IP detectado: $ip
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
