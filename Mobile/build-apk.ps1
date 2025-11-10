# Script para Build do APK - AmaEats
Write-Host "=== Build APK AmaEats ===" -ForegroundColor Green
Write-Host ""

# Verificar se está logado
Write-Host "1. Verificando login..." -ForegroundColor Yellow
eas whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Voce nao esta logado. Por favor, execute:" -ForegroundColor Red
    Write-Host "   eas login" -ForegroundColor Cyan
    exit 1
}
Write-Host "[OK] Logado" -ForegroundColor Green
Write-Host ""

# Configurar projeto (se necessário)
Write-Host "2. Configurando projeto..." -ForegroundColor Yellow

# Verificar se o projeto EAS está inicializado
$easProjectCheck = eas project:info 2>&1
if ($LASTEXITCODE -ne 0 -or $easProjectCheck -match "not configured") {
    Write-Host "Inicializando projeto EAS..." -ForegroundColor Cyan
    Write-Host "Se solicitado, escolha criar um novo projeto." -ForegroundColor Yellow
    eas init --non-interactive
}

if (!(Test-Path "eas.json")) {
    Write-Host "Configurando EAS..." -ForegroundColor Cyan
    eas build:configure --non-interactive
}

Write-Host "[OK] Projeto configurado" -ForegroundColor Green
Write-Host ""

# Build do APK
Write-Host "3. Iniciando build do APK..." -ForegroundColor Yellow
Write-Host "Este processo pode levar 15-30 minutos..." -ForegroundColor Cyan
Write-Host ""

eas build --platform android --profile preview --non-interactive

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Build iniciado com sucesso!" -ForegroundColor Green
    Write-Host "Voce recebera uma notificacao quando o build estiver pronto." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para verificar o status:" -ForegroundColor Yellow
    Write-Host "   eas build:list" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para baixar o APK quando estiver pronto:" -ForegroundColor Yellow
    Write-Host "   eas build:download [BUILD_ID]" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[ERRO] Erro ao iniciar build. Verifique as mensagens acima." -ForegroundColor Red
}

