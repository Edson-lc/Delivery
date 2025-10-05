# Script para iniciar Ngrok (acesso pela internet)
Write-Host "Iniciando Ngrok para acesso pela internet..." -ForegroundColor Green

# Verificar se Ngrok esta instalado
try {
    $ngrokVersion = ngrok version 2>$null
    if ($ngrokVersion) {
        Write-Host "Ngrok encontrado: $ngrokVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "Ngrok nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar o Ngrok:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://ngrok.com/download" -ForegroundColor White
    Write-Host "2. Baixe o arquivo ZIP" -ForegroundColor White
    Write-Host "3. Extraia em uma pasta (ex: C:\ngrok)" -ForegroundColor White
    Write-Host "4. Adicione ao PATH do Windows" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou execute este comando para instalar via Chocolatey:" -ForegroundColor Yellow
    Write-Host "choco install ngrok" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter para continuar"
    exit 1
}

Write-Host ""
Write-Host "Iniciando tunel para frontend (porta 5173)..." -ForegroundColor Blue
Write-Host "URL sera gerada automaticamente" -ForegroundColor Gray
Write-Host ""

# Iniciar Ngrok para frontend
Start-Process -FilePath "ngrok" -ArgumentList "http", "5173" -WindowStyle Normal

Write-Host "Tunel para frontend iniciado!" -ForegroundColor Green
Write-Host ""

Write-Host "Iniciando tunel para backend (porta 4000)..." -ForegroundColor Blue
Write-Host "URL sera gerada automaticamente" -ForegroundColor Gray
Write-Host ""

# Iniciar Ngrok para backend
Start-Process -FilePath "ngrok" -ArgumentList "http", "4000" -WindowStyle Normal

Write-Host "Tunel para backend iniciado!" -ForegroundColor Green
Write-Host ""

Write-Host "=== NGROK INICIADO COM SUCESSO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para ver as URLs geradas:" -ForegroundColor Yellow
Write-Host "1. Acesse: http://localhost:4040" -ForegroundColor White
    Write-Host "2. Ou verifique as janelas do Ngrok" -ForegroundColor White
Write-Host ""
Write-Host "URLs de exemplo:" -ForegroundColor Cyan
Write-Host "   Frontend: https://abc123.ngrok.io" -ForegroundColor White
Write-Host "   Backend:  https://def456.ngrok.io" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- As URLs mudam a cada reinicializacao" -ForegroundColor White
Write-Host "- Use para testes e demonstracoes" -ForegroundColor White
Write-Host "- Para uso permanente, configure DNS dinamico" -ForegroundColor White
Write-Host ""

# Aguardar um pouco para mostrar as URLs
Start-Sleep -Seconds 3

# Tentar obter as URLs via API do Ngrok
try {
    $ngrokInfo = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5
    if ($ngrokInfo.tunnels) {
        Write-Host "URLs ativas:" -ForegroundColor Green
        foreach ($tunnel in $ngrokInfo.tunnels) {
            Write-Host "   $($tunnel.name): $($tunnel.public_url)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "Acesse http://localhost:4040 para ver as URLs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ngrok configurado com sucesso!" -ForegroundColor Green
Write-Host "Agora voce pode acessar o AmaDelivery pela internet!" -ForegroundColor Green
