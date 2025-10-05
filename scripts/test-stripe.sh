#!/bin/bash

# Script de teste do sistema Stripe
# Execute este script para verificar se tudo está funcionando

echo "🧪 Testando sistema Stripe..."

# Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está rodando..."
if ! curl -s http://localhost:4000/api/public/restaurants > /dev/null; then
    echo "❌ Servidor não está rodando!"
    echo "📋 Execute: npm run dev"
    exit 1
fi

echo "✅ Servidor está rodando!"

# Verificar se as rotas do Stripe estão funcionando
echo "🔍 Testando rotas do Stripe..."

# Testar webhook (deve retornar erro de assinatura, mas não erro 404)
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/stripe/webhook)
if [ "$WEBHOOK_RESPONSE" = "400" ]; then
    echo "✅ Webhook do Stripe está funcionando (erro esperado de assinatura)"
elif [ "$WEBHOOK_RESPONSE" = "404" ]; then
    echo "❌ Webhook do Stripe não encontrado!"
    exit 1
else
    echo "⚠️  Webhook retornou código: $WEBHOOK_RESPONSE"
fi

# Verificar se o frontend está rodando
echo "🔍 Verificando se o frontend está rodando..."
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Frontend não está rodando!"
    echo "📋 Execute: npm run dev"
    exit 1
fi

echo "✅ Frontend está rodando!"

# Verificar variáveis de ambiente
echo "🔍 Verificando configuração..."

if [ -f .env ]; then
    if grep -q "STRIPE_SECRET_KEY=sk_" .env; then
        echo "✅ STRIPE_SECRET_KEY configurada"
    else
        echo "❌ STRIPE_SECRET_KEY não configurada"
    fi
    
    if grep -q "STRIPE_PUBLISHABLE_KEY=pk_" .env; then
        echo "✅ STRIPE_PUBLISHABLE_KEY configurada"
    else
        echo "❌ STRIPE_PUBLISHABLE_KEY não configurada"
    fi
    
    if grep -q "VITE_STRIPE_PUBLISHABLE_KEY=pk_" .env; then
        echo "✅ VITE_STRIPE_PUBLISHABLE_KEY configurada"
    else
        echo "❌ VITE_STRIPE_PUBLISHABLE_KEY não configurada"
    fi
else
    echo "❌ Arquivo .env não encontrado"
fi

echo ""
echo "🎉 Teste concluído!"
echo ""
echo "📋 Para testar o pagamento:"
echo "1. Acesse: http://localhost:5173"
echo "2. Adicione itens ao carrinho"
echo "3. Vá para o checkout"
echo "4. Escolha 'Cartão de Crédito/Débito'"
echo "5. Use cartão de teste: 4242 4242 4242 4242"
echo ""
echo "🔗 URLs importantes:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:4000"
echo "   API Docs: http://localhost:4000/api"
