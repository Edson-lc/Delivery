#!/bin/bash

# Script de configuração do Stripe para AmaDelivery
# Execute este script após instalar as dependências

echo "🚀 Configurando Stripe para AmaDelivery..."

# Verificar se as variáveis de ambiente estão configuradas
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📋 Copie o arquivo env.example para .env e configure as variáveis do Stripe:"
    echo "   cp env.example .env"
    echo ""
    echo "🔑 Configure as seguintes variáveis no arquivo .env:"
    echo "   STRIPE_SECRET_KEY=sk_test_..."
    echo "   STRIPE_PUBLISHABLE_KEY=pk_test_..."
    echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
    echo "   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..."
    exit 1
fi

# Verificar se as chaves do Stripe estão configuradas
if ! grep -q "STRIPE_SECRET_KEY=sk_" .env; then
    echo "❌ STRIPE_SECRET_KEY não configurada no .env"
    echo "🔑 Configure sua chave secreta do Stripe no arquivo .env"
    exit 1
fi

if ! grep -q "STRIPE_PUBLISHABLE_KEY=pk_" .env; then
    echo "❌ STRIPE_PUBLISHABLE_KEY não configurada no .env"
    echo "🔑 Configure sua chave pública do Stripe no arquivo .env"
    exit 1
fi

if ! grep -q "VITE_STRIPE_PUBLISHABLE_KEY=pk_" .env; then
    echo "❌ VITE_STRIPE_PUBLISHABLE_KEY não configurada no .env"
    echo "🔑 Configure sua chave pública do Stripe para o frontend no arquivo .env"
    exit 1
fi

echo "✅ Variáveis de ambiente do Stripe configuradas!"

# Executar migração do Prisma para adicionar campos do Stripe
echo "📊 Executando migração do banco de dados..."
cd server
npx prisma db push
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Migração do banco de dados concluída!"
else
    echo "❌ Erro na migração do banco de dados"
    exit 1
fi

cd ..

echo ""
echo "🎉 Configuração do Stripe concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o webhook do Stripe no dashboard:"
echo "   URL: https://seu-dominio.com/api/stripe/webhook"
echo "   Eventos: payment_intent.succeeded, payment_intent.payment_failed, setup_intent.succeeded"
echo ""
echo "2. Teste o sistema:"
echo "   npm run dev"
echo ""
echo "3. Use cartões de teste do Stripe:"
echo "   Cartão de sucesso: 4242 4242 4242 4242"
echo "   Cartão de falha: 4000 0000 0000 0002"
echo "   CVV: Qualquer 3 dígitos"
echo "   Data: Qualquer data futura"
echo ""
echo "🔗 Links úteis:"
echo "   Dashboard Stripe: https://dashboard.stripe.com"
echo "   Documentação: https://stripe.com/docs"
echo "   Testes: https://stripe.com/docs/testing"
