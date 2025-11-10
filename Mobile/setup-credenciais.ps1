# Script para configurar credenciais Android
Write-Host "=== Configurando Credenciais Android ===" -ForegroundColor Green
Write-Host ""

Write-Host "Gerando credenciais Android..." -ForegroundColor Yellow
Write-Host "Quando solicitado, escolha gerar novas credenciais." -ForegroundColor Cyan
Write-Host ""

eas credentials

Write-Host ""
Write-Host "[OK] Credenciais configuradas!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora voce pode executar:" -ForegroundColor Yellow
Write-Host "   .\build-apk.ps1" -ForegroundColor Cyan
Write-Host "   OU" -ForegroundColor Yellow
Write-Host "   eas build --platform android --profile preview" -ForegroundColor Cyan

