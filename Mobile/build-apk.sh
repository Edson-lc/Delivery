#!/bin/bash
# Script para Build do APK - AmaEats

echo "=== Build APK AmaEats ==="
echo ""

# Verificar se está logado
echo "1. Verificando login..."
if ! eas whoami > /dev/null 2>&1; then
    echo "❌ Você não está logado. Por favor, execute:"
    echo "   eas login"
    exit 1
fi
echo "✓ Logado"
echo ""

# Configurar projeto (se necessário)
echo "2. Configurando projeto..."
if [ ! -f "eas.json" ]; then
    echo "Configurando EAS..."
    eas build:configure
fi
echo "✓ Projeto configurado"
echo ""

# Build do APK
echo "3. Iniciando build do APK..."
echo "Este processo pode levar 15-30 minutos..."
echo ""

eas build --platform android --profile preview --non-interactive

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build iniciado com sucesso!"
    echo "Você receberá uma notificação quando o build estiver pronto."
    echo ""
    echo "Para verificar o status:"
    echo "   eas build:list"
    echo ""
    echo "Para baixar o APK quando estiver pronto:"
    echo "   eas build:download [BUILD_ID]"
else
    echo ""
    echo "❌ Erro ao iniciar build. Verifique as mensagens acima."
fi

