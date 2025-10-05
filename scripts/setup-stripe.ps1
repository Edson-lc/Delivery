#!/usr/bin/env pwsh

# Script de configuração do Stripe para AmaDelivery (PowerShell)
# Execute este script após instalar as dependências

Write-Host "🚀 Configurando Stripe para AmaDelivery..." -ForegroundColor Green

# Verificar se as variáveis de ambiente estão configuradas
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "📋 Copie o arquivo env.example para .env e configure as variáveis do Stripe:" -ForegroundColor Yellow
    Write-Host "   Copy-Item env.example .env" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔑 Configure as seguintes variáveis no arquivo .env:" -ForegroundColor Yellow
    Write-Host "   STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor Cyan
    Write-Host "   STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor Cyan
    Write-Host "   STRIPE_WEBHOOK_SECRET=whsec_..." -ForegroundColor Cyan
    Write-Host "   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor Cyan
    exit 1
}

# Verificar se as chaves do Stripe estão configuradas
$envContent = Get-Content ".env" -Raw

if ($envContent -notmatch "STRIPE_SECRET_KEY=sk_") {
    Write-Host "❌ STRIPE_SECRET_KEY não configurada no .env" -ForegroundColor Red
    Write-Host "🔑 Configure sua chave secreta do Stripe no arquivo .env" -ForegroundColor Yellow
    exit 1
}

if ($envContent -notmatch "STRIPE_PUBLISHABLE_KEY=pk_") {
    Write-Host "❌ STRIPE_PUBLISHABLE_KEY não configurada no .env" -ForegroundColor Red
    Write-Host "🔑 Configure sua chave pública do Stripe no arquivo .env" -ForegroundColor Yellow
    exit 1
}

if ($envContent -notmatch "VITE_STRIPE_PUBLISHABLE_KEY=pk_") {
    Write-Host "❌ VITE_STRIPE_PUBLISHABLE_KEY não configurada no .env" -ForegroundColor Red
    Write-Host "🔑 Configure sua chave pública do Stripe para o frontend no arquivo .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Variáveis de ambiente do Stripe configuradas!" -ForegroundColor Green

# Executar migração do Prisma para adicionar campos do Stripe
Write-Host "📊 Executando migração do banco de dados..." -ForegroundColor Yellow
Set-Location server

try {
    npx prisma db push
    npx prisma generate
    Write-Host "✅ Migração do banco de dados concluída!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na migração do banco de dados" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "🎉 Configuração do Stripe concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure o webhook do Stripe no dashboard:" -ForegroundColor White
Write-Host "   URL: https://seu-dominio.com/api/stripe/webhook" -ForegroundColor Cyan
Write-Host "   Eventos: payment_intent.succeeded, payment_intent.payment_failed, setup_intent.succeeded" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Teste o sistema:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Use cartões de teste do Stripe:" -ForegroundColor White
Write-Host "   Cartão de sucesso: 4242 4242 4242 4242" -ForegroundColor Cyan
Write-Host "   Cartão de falha: 4000 0000 0000 0002" -ForegroundColor Cyan
Write-Host "   CVV: Qualquer 3 dígitos" -ForegroundColor Cyan
Write-Host "   Data: Qualquer data futura" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Links úteis:" -ForegroundColor Yellow
Write-Host "   Dashboard Stripe: https://dashboard.stripe.com" -ForegroundColor Cyan
Write-Host "   Documentação: https://stripe.com/docs" -ForegroundColor Cyan
Write-Host "   Testes: https://stripe.com/docs/testing" -ForegroundColor Cyan
