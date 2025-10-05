# Script para monitorar automaticamente mudanças de IP
# Este script roda em background e atualiza as configurações quando o IP muda

param(
    [int]$CheckInterval = 30,  # Verificar a cada 30 segundos
    [switch]$Background = $false  # Rodar em background
)

Write-Host "🔄 Iniciando monitor de IP automático..." -ForegroundColor Green
Write-Host "⏱️ Verificando mudanças a cada $CheckInterval segundos" -ForegroundColor Yellow

if ($Background) {
    Write-Host "🔄 Executando em background..." -ForegroundColor Blue
    Start-Process powershell -ArgumentList "-File", $MyInvocation.MyCommand.Path, "-CheckInterval", $CheckInterval -WindowStyle Hidden
    exit
}

# Função para detectar IP atual
function Get-CurrentIP {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.16.*"} | Select-Object -First 1).IPAddress
        if (-not $ip) {
            $ipconfig = ipconfig | Select-String "IPv4" | Select-String "192.168\|10\.\|172\.16" | Select-Object -First 1
            if ($ipconfig) {
                $ip = ($ipconfig -split ":")[1].Trim()
            }
        }
        return $ip
    } catch {
        return $null
    }
}

# Função para atualizar configurações
function Update-Configurations {
    param([string]$newIP)
    
    Write-Host "🔄 Atualizando configurações para IP: $newIP" -ForegroundColor Yellow
    
    # Atualizar .env.local
    $envContent = @"
# Configuração automática para rede local
# Última atualização: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
VITE_API_URL=http://$newIP`:4000/api

# URLs de acesso
# Frontend: http://$newIP`:5173
# Backend:  http://$newIP`:4000
# Local:    http://localhost:5173
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    
    # Atualizar backend se existir
    if (Test-Path "server/.env") {
        $backendContent = Get-Content "server/.env" -Raw
        $backendContent = $backendContent -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=http://$newIP`:5173,http://localhost:5173"
        $backendContent | Out-File -FilePath "server/.env" -Encoding UTF8
    }
    
    Write-Host "✅ Configurações atualizadas!" -ForegroundColor Green
    Write-Host "🌐 Novo URL: http://$newIP`:5173" -ForegroundColor Cyan
}

# Variáveis de controle
$lastIP = Get-CurrentIP
$startTime = Get-Date

if (-not $lastIP) {
    Write-Host "❌ Não foi possível detectar o IP inicial" -ForegroundColor Red
    exit 1
}

Write-Host "📍 IP inicial detectado: $lastIP" -ForegroundColor Green
Write-Host "🔄 Monitorando mudanças..." -ForegroundColor Blue
Write-Host "⏹️ Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

# Loop principal de monitoramento
try {
    while ($true) {
        Start-Sleep -Seconds $CheckInterval
        
        $currentIP = Get-CurrentIP
        
        if ($currentIP -and $currentIP -ne $lastIP) {
            Write-Host "🔄 IP mudou de $lastIP para $currentIP" -ForegroundColor Yellow
            Update-Configurations -newIP $currentIP
            $lastIP = $currentIP
        } else {
            # Mostrar status a cada 5 minutos
            $elapsed = (Get-Date) - $startTime
            if ($elapsed.TotalMinutes % 5 -lt 1) {
                Write-Host "✅ Monitor ativo - IP: $lastIP - Tempo: $($elapsed.ToString('hh\:mm\:ss'))" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "⏹️ Monitor interrompido pelo usuário" -ForegroundColor Yellow
} finally {
    Write-Host "🔄 Monitor de IP finalizado" -ForegroundColor Blue
}
