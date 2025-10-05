#!/bin/bash

# Script para iniciar o AmaDelivery em modo de rede local
# Execute este script para permitir acesso de outros dispositivos na sua rede

echo "🚀 Iniciando AmaDelivery em modo de rede local..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto AmaDelivery"
    exit 1
fi

# Obter IP da máquina
ip=$(ip route get 1.1.1.1 | awk '{print $7; exit}' 2>/dev/null || ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)

if [ -z "$ip" ]; then
    echo "❌ Não foi possível detectar o IP da rede local"
    exit 1
fi

echo "📍 IP detectado: $ip"

# Criar arquivo .env.local se não existir
if [ ! -f ".env.local" ]; then
    echo "📝 Criando arquivo .env.local..."
    
    cat > .env.local << EOF
# Configuração para rede local
VITE_API_URL=http://$ip:4000/api
EOF
    
    echo "✅ Arquivo .env.local criado"
fi

# Verificar se o backend está rodando
echo "🔍 Verificando se o backend está rodando..."

if curl -s http://localhost:4000/api/public/restaurants > /dev/null 2>&1; then
    echo "✅ Backend está rodando"
else
    echo "⚠️  Backend não está rodando. Inicie o backend primeiro:"
    echo "   cd server && npm run dev"
    echo ""
fi

echo "🌐 URLs de acesso:"
echo "   Frontend: http://$ip:5173"
echo "   Backend:  http://$ip:4000"
echo "   Local:    http://localhost:5173"
echo ""

echo "📱 Para acessar de outros dispositivos:"
echo "   1. Conecte o dispositivo na mesma rede Wi-Fi"
echo "   2. Abra o navegador e acesse: http://$ip:5173"
echo ""

echo "🚀 Iniciando frontend em modo de rede..."
npm run dev:network

# Sugestões para problemas de IP dinâmico
echo ""
echo "💡 Se o IP mudar frequentemente:"
echo "   1. Execute: ./scripts/solve-ip-issues.ps1"
echo "   2. Configure IP fixo: ./scripts/setup-fixed-ip.ps1"
echo "   3. Use monitor automático: ./scripts/ip-monitor.ps1"
echo ""
